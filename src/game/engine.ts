import {
  Card,
  CommentaryLine,
  GameRules,
  GameState,
  PlayedCard,
  Player,
  Rank,
  Suit,
  Trick,
} from '../types/game';

export const ALL_SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export const ALL_RANKS: Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export const DEFAULT_RULES: GameRules = {
  targetPlayerCount: 4,
  threePlayerDeal: 'remove_2_diamonds',
  mustLeadAceOfSpades: true,
  firstTrickThullaProtection: true,
  thullaLeader: 'thulla_thrower',
  aiFillEnabled: true,
  turnTimeoutSeconds: 30,
};

/**
 * Generate a complete deck according to rule settings
 */
export function generateDeck(rules: GameRules): Card[] {
  const cards: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      // In 3-player mode with remove_2_diamonds: 51 cards
      if (
        rules.targetPlayerCount === 3 &&
        rules.threePlayerDeal === 'remove_2_diamonds' &&
        suit === 'diamonds' &&
        rank === '2'
      ) {
        continue;
      }

      cards.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: RANK_VALUES[rank],
      });
    }
  }
  return cards;
}

/**
 * Cryptographically random Fisher-Yates shuffle
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal cards to active players
 */
export function dealCards(
  deck: Card[],
  players: Player[]
): Map<string, Card[]> {
  const hands = new Map<string, Card[]>();
  players.forEach((p) => hands.set(p.id, []));

  const sortedPlayers = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
  deck.forEach((card, index) => {
    const recipient = sortedPlayers[index % sortedPlayers.length];
    hands.get(recipient.id)!.push(card);
  });

  // Sort each hand by suit and rank for great visual organization
  hands.forEach((cards, playerId) => {
    hands.set(playerId, sortHand(cards));
  });

  return hands;
}

/**
 * Sort cards by suit then rank value
 */
export function sortHand(cards: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = {
    spades: 0,
    hearts: 1,
    clubs: 2,
    diamonds: 3,
  };
  return [...cards].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return a.value - b.value;
  });
}

/**
 * Identify player holding Ace of Spades (Hukam ka Ikka)
 */
export function findAceOfSpadesHolder(hands: Map<string, Card[]>): string | null {
  for (const [playerId, cards] of hands.entries()) {
    if (cards.some((c) => c.suit === 'spades' && c.rank === 'A')) {
      return playerId;
    }
  }
  return null;
}

/**
 * Determine legal cards a player can play for current trick
 */
export function getLegalCards(
  cards: Card[],
  currentTrick: Trick,
  rules: GameRules
): Card[] {
  if (!cards || cards.length === 0) return [];

  // If leading the trick (no cards played yet)
  if (!currentTrick.leadSuit || currentTrick.cards.length === 0) {
    // If first trick of the match and rule requires Ace of Spades
    if (currentTrick.trickNumber === 1 && rules.mustLeadAceOfSpades) {
      const aceSpades = cards.find((c) => c.suit === 'spades' && c.rank === 'A');
      if (aceSpades) {
        return [aceSpades];
      }
    }
    // Any card can be led
    return [...cards];
  }

  // Must follow lead suit if held
  const matchingSuitCards = cards.filter((c) => c.suit === currentTrick.leadSuit);
  if (matchingSuitCards.length > 0) {
    return matchingSuitCards;
  }

  // Player has no cards of the lead suit -> Can play ANY off-suit card (Thulla!)
  return [...cards];
}

/**
 * Get next eligible non-escaped player in clockwise order
 */
export function getNextPlayerId(
  currentPlayerId: string,
  players: Player[]
): string | null {
  const activePlayers = players.filter((p) => !p.hasEscaped);
  if (activePlayers.length <= 1) return null;

  const sorted = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
  const currentIndex = sorted.findIndex((p) => p.id === currentPlayerId);
  if (currentIndex === -1) return activePlayers[0]?.id || null;

  for (let i = 1; i <= sorted.length; i++) {
    const nextIdx = (currentIndex + i) % sorted.length;
    const candidate = sorted[nextIdx];
    if (!candidate.hasEscaped) {
      return candidate.id;
    }
  }
  return null;
}

export interface TrickResult {
  isThulla: boolean;
  thullaPlayerId: string | null;
  penaltyPlayerId: string | null;
  winnerPlayerId: string | null;
  cardsToCollect: Card[];
  nextLeadPlayerId: string;
}

/**
 * Server-authoritative resolution of a completed trick
 */
export function evaluateTrick(
  trick: Trick,
  players: Player[],
  rules: GameRules
): TrickResult {
  const leadSuit = trick.leadSuit;
  if (!leadSuit || trick.cards.length === 0) {
    throw new Error('Cannot evaluate empty trick');
  }

  // Check if first trick has Thulla protection
  const isFirstTrick = trick.trickNumber === 1;
  const isProtectedFirstTrick = isFirstTrick && rules.firstTrickThullaProtection;

  // Find off-suit plays
  let offSuitPlay: PlayedCard | null = null;
  if (!isProtectedFirstTrick) {
    offSuitPlay = trick.cards.find((p) => p.card.suit !== leadSuit) || null;
  }

  // Find card with highest rank in the lead suit
  const leadSuitPlays = trick.cards.filter((p) => p.card.suit === leadSuit);
  if (leadSuitPlays.length === 0) {
    throw new Error('No lead suit cards played in trick');
  }

  // Highest lead suit card
  const highestLeadPlay = leadSuitPlays.reduce((highest, current) => {
    return current.card.value > highest.card.value ? current : highest;
  }, leadSuitPlays[0]);

  if (offSuitPlay) {
    // THULLA occurred!
    const thullaPlayerId = offSuitPlay.playerId;
    const penaltyPlayerId = highestLeadPlay.playerId;

    // Penalty player collects all cards in trick
    const cardsToCollect = trick.cards.map((p) => p.card);

    // Determine who leads next trick
    let nextLeadPlayerId =
      rules.thullaLeader === 'thulla_thrower'
        ? thullaPlayerId
        : penaltyPlayerId;

    // If that player escaped, advance to next eligible player
    const leadPlayerObj = players.find((p) => p.id === nextLeadPlayerId);
    if (!leadPlayerObj || leadPlayerObj.hasEscaped) {
      nextLeadPlayerId = getNextPlayerId(nextLeadPlayerId, players) || penaltyPlayerId;
    }

    return {
      isThulla: true,
      thullaPlayerId,
      penaltyPlayerId,
      winnerPlayerId: null,
      cardsToCollect,
      nextLeadPlayerId,
    };
  } else {
    // Clean trick, no Thulla
    const winnerPlayerId = highestLeadPlay.playerId;
    let nextLeadPlayerId = winnerPlayerId;

    const winnerObj = players.find((p) => p.id === winnerPlayerId);
    if (!winnerObj || winnerObj.hasEscaped) {
      nextLeadPlayerId = getNextPlayerId(winnerPlayerId, players) || winnerPlayerId;
    }

    return {
      isThulla: false,
      thullaPlayerId: null,
      penaltyPlayerId: null,
      winnerPlayerId,
      cardsToCollect: [], // Cleared to discard pile
      nextLeadPlayerId,
    };
  }
}

/**
 * Intelligent AI bot card selection
 */
export function chooseBotCard(
  botCards: Card[],
  currentTrick: Trick,
  rules: GameRules
): Card {
  const legalCards = getLegalCards(botCards, currentTrick, rules);
  if (legalCards.length === 0) {
    throw new Error('Bot has no legal cards');
  }
  if (legalCards.length === 1) {
    return legalCards[0];
  }

  // Case 1: Bot is leading the trick
  if (!currentTrick.leadSuit || currentTrick.cards.length === 0) {
    // If must lead ♠A
    const aceSpades = legalCards.find(
      (c) => c.suit === 'spades' && c.rank === 'A'
    );
    if (aceSpades) return aceSpades;

    // Strategic lead: Lead from a suit with few cards to exhaust it,
    // or lead a low card (2-7) to remain safe
    const suitCounts: Record<Suit, number> = {
      spades: 0,
      hearts: 0,
      diamonds: 0,
      clubs: 0,
    };
    botCards.forEach((c) => suitCounts[c.suit]++);

    // Sort suits by smallest count > 0
    const nonZeroSuits = ALL_SUITS.filter((s) => suitCounts[s] > 0).sort(
      (a, b) => suitCounts[a] - suitCounts[b]
    );

    // Pick lowest card in lowest-count suit
    const targetSuit = nonZeroSuits[0];
    const suitCards = legalCards
      .filter((c) => c.suit === targetSuit)
      .sort((a, b) => a.value - b.value);

    return suitCards[0] || legalCards[0];
  }

  // Case 2: Bot is following suit (holding lead suit)
  const isFollowingLead = legalCards.every(
    (c) => c.suit === currentTrick.leadSuit
  );

  if (isFollowingLead) {
    const leadSuitCards = currentTrick.cards.filter(
      (p) => p.card.suit === currentTrick.leadSuit
    );
    const highestPlayed = Math.max(...leadSuitCards.map((p) => p.card.value));
    const alreadyHasThulla = currentTrick.cards.some(
      (p) => p.card.suit !== currentTrick.leadSuit
    );

    if (alreadyHasThulla) {
      // Someone already Thulla'd! The highest lead card holder collects!
      // Try to play LOWER than highest played so we don't take the penalty!
      const lowerCards = legalCards
        .filter((c) => c.value < highestPlayed)
        .sort((a, b) => b.value - a.value); // Highest among the lower (dump medium)

      if (lowerCards.length > 0) {
        return lowerCards[0];
      }
      // If we must be higher than current highest, play lowest higher card
      return legalCards.sort((a, b) => a.value - b.value)[0];
    } else {
      // No Thulla yet. Playing too high risks getting Thulla'd by a player behind us!
      // Prefer low or medium cards
      const sorted = [...legalCards].sort((a, b) => a.value - b.value);
      return sorted[0]; // Play lowest safe card
    }
  }

  // Case 3: Bot can THULLA! (Has no cards in lead suit)
  // Dump highest dangerous card (Ace, King, Queen) of another long suit!
  const sortedDangerous = [...legalCards].sort((a, b) => b.value - a.value);
  return sortedDangerous[0];
}

/**
 * Rich authentic commentary lines in Urdu script, Roman transliteration, and English
 */
export const COMMENTARY_BANK: CommentaryLine[] = [
  {
    id: 'thulla-1',
    textUrdu: 'اوئے، ٹھُلا لگ گیا!',
    textTranslit: 'Oye, Thulla lag gaya!',
    textEnglish: 'Boom! Thulla has been struck!',
    category: 'thulla',
  },
  {
    id: 'thulla-2',
    textUrdu: 'کھاؤ اب سارے پتے!',
    textTranslit: 'Khao ab saaray pattay!',
    textEnglish: 'Eat all these cards now!',
    category: 'thulla',
  },
  {
    id: 'thulla-3',
    textUrdu: 'کیا زبردست ٹھُلا مارا ہے!',
    textTranslit: 'Kya zabardast Thulla mara hai!',
    textEnglish: 'What a devastating Thulla strike!',
    category: 'thulla',
  },
  {
    id: 'escape-1',
    textUrdu: 'شکر ہے، میں بچ گیا!',
    textTranslit: 'Bach gaya!',
    textEnglish: 'Escaped safe and sound!',
    category: 'escape',
  },
  {
    id: 'escape-2',
    textUrdu: 'پہلا نمبر! شاباش!',
    textTranslit: 'Pehla number! Shabash!',
    textEnglish: 'First out! Well played!',
    category: 'escape',
  },
  {
    id: 'ace-1',
    textUrdu: 'حکم کا ایکہ پھینکو!',
    textTranslit: 'Hukam ka Ikka phenko!',
    textEnglish: 'Lead with the Ace of Spades!',
    category: 'ace_spades',
  },
  {
    id: 'bhabhi-1',
    textUrdu: 'ہائے ہائے! بھابھی بن گیا!',
    textTranslit: 'Bhabhi ban gaya!',
    textEnglish: 'Oh no! Declared the Bhabhi!',
    category: 'bhabhi',
  },
  {
    id: 'praise-1',
    textUrdu: 'واہ، کیا چال چلی ہے!',
    textTranslit: 'Wah, kya chaal hai!',
    textEnglish: 'Magnificent strategic move!',
    category: 'praise',
  },
  {
    id: 'turn-1',
    textUrdu: 'اب تمہاری باری ہے، سوچ سمجھ کر!',
    textTranslit: 'Ab tumhari baari hai!',
    textEnglish: "It's your turn now, think wisely!",
    category: 'turn',
  },
];

export function getRandomCommentary(
  category: CommentaryLine['category']
): CommentaryLine {
  const filtered = COMMENTARY_BANK.filter((c) => c.category === category);
  return filtered[Math.floor(Math.random() * filtered.length)] || COMMENTARY_BANK[0];
}
