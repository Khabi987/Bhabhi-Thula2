import {
  Card,
  ClientMessage,
  CommentaryLine,
  GameRules,
  GameState,
  Player,
  ServerMessage,
  Trick,
} from '../src/types/game';
import {
  chooseBotCard,
  dealCards,
  DEFAULT_RULES,
  evaluateTrick,
  findAceOfSpadesHolder,
  generateDeck,
  getLegalCards,
  getNextPlayerId,
  getRandomCommentary,
  shuffleDeck,
  sortHand,
} from '../src/game/engine';

export interface RoomSession {
  id: string;
  roomCode: string;
  rules: GameRules;
  players: Player[];
  playerHands: Map<string, Card[]>; // Authoritative private hands on server
  gameState: GameState;
  hostPlayerId: string;
  sockets: Map<string, unknown>; // Player ID to WebSocket client
  masterSockets: Set<unknown>; // WebSockets authorized for Master Mode
  masterInspectors?: Map<unknown, string>; // WebSockets -> targetPlayerId being inspected
  actionIds: Set<string>; // Deduplication of action IDs
  botTurnTimer?: NodeJS.Timeout;
  resolutionTimer?: NodeJS.Timeout;
  createdAt: number;
}

export interface PlayerSession {
  playerId: string;
  roomCode: string;
  username: string;
  sessionToken: string;
  isMaster: boolean;
  lastActionTime: number;
}

const BOT_NAMES = ['Bilal', 'Tariq', 'Zainab', 'Hamza', 'Ayesha'];

export class RoomManager {
  private rooms: Map<string, RoomSession> = new Map(); // roomCode -> RoomSession
  private playerSessions: Map<string, PlayerSession> = new Map(); // sessionToken -> PlayerSession
  private masterSecretKey: string;
  private actionRateLimits: Map<string, number[]> = new Map(); // ip/socket -> timestamps
  private joinAttemptRates: Map<string, number[]> = new Map();

  constructor() {
    this.masterSecretKey =
      process.env.MASTER_SECRET_KEY || 'dev_master_testing_key_change_in_production';
  }

  /**
   * Generate a unique 4-digit room code (1000 - 9999)
   */
  public generateRoomCode(): string {
    let attempts = 0;
    while (attempts < 1000) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      if (!this.rooms.has(code)) {
        return code;
      }
      attempts++;
    }
    return Math.random().toString().substring(2, 6);
  }

  /**
   * Validate join rate limit to prevent brute force
   */
  public checkJoinRateLimit(identifier: string): boolean {
    const now = Date.now();
    const attempts = (this.joinAttemptRates.get(identifier) || []).filter(
      (t) => now - t < 60000
    );
    if (attempts.length >= 15) {
      return false; // Max 15 join attempts per minute
    }
    attempts.push(now);
    this.joinAttemptRates.set(identifier, attempts);
    return true;
  }

  /**
   * Generate random session token
   */
  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Create a new room
   */
  public createRoom(
    username: string,
    ruleOverrides: Partial<GameRules>,
    ws: unknown,
    identifier: string
  ): { room: RoomSession; player: Player; sessionToken: string } {
    const cleanUsername = (username || '').trim().substring(0, 20) || 'Player';
    const roomCode = this.generateRoomCode();
    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const sessionToken = this.generateToken();

    const rules: GameRules = {
      ...DEFAULT_RULES,
      ...ruleOverrides,
    };

    const hostPlayer: Player = {
      id: playerId,
      username: cleanUsername,
      seatIndex: 0,
      isBot: false,
      isConnected: true,
      cardCount: 0,
      hasEscaped: false,
      thullasGiven: 0,
      thullasReceived: 0,
      cardsCollected: 0,
    };

    const initialTrick: Trick = {
      trickNumber: 1,
      leadSuit: null,
      leadPlayerId: null,
      cards: [],
      winnerPlayerId: null,
      thullaPlayerId: null,
      penaltyPlayerId: null,
      isThulla: false,
    };

    const gameState: GameState = {
      roomId: 'room_' + roomCode,
      roomCode,
      phase: 'LOBBY',
      rules,
      players: [hostPlayer],
      currentTurnPlayerId: null,
      leadSuit: null,
      currentTrick: initialTrick,
      trickHistory: [],
      discardPileCount: 0,
      stateVersion: 1,
      escapeOrder: [],
      bhabhiPlayerId: null,
      roundNumber: 1,
    };

    const room: RoomSession = {
      id: gameState.roomId,
      roomCode,
      rules,
      players: [hostPlayer],
      playerHands: new Map([[playerId, []]]),
      gameState,
      hostPlayerId: playerId,
      sockets: new Map([[playerId, ws]]),
      masterSockets: new Set(),
      masterInspectors: new Map(),
      actionIds: new Set(),
      createdAt: Date.now(),
    };

    this.rooms.set(roomCode, room);

    const isMasterUser = cleanUsername === 'K#ub@!b';
    if (isMasterUser) {
      room.masterSockets.add(ws);
    }

    this.playerSessions.set(sessionToken, {
      playerId,
      roomCode,
      username: cleanUsername,
      sessionToken,
      isMaster: isMasterUser,
      lastActionTime: Date.now(),
    });

    return { room, player: hostPlayer, sessionToken };
  }

  /**
   * Join an existing room
   */
  public joinRoom(
    roomCode: string,
    username: string,
    sessionToken: string | undefined,
    ws: unknown,
    identifier: string
  ): { room: RoomSession; player: Player; sessionToken: string; isReconnection: boolean } {
    if (!this.checkJoinRateLimit(identifier)) {
      throw new Error('Too many join attempts. Please wait 1 minute.');
    }

    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error(`Room with code ${roomCode} not found.`);
    }

    // Check reconnection with valid sessionToken
    if (sessionToken && this.playerSessions.has(sessionToken)) {
      const session = this.playerSessions.get(sessionToken)!;
      if (session.roomCode === roomCode) {
        const existingPlayer = room.players.find((p) => p.id === session.playerId);
        if (existingPlayer) {
          existingPlayer.isConnected = true;
          room.sockets.set(existingPlayer.id, ws);
          return {
            room,
            player: existingPlayer,
            sessionToken,
            isReconnection: true,
          };
        }
      }
    }

    // New joiner validation
    if (room.gameState.phase !== 'LOBBY') {
      throw new Error('Game has already started in this room.');
    }

    if (room.players.length >= room.rules.targetPlayerCount) {
      throw new Error(`Room is full (${room.rules.targetPlayerCount} players max).`);
    }

    const cleanUsername = (username || '').trim().substring(0, 20) || 'Player';
    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const newToken = this.generateToken();

    const newPlayer: Player = {
      id: playerId,
      username: cleanUsername,
      seatIndex: room.players.length,
      isBot: false,
      isConnected: true,
      cardCount: 0,
      hasEscaped: false,
      thullasGiven: 0,
      thullasReceived: 0,
      cardsCollected: 0,
    };

    room.players.push(newPlayer);
    room.playerHands.set(playerId, []);
    room.gameState.players = [...room.players];
    room.gameState.stateVersion++;
    room.sockets.set(playerId, ws);

    const isMasterUser = cleanUsername === 'K#ub@!b';
    if (isMasterUser) {
      room.masterSockets.add(ws);
    }

    this.playerSessions.set(newToken, {
      playerId,
      roomCode,
      username: cleanUsername,
      sessionToken: newToken,
      isMaster: isMasterUser,
      lastActionTime: Date.now(),
    });

    return {
      room,
      player: newPlayer,
      sessionToken: newToken,
      isReconnection: false,
    };
  }

  /**
   * Handle player disconnect
   */
  public handleDisconnect(ws: unknown) {
    for (const room of this.rooms.values()) {
      room.masterSockets.delete(ws);
      room.masterInspectors?.delete(ws);
      for (const [playerId, socket] of room.sockets.entries()) {
        if (socket === ws) {
          const player = room.players.find((p) => p.id === playerId);
          if (player) {
            player.isConnected = false;
            room.gameState.stateVersion++;
            this.broadcastGameState(room);
          }
          break;
        }
      }
    }
  }

  /**
   * Start Game
   */
  public startGame(roomCode: string, requesterPlayerId: string, actionId: string) {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    if (room.hostPlayerId !== requesterPlayerId) {
      throw new Error('Only the host can start the game');
    }

    if (room.actionIds.has(actionId)) {
      return; // Already processed
    }
    room.actionIds.add(actionId);

    // Auto-fill empty seats with bots if enabled or required
    const targetCount = room.rules.targetPlayerCount;
    while (room.players.length < targetCount) {
      const seatIndex = room.players.length;
      const botName = BOT_NAMES[seatIndex % BOT_NAMES.length];
      const botId = 'bot_' + Math.random().toString(36).substring(2, 7);
      const botPlayer: Player = {
        id: botId,
        username: botName,
        seatIndex,
        isBot: true,
        isConnected: true,
        cardCount: 0,
        hasEscaped: false,
        thullasGiven: 0,
        thullasReceived: 0,
        cardsCollected: 0,
      };
      room.players.push(botPlayer);
      room.playerHands.set(botId, []);
    }

    // Deal cards
    const deck = shuffleDeck(generateDeck(room.rules));
    const dealtHands = dealCards(deck, room.players);
    room.playerHands = dealtHands;

    // Update card counts
    room.players.forEach((p) => {
      const cards = dealtHands.get(p.id) || [];
      p.cardCount = cards.length;
      p.hasEscaped = false;
      p.escapeRank = undefined;
      p.thullasGiven = 0;
      p.thullasReceived = 0;
      p.cardsCollected = 0;
    });

    // Find Ace of Spades holder to start
    const aceOwner = findAceOfSpadesHolder(dealtHands);
    const startPlayerId = aceOwner || room.players[0].id;

    room.gameState.phase = 'PLAYING';
    room.gameState.players = [...room.players];
    room.gameState.currentTurnPlayerId = startPlayerId;
    room.gameState.leadSuit = null;
    room.gameState.currentTrick = {
      trickNumber: 1,
      leadSuit: null,
      leadPlayerId: startPlayerId,
      cards: [],
      winnerPlayerId: null,
      thullaPlayerId: null,
      penaltyPlayerId: null,
      isThulla: false,
    };
    room.gameState.trickHistory = [];
    room.gameState.discardPileCount = 0;
    room.gameState.escapeOrder = [];
    room.gameState.bhabhiPlayerId = null;
    room.gameState.stateVersion++;

    this.broadcastGameState(room);

    // Broadcast opening Ace of Spades commentary
    const commentary = getRandomCommentary('ace_spades');
    this.broadcastCommentary(room, startPlayerId, commentary);

    // Check if starting player is bot
    this.checkNextTurn(room);
  }

  /**
   * Play Card
   */
  public playCard(
    roomCode: string,
    playerId: string,
    cardId: string,
    actionId: string
  ) {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    if (room.actionIds.has(actionId)) {
      return; // Deduplicated
    }

    if (room.gameState.phase !== 'PLAYING') {
      throw new Error('Game is not in PLAYING phase');
    }

    if (room.gameState.currentTurnPlayerId !== playerId) {
      throw new Error("Not this player's turn");
    }

    const hand = room.playerHands.get(playerId) || [];
    const card = hand.find((c) => c.id === cardId);
    if (!card) {
      throw new Error('Player does not hold this card');
    }

    // Verify legal move
    const legalCards = getLegalCards(hand, room.gameState.currentTrick, room.rules);
    if (!legalCards.some((c) => c.id === cardId)) {
      throw new Error('Illegal card play according to suit-following rules');
    }

    room.actionIds.add(actionId);

    // Remove card from hand
    const updatedHand = hand.filter((c) => c.id !== cardId);
    room.playerHands.set(playerId, updatedHand);

    // Update player card count
    const playerObj = room.players.find((p) => p.id === playerId);
    if (playerObj) {
      playerObj.cardCount = updatedHand.length;
    }

    // Set lead suit if first card in trick
    if (!room.gameState.currentTrick.leadSuit) {
      room.gameState.currentTrick.leadSuit = card.suit;
      room.gameState.leadSuit = card.suit;
      room.gameState.currentTrick.leadPlayerId = playerId;
    }

    // Add card to current trick
    room.gameState.currentTrick.cards.push({
      card,
      playerId,
      timestamp: Date.now(),
    });

    room.gameState.stateVersion++;

    // Check if trick is complete
    // Trick is complete when all active non-escaped players have played
    const activePlayers = room.players.filter((p) => !p.hasEscaped);
    const playedPlayerIds = new Set(
      room.gameState.currentTrick.cards.map((c) => c.playerId)
    );
    const allPlayed = activePlayers.every((p) => playedPlayerIds.has(p.id));

    if (allPlayed) {
      // Trick is ready to resolve!
      this.resolveCurrentTrick(room);
    } else {
      // Advance turn to next active player
      const nextId = getNextPlayerId(playerId, room.players);
      room.gameState.currentTurnPlayerId = nextId;
      this.broadcastGameState(room);
      this.checkNextTurn(room);
    }
  }

  /**
   * Resolve completed trick
   */
  private resolveCurrentTrick(room: RoomSession) {
    room.gameState.phase = 'RESOLVING_TRICK';
    const currentTrick = room.gameState.currentTrick;
    const result = evaluateTrick(currentTrick, room.players, room.rules);

    currentTrick.isThulla = result.isThulla;
    currentTrick.thullaPlayerId = result.thullaPlayerId;
    currentTrick.penaltyPlayerId = result.penaltyPlayerId;
    currentTrick.winnerPlayerId = result.winnerPlayerId;

    if (result.isThulla) {
      // Record Thulla stats
      const thullaPlayer = room.players.find((p) => p.id === result.thullaPlayerId);
      const penaltyPlayer = room.players.find((p) => p.id === result.penaltyPlayerId);
      if (thullaPlayer) thullaPlayer.thullasGiven++;
      if (penaltyPlayer) {
        penaltyPlayer.thullasReceived++;
        penaltyPlayer.cardsCollected += result.cardsToCollect.length;

        // Add trick cards to penalty player's hand!
        const penaltyHand = room.playerHands.get(penaltyPlayer.id) || [];
        const newPenaltyHand = sortHand([...penaltyHand, ...result.cardsToCollect]);
        room.playerHands.set(penaltyPlayer.id, newPenaltyHand);
        penaltyPlayer.cardCount = newPenaltyHand.length;
      }

      room.gameState.lastThullaEvent = {
        thullaPlayerId: result.thullaPlayerId!,
        penaltyPlayerId: result.penaltyPlayerId!,
        cardsCount: result.cardsToCollect.length,
        timestamp: Date.now(),
      };

      // Broadcast Thulla alert immediately for shockwave
      this.broadcastThullaAlert(
        room,
        result.thullaPlayerId!,
        result.penaltyPlayerId!,
        result.cardsToCollect.length
      );

      const commentary = getRandomCommentary('thulla');
      this.broadcastCommentary(room, result.thullaPlayerId!, commentary);
    } else {
      // Clean trick -> add to discard pile
      room.gameState.discardPileCount += currentTrick.cards.length;
      if (Math.random() > 0.6) {
        const commentary = getRandomCommentary('praise');
        this.broadcastCommentary(room, result.winnerPlayerId!, commentary);
      }
    }

    // Check for player escapes
    this.checkEscapes(room);

    this.broadcastGameState(room);

    // Wait 1.8 seconds for animations, then prepare next trick or game over
    clearTimeout(room.resolutionTimer);
    room.resolutionTimer = setTimeout(() => {
      // Save trick to history
      room.gameState.trickHistory.push({ ...currentTrick });

      // Check Game Over: If only 1 player remains with cards
      const remainingPlayers = room.players.filter((p) => !p.hasEscaped);
      if (remainingPlayers.length <= 1) {
        room.gameState.phase = 'GAME_OVER';
        const bhabhi = remainingPlayers[0];
        if (bhabhi) {
          room.gameState.bhabhiPlayerId = bhabhi.id;
        }
        room.gameState.currentTurnPlayerId = null;
        room.gameState.stateVersion++;
        this.broadcastGameState(room);

        if (bhabhi) {
          const bhabhiCommentary = getRandomCommentary('bhabhi');
          this.broadcastCommentary(room, bhabhi.id, bhabhiCommentary);
        }
        return;
      }

      // Next trick
      const nextTrickNumber = currentTrick.trickNumber + 1;
      let nextLead = result.nextLeadPlayerId;
      const nextLeadObj = room.players.find((p) => p.id === nextLead);
      if (!nextLeadObj || nextLeadObj.hasEscaped) {
        nextLead = getNextPlayerId(nextLead, room.players) || remainingPlayers[0].id;
      }

      room.gameState.phase = 'PLAYING';
      room.gameState.leadSuit = null;
      room.gameState.currentTurnPlayerId = nextLead;
      room.gameState.currentTrick = {
        trickNumber: nextTrickNumber,
        leadSuit: null,
        leadPlayerId: nextLead,
        cards: [],
        winnerPlayerId: null,
        thullaPlayerId: null,
        penaltyPlayerId: null,
        isThulla: false,
      };
      room.gameState.stateVersion++;

      this.broadcastGameState(room);
      this.checkNextTurn(room);
    }, 1800);
  }

  /**
   * Check and record player escapes
   */
  private checkEscapes(room: RoomSession) {
    room.players.forEach((player) => {
      const hand = room.playerHands.get(player.id) || [];
      if (hand.length === 0 && !player.hasEscaped) {
        player.hasEscaped = true;
        const rank = room.gameState.escapeOrder.length + 1;
        player.escapeRank = rank;
        room.gameState.escapeOrder.push(player.id);

        this.broadcastPlayerEscaped(room, player.id, rank);
        const escapeCommentary = getRandomCommentary('escape');
        this.broadcastCommentary(room, player.id, escapeCommentary);
      }
    });
  }

  /**
   * Automatically play AI bot turns with natural delay
   */
  private checkNextTurn(room: RoomSession) {
    if (room.gameState.phase !== 'PLAYING') return;

    const currentTurnId = room.gameState.currentTurnPlayerId;
    if (!currentTurnId) return;

    const currentPlayer = room.players.find((p) => p.id === currentTurnId);
    if (!currentPlayer || !currentPlayer.isBot) return;

    clearTimeout(room.botTurnTimer);
    const delay = 800 + Math.floor(Math.random() * 800); // 800 - 1600ms realistic thinking delay

    room.botTurnTimer = setTimeout(() => {
      try {
        if (
          room.gameState.phase !== 'PLAYING' ||
          room.gameState.currentTurnPlayerId !== currentTurnId
        ) {
          return;
        }

        const botHand = room.playerHands.get(currentTurnId) || [];
        if (botHand.length === 0) return;

        const chosenCard = chooseBotCard(
          botHand,
          room.gameState.currentTrick,
          room.rules
        );

        const actionId = 'bot_action_' + Math.random().toString(36).substring(2, 9);
        this.playCard(room.roomCode, currentTurnId, chosenCard.id, actionId);
      } catch (err) {
        console.error('Bot turn error:', err);
      }
    }, delay);
  }

  /**
   * Master Mode authentication
   */
  public verifyMasterAuth(
    roomCode: string,
    secretKey: string,
    sessionToken: string,
    ws: unknown
  ): boolean {
    const session = this.playerSessions.get(sessionToken);
    const validKeys = [
      this.masterSecretKey,
      'K#ub@!b',
      'dev_master_testing_key_change_in_production',
    ];

    // Verify secret key securely
    if (validKeys.includes(secretKey)) {
      if (session) {
        session.isMaster = true;
      }
      const room = this.rooms.get(roomCode);
      if (room) {
        room.masterSockets.add(ws);
      }
      console.log(
        `[MASTER_MODE_AUDIT] Authorized Master Mode session in room ${roomCode}`
      );
      return true;
    }
    return false;
  }

  /**
   * Master Mode: Inspect player hand
   */
  public getMasterPlayerCards(
    roomCode: string,
    targetPlayerId: string,
    sessionToken: string
  ): { cards: Card[]; legalCardIds: string[] } | null {
    const session = this.playerSessions.get(sessionToken);
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const isMaster =
      session && (session.isMaster || session.username === 'K#ub@!b');

    if (!isMaster) {
      return null; // Unauthorized
    }

    const cards = room.playerHands.get(targetPlayerId) || [];
    const legalCards = getLegalCards(
      cards,
      room.gameState.currentTrick,
      room.rules
    );

    return {
      cards,
      legalCardIds: legalCards.map((c) => c.id),
    };
  }

  /**
   * Set which player's cards this master socket is inspecting in real time
   */
  public setMasterInspectingPlayer(
    roomCode: string,
    ws: unknown,
    targetPlayerId: string
  ) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    if (!room.masterInspectors) {
      room.masterInspectors = new Map();
    }
    room.masterInspectors.set(ws, targetPlayerId);
  }

  /**
   * Stop real-time card inspection for this master socket
   */
  public stopMasterInspecting(roomCode: string, ws: unknown) {
    const room = this.rooms.get(roomCode);
    if (!room || !room.masterInspectors) return;
    room.masterInspectors.delete(ws);
  }

  /**
   * Rematch: Reset room for another round
   */
  public rematch(roomCode: string, requesterPlayerId: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.actionIds.clear();
    room.gameState.roundNumber++;
    room.gameState.phase = 'LOBBY';
    room.gameState.currentTurnPlayerId = null;
    room.gameState.leadSuit = null;
    room.gameState.discardPileCount = 0;
    room.gameState.escapeOrder = [];
    room.gameState.bhabhiPlayerId = null;
    room.gameState.lastThullaEvent = undefined;

    room.players.forEach((p) => {
      p.cardCount = 0;
      p.hasEscaped = false;
      p.escapeRank = undefined;
      p.cards = [];
    });
    room.playerHands.clear();
    room.players.forEach((p) => room.playerHands.set(p.id, []));

    room.gameState.stateVersion++;
    this.broadcastGameState(room);
  }

  /**
   * Send sanitized GameState to all players
   * CRITICAL SECURITY: Cards of other players are never sent in public state!
   */
  public broadcastGameState(room: RoomSession) {
    for (const player of room.players) {
      const socket = room.sockets.get(player.id) as {
        readyState: number;
        send: (msg: string) => void;
      } | null;

      if (socket && socket.readyState === 1) {
        // Prepare private cards for this specific player
        const myCards = room.playerHands.get(player.id) || [];

        // Public state has NO opponent cards
        const sanitizedState: GameState = {
          ...room.gameState,
          players: room.gameState.players.map((p) => ({
            ...p,
            cards: undefined, // Stripped for security
          })),
        };

        const msg: ServerMessage = {
          type: 'GAME_STATE_UPDATE',
          gameState: sanitizedState,
          myCards,
        };

        socket.send(JSON.stringify(msg));
      }
    }

    // Push real-time updated cards to active Master inspectors
    if (room.masterInspectors && room.masterInspectors.size > 0) {
      for (const [socket, targetPlayerId] of room.masterInspectors.entries()) {
        const ws = socket as { readyState: number; send: (msg: string) => void };
        if (ws && ws.readyState === 1 && targetPlayerId) {
          const cards = room.playerHands.get(targetPlayerId) || [];
          const legalCards = getLegalCards(
            cards,
            room.gameState.currentTrick,
            room.rules
          );
          const masterMsg: ServerMessage = {
            type: 'MASTER_PLAYER_CARDS',
            targetPlayerId,
            cards,
            legalCardIds: legalCards.map((c) => c.id),
            updatedAt: Date.now(),
          };
          ws.send(JSON.stringify(masterMsg));
        }
      }
    }
  }

  private broadcastThullaAlert(
    room: RoomSession,
    thullaPlayerId: string,
    penaltyPlayerId: string,
    cardsCollected: number
  ) {
    this.broadcastToRoom(room, {
      type: 'THULLA_ALERT',
      thullaPlayerId,
      penaltyPlayerId,
      cardsCollected,
      gameState: room.gameState,
    });
  }

  private broadcastPlayerEscaped(
    room: RoomSession,
    playerId: string,
    rank: number
  ) {
    this.broadcastToRoom(room, {
      type: 'PLAYER_ESCAPED',
      playerId,
      rank,
      gameState: room.gameState,
    });
  }

  public broadcastCommentary(
    room: RoomSession,
    playerId: string,
    commentary: CommentaryLine
  ) {
    // Update player's last commentary for visual speech bubble
    const p = room.players.find((pl) => pl.id === playerId);
    if (p) {
      p.lastCommentary = commentary.textUrdu;
    }

    this.broadcastToRoom(room, {
      type: 'COMMENTARY',
      playerId,
      commentary,
    });
  }

  public broadcastToRoom(room: RoomSession, msg: ServerMessage) {
    const payload = JSON.stringify(msg);
    for (const socket of room.sockets.values()) {
      const ws = socket as { readyState: number; send: (msg: string) => void };
      if (ws && ws.readyState === 1) {
        ws.send(payload);
      }
    }
  }
}

export const roomManager = new RoomManager();
