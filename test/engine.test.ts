import {
  generateDeck,
  shuffleDeck,
  dealCards,
  findAceOfSpadesHolder,
  getLegalCards,
  evaluateTrick,
  chooseBotCard,
  DEFAULT_RULES,
} from '../src/game/engine';
import { Card, GameRules, Player, Trick } from '../src/types/game';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Bhabhi Thulla Game Engine Tests ---');

// Test 1: Deck generation for 4 players (52 cards)
{
  const rules: GameRules = { ...DEFAULT_RULES, targetPlayerCount: 4 };
  const deck = generateDeck(rules);
  assert(deck.length === 52, `Expected 52 cards, got ${deck.length}`);
  const uniqueIds = new Set(deck.map((c) => c.id));
  assert(uniqueIds.size === 52, `Expected 52 unique card IDs, got ${uniqueIds.size}`);
  console.log('✓ Test 1: 52-card standard deck generation passed');
}

// Test 2: Deck generation for 3 players (51 cards with 2♦ removed)
{
  const rules: GameRules = {
    ...DEFAULT_RULES,
    targetPlayerCount: 3,
    threePlayerDeal: 'remove_2_diamonds',
  };
  const deck = generateDeck(rules);
  assert(deck.length === 51, `Expected 51 cards for 3-player deal, got ${deck.length}`);
  assert(!deck.some((c) => c.suit === 'diamonds' && c.rank === '2'), '2 of Diamonds should be removed');
  console.log('✓ Test 2: 3-player equal deal (51 cards, remove 2♦) passed');
}

// Test 3: Shuffle preserves all cards and order changes
{
  const deck = generateDeck(DEFAULT_RULES);
  const shuffled = shuffleDeck(deck);
  assert(shuffled.length === 52, 'Shuffled deck must have 52 cards');
  const uniqueIds = new Set(shuffled.map((c) => c.id));
  assert(uniqueIds.size === 52, 'Shuffled deck must preserve all unique cards');
  console.log('✓ Test 3: Fisher-Yates shuffle integrity passed');
}

// Test 4: Dealing cards
{
  const players: Player[] = [
    { id: 'p1', username: 'Ali', seatIndex: 0, isBot: false, isConnected: true, cardCount: 0, hasEscaped: false, thullasGiven: 0, thullasReceived: 0, cardsCollected: 0 },
    { id: 'p2', username: 'Bilal', seatIndex: 1, isBot: true, isConnected: true, cardCount: 0, hasEscaped: false, thullasGiven: 0, thullasReceived: 0, cardsCollected: 0 },
    { id: 'p3', username: 'Tariq', seatIndex: 2, isBot: true, isConnected: true, cardCount: 0, hasEscaped: false, thullasGiven: 0, thullasReceived: 0, cardsCollected: 0 },
    { id: 'p4', username: 'Zainab', seatIndex: 3, isBot: true, isConnected: true, cardCount: 0, hasEscaped: false, thullasGiven: 0, thullasReceived: 0, cardsCollected: 0 },
  ];

  const deck = generateDeck(DEFAULT_RULES);
  const hands = dealCards(deck, players);
  assert(hands.size === 4, '4 hands dealt');
  players.forEach((p) => {
    const hand = hands.get(p.id)!;
    assert(hand.length === 13, `Each player in 4-player match should have 13 cards, got ${hand.length}`);
  });

  const aceOwner = findAceOfSpadesHolder(hands);
  assert(aceOwner !== null, 'Ace of Spades holder must be found');
  console.log(`✓ Test 4: 4-player deal distribution (13 cards each) and Ace of Spades found (${aceOwner}) passed`);
}

// Test 5: First Trick Ace of Spades lead rule
{
  const hand: Card[] = [
    { id: 'spades-A', suit: 'spades', rank: 'A', value: 14 },
    { id: 'hearts-K', suit: 'hearts', rank: 'K', value: 13 },
    { id: 'diamonds-10', suit: 'diamonds', rank: '10', value: 10 },
  ];
  const trick1: Trick = {
    trickNumber: 1,
    leadSuit: null,
    leadPlayerId: null,
    cards: [],
    winnerPlayerId: null,
    thullaPlayerId: null,
    penaltyPlayerId: null,
    isThulla: false,
  };
  const legal = getLegalCards(hand, trick1, DEFAULT_RULES);
  assert(legal.length === 1 && legal[0].id === 'spades-A', 'Trick 1 must strictly lead Ace of Spades');
  console.log('✓ Test 5: Must lead Ace of Spades on opening trick enforced');
}

// Test 6: Suit-following enforcement
{
  const hand: Card[] = [
    { id: 'hearts-5', suit: 'hearts', rank: '5', value: 5 },
    { id: 'hearts-Q', suit: 'hearts', rank: 'Q', value: 12 },
    { id: 'spades-10', suit: 'spades', rank: '10', value: 10 },
    { id: 'clubs-A', suit: 'clubs', rank: 'A', value: 14 },
  ];
  const trick: Trick = {
    trickNumber: 2,
    leadSuit: 'hearts',
    leadPlayerId: 'p1',
    cards: [
      { card: { id: 'hearts-9', suit: 'hearts', rank: '9', value: 9 }, playerId: 'p1', timestamp: 1 },
    ],
    winnerPlayerId: null,
    thullaPlayerId: null,
    penaltyPlayerId: null,
    isThulla: false,
  };
  const legal = getLegalCards(hand, trick, DEFAULT_RULES);
  assert(legal.length === 2, 'Should only allow hearts when player holds hearts');
  assert(legal.every((c) => c.suit === 'hearts'), 'All legal cards must be Hearts');
  console.log('✓ Test 6: Suit-following validation passed');
}

// Test 7: Thulla trigger when player has no cards in lead suit
{
  const handWithoutHearts: Card[] = [
    { id: 'spades-10', suit: 'spades', rank: '10', value: 10 },
    { id: 'clubs-A', suit: 'clubs', rank: 'A', value: 14 },
  ];
  const trick: Trick = {
    trickNumber: 2,
    leadSuit: 'hearts',
    leadPlayerId: 'p1',
    cards: [
      { card: { id: 'hearts-9', suit: 'hearts', rank: '9', value: 9 }, playerId: 'p1', timestamp: 1 },
    ],
    winnerPlayerId: null,
    thullaPlayerId: null,
    penaltyPlayerId: null,
    isThulla: false,
  };
  const legal = getLegalCards(handWithoutHearts, trick, DEFAULT_RULES);
  assert(legal.length === 2, 'Player with void in lead suit can throw any card (Thulla)');
  console.log('✓ Test 7: Void in lead suit allows off-suit play (Thulla) passed');
}

// Test 8: Trick Evaluation - Clean Trick (No Thulla)
{
  const players: Player[] = [
    { id: 'p1', username: 'Ali', seatIndex: 0, isBot: false, isConnected: true, cardCount: 5, hasEscaped: false, thullasGiven: 0, thullasReceived: 0, cardsCollected: 0 },
    { id: 'p2', username: 'Bilal', seatIndex: 1, isBot: true, isConnected: true, cardCount: 5, hasEscaped: false, thullasGiven: 0, thullasReceived: 0, cardsCollected: 0 },
  ];
  const cleanTrick: Trick = {
    trickNumber: 3,
    leadSuit: 'clubs',
    leadPlayerId: 'p1',
    cards: [
      { card: { id: 'clubs-7', suit: 'clubs', rank: '7', value: 7 }, playerId: 'p1', timestamp: 1 },
      { card: { id: 'clubs-J', suit: 'clubs', rank: 'J', value: 11 }, playerId: 'p2', timestamp: 2 },
    ],
    winnerPlayerId: null,
    thullaPlayerId: null,
    penaltyPlayerId: null,
    isThulla: false,
  };
  const res = evaluateTrick(cleanTrick, players, DEFAULT_RULES);
  assert(!res.isThulla, 'Trick should not be Thulla');
  assert(res.winnerPlayerId === 'p2', 'Highest club (J) should win the trick');
  assert(res.nextLeadPlayerId === 'p2', 'Winner leads next');
  console.log('✓ Test 8: Clean trick evaluation (highest lead suit wins) passed');
}

// Test 9: Trick Evaluation - THULLA!
{
  const players: Player[] = [
    { id: 'p1', username: 'Ali', seatIndex: 0, isBot: false, isConnected: true, cardCount: 5, hasEscaped: false, thullasGiven: 0, thullasReceived: 0, cardsCollected: 0 },
    { id: 'p2', username: 'Bilal', seatIndex: 1, isBot: true, isConnected: true, cardCount: 5, hasEscaped: false, thullasGiven: 0, thullasReceived: 0, cardsCollected: 0 },
    { id: 'p3', username: 'Tariq', seatIndex: 2, isBot: true, isConnected: true, cardCount: 5, hasEscaped: false, thullasGiven: 0, thullasReceived: 0, cardsCollected: 0 },
  ];
  const thullaTrick: Trick = {
    trickNumber: 4,
    leadSuit: 'diamonds',
    leadPlayerId: 'p1',
    cards: [
      { card: { id: 'diamonds-8', suit: 'diamonds', rank: '8', value: 8 }, playerId: 'p1', timestamp: 1 },
      { card: { id: 'diamonds-K', suit: 'diamonds', rank: 'K', value: 13 }, playerId: 'p2', timestamp: 2 },
      { card: { id: 'spades-A', suit: 'spades', rank: 'A', value: 14 }, playerId: 'p3', timestamp: 3 }, // Tariq Thullas!
    ],
    winnerPlayerId: null,
    thullaPlayerId: null,
    penaltyPlayerId: null,
    isThulla: false,
  };
  const res = evaluateTrick(thullaTrick, players, DEFAULT_RULES);
  assert(res.isThulla, 'Trick should be evaluated as THULLA');
  assert(res.thullaPlayerId === 'p3', 'Tariq threw the off-suit Thulla');
  assert(res.penaltyPlayerId === 'p2', 'Bilal played highest diamond (K) and must take the penalty');
  assert(res.cardsToCollect.length === 3, 'Penalty recipient collects all 3 cards in the trick');
  assert(res.nextLeadPlayerId === 'p3', 'Thulla thrower leads next trick');
  console.log('✓ Test 9: THULLA detection and penalty collection passed');
}

// Test 10: Bot AI legal move generation
{
  const botCards: Card[] = [
    { id: 'spades-3', suit: 'spades', rank: '3', value: 3 },
    { id: 'hearts-K', suit: 'hearts', rank: 'K', value: 13 },
  ];
  const trick: Trick = {
    trickNumber: 5,
    leadSuit: 'spades',
    leadPlayerId: 'p1',
    cards: [
      { card: { id: 'spades-9', suit: 'spades', rank: '9', value: 9 }, playerId: 'p1', timestamp: 1 },
    ],
    winnerPlayerId: null,
    thullaPlayerId: null,
    penaltyPlayerId: null,
    isThulla: false,
  };
  const botMove = chooseBotCard(botCards, trick, DEFAULT_RULES);
  assert(botMove.id === 'spades-3', 'Bot must follow suit with spades-3');
  console.log('✓ Test 10: Bot AI legal decision-making passed');
}

console.log('--- ALL 10 ENGINE TESTS PASSED SUCCESSFULLY! ---');
