/**
 * Core type definitions for Bhabhi Thulla card game
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export interface Card {
  id: string; // e.g. "spades-A"
  suit: Suit;
  rank: Rank;
  value: number; // 2..14 (Ace = 14)
}

export type PlayerRole = 'host' | 'player';

export interface Player {
  id: string;
  username: string;
  seatIndex: number;
  isBot: boolean;
  isConnected: boolean;
  cardCount: number;
  cards?: Card[]; // Only provided to the owner or authorized master session
  hasEscaped: boolean;
  escapeRank?: number; // 1 = 1st out (Winner), 2 = 2nd out, etc.
  thullasGiven: number;
  thullasReceived: number;
  cardsCollected: number;
  lastCommentary?: string;
}

export type GamePhase =
  | 'LOBBY'
  | 'DEALING'
  | 'PLAYING'
  | 'RESOLVING_TRICK'
  | 'GAME_OVER';

export interface PlayedCard {
  card: Card;
  playerId: string;
  timestamp: number;
}

export interface Trick {
  trickNumber: number;
  leadSuit: Suit | null;
  leadPlayerId: string | null;
  cards: PlayedCard[];
  winnerPlayerId: string | null;
  thullaPlayerId: string | null; // Player who threw off-suit causing Thulla
  penaltyPlayerId: string | null; // Player with highest lead suit card who collects
  isThulla: boolean;
}

export interface GameRules {
  targetPlayerCount: 3 | 4;
  threePlayerDeal: 'remove_2_diamonds' | 'uneven_18_17_17'; // 51 vs 52
  mustLeadAceOfSpades: boolean; // First trick must start with ♠A
  firstTrickThullaProtection: boolean; // Traditional: no Thulla on ♠A opening trick
  thullaLeader: 'thulla_thrower' | 'penalty_recipient'; // Who leads next after Thulla
  aiFillEnabled: boolean;
  turnTimeoutSeconds: number; // 30s standard
}

export interface GameState {
  roomId: string;
  roomCode: string;
  phase: GamePhase;
  rules: GameRules;
  players: Player[];
  currentTurnPlayerId: string | null;
  leadSuit: Suit | null;
  currentTrick: Trick;
  trickHistory: Trick[];
  discardPileCount: number;
  stateVersion: number;
  escapeOrder: string[]; // Player IDs in order of escape
  bhabhiPlayerId: string | null;
  roundNumber: number;
  lastThullaEvent?: {
    thullaPlayerId: string;
    penaltyPlayerId: string;
    cardsCount: number;
    timestamp: number;
  };
}

export interface RoomMetadata {
  id: string;
  roomCode: string;
  hostPlayerId: string;
  createdAt: number;
  rules: GameRules;
  playerCount: number;
  isGameActive: boolean;
}

export interface CommentaryLine {
  id: string;
  textUrdu: string;
  textTranslit: string;
  textEnglish: string;
  category: 'thulla' | 'escape' | 'ace_spades' | 'bhabhi' | 'praise' | 'turn';
}

// WebSocket message protocols
export type ClientMessage =
  | { type: 'JOIN_ROOM'; roomCode: string; username: string; sessionToken?: string }
  | { type: 'CREATE_ROOM'; username: string; rules: Partial<GameRules>; sessionToken?: string }
  | { type: 'START_GAME'; actionId: string }
  | { type: 'UPDATE_RULES'; rules: Partial<GameRules> }
  | { type: 'PLAY_CARD'; actionId: string; cardId: string }
  | { type: 'TOGGLE_AI_SLOT'; seatIndex: number }
  | { type: 'LEAVE_ROOM' }
  | { type: 'REMATCH'; actionId: string }
  | { type: 'MASTER_AUTH'; secretKey: string }
  | { type: 'MASTER_GET_PLAYER_CARDS'; targetPlayerId: string }
  | { type: 'MASTER_STOP_INSPECTING' }
  | { type: 'PING' };

export type ServerMessage =
  | {
      type: 'INIT_STATE';
      player: Player;
      myCards: Card[];
      gameState: GameState;
      sessionToken: string;
      isMasterAuthorized?: boolean;
    }
  | {
      type: 'GAME_STATE_UPDATE';
      gameState: GameState;
      myCards?: Card[];
    }
  | {
      type: 'CARD_PLAYED';
      playerId: string;
      card: Card;
      nextTurnPlayerId: string | null;
      gameState: GameState;
    }
  | {
      type: 'THULLA_ALERT';
      thullaPlayerId: string;
      penaltyPlayerId: string;
      cardsCollected: number;
      gameState: GameState;
    }
  | {
      type: 'PLAYER_ESCAPED';
      playerId: string;
      rank: number;
      gameState: GameState;
    }
  | {
      type: 'GAME_OVER';
      bhabhiPlayerId: string;
      escapeOrder: string[];
      gameState: GameState;
    }
  | {
      type: 'COMMENTARY';
      playerId: string;
      commentary: CommentaryLine;
    }
  | {
      type: 'MASTER_AUTH_SUCCESS';
      isAuthorized: boolean;
    }
  | {
      type: 'MASTER_PLAYER_CARDS';
      targetPlayerId: string;
      cards: Card[];
      legalCardIds: string[];
      updatedAt: number;
    }
  | {
      type: 'ERROR';
      code: string;
      message: string;
    }
  | {
      type: 'PONG';
    };
