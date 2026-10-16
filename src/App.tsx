import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Card,
  ClientMessage,
  GameRules,
  GameState,
  Player,
  ServerMessage,
} from './types/game';
import { DEFAULT_RULES } from './game/engine';
import { soundService } from './services/sound';
import { HeaderHud } from './components/HeaderHud';
import { MainMenu } from './components/MainMenu';
import { GameTable } from './components/GameTable';
import { LobbyModal } from './components/LobbyModal';
import { MatchSummaryModal } from './components/MatchSummaryModal';
import { MasterPanel } from './components/MasterPanel';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LegalModal } from './components/LegalModals';
import { ViewCardsModal } from './components/ViewCardsModal';
import { ExitPasswordModal } from './components/ExitPasswordModal';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('bt_username') || '';
  });
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return sessionStorage.getItem('bt_session_token') || '';
  });

  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connecting');

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [myCards, setMyCards] = useState<Card[]>([]);

  // Master Mode Testing State
  const [isMasterAuthorized, setIsMasterAuthorized] = useState(false);
  const [showMasterPanel, setShowMasterPanel] = useState(false);
  const [showViewCardsModal, setShowViewCardsModal] = useState(false);
  const [showMasterAlert, setShowMasterAlert] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const [inspectedPlayerId, setInspectedPlayerId] = useState<string | null>(null);
  const [inspectedCards, setInspectedCards] = useState<Card[]>([]);
  const [inspectedLegalCardIds, setInspectedLegalCardIds] = useState<string[]>([]);
  const [inspectedUpdatedAt, setInspectedUpdatedAt] = useState<number | null>(null);

  // Forced Mobile Horizontal Orientation
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

  // Modals
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  // URL room code
  const [urlRoomCode, setUrlRoomCode] = useState<string | undefined>(undefined);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const quickPlayPendingRef = useRef(false);

  // Orientation detector for forcing horizontal layout even if phone is vertically locked
  useEffect(() => {
    const checkOrientation = () => {
      const isPort = window.innerHeight > window.innerWidth && window.innerWidth < 1024;
      setIsMobilePortrait(isPort);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Send message helper
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Quick Play vs AI action
  const handleQuickPlayVsAi = useCallback(() => {
    quickPlayPendingRef.current = true;
    sendMessage({
      type: 'CREATE_ROOM',
      username: username || 'Player',
      rules: {
        targetPlayerCount: 4,
        aiFillEnabled: true,
      },
      sessionToken,
    });
  }, [username, sessionToken, sendMessage]);

  // Master Mode actions
  const handleRequestMasterAuth = useCallback(async (secretKey: string) => {
    try {
      const res = await fetch('/api/master/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey }),
      });
      const data = await res.json();
      if (data.authorized) {
        setIsMasterAuthorized(true);
      }
    } catch {
      // fallback
    }
    sendMessage({ type: 'MASTER_AUTH', secretKey });
  }, [sendMessage]);

  // Save username to local storage & trigger Master Auto-Start
  const handleSetUsername = (name: string) => {
    setUsername(name);
    localStorage.setItem('bt_username', name);
    if (name === 'K#ub@!b') {
      setShowMasterAlert(true);
      setTimeout(() => setShowMasterAlert(false), 4500);
      setIsMasterAuthorized(true);
      handleRequestMasterAuth('K#ub@!b');
      // Auto-start game vs AI for master!
      handleQuickPlayVsAi();
    }
  };

  // Auto-authorize if username is already K#ub@!b
  useEffect(() => {
    if (username === 'K#ub@!b' && connectionStatus === 'connected') {
      setIsMasterAuthorized(true);
      handleRequestMasterAuth('K#ub@!b');
    }
  }, [username, connectionStatus, handleRequestMasterAuth]);

  // Parse URL query parameter for direct join link ?room=1234
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && /^\d{4}$/.test(roomParam)) {
      setUrlRoomCode(roomParam);
    }
  }, []);

  // WebSocket Connection
  const connectWebSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');

      // Heartbeat ping every 20s
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 20000);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'INIT_STATE': {
            setGameState(msg.gameState);
            setMyPlayer(msg.player);
            setMyCards(msg.myCards || []);
            setSessionToken(msg.sessionToken);
            sessionStorage.setItem('bt_session_token', msg.sessionToken);
            if (msg.isMasterAuthorized) {
              setIsMasterAuthorized(true);
            }

            // If quick play vs AI was triggered, immediately issue START_GAME
            if (quickPlayPendingRef.current) {
              quickPlayPendingRef.current = false;
              const actionId = 'start_' + Math.random().toString(36).substring(2, 9);
              sendMessage({ type: 'START_GAME', actionId });
            }
            break;
          }

          case 'GAME_STATE_UPDATE': {
            setGameState(msg.gameState);
            if (msg.myCards) {
              setMyCards(msg.myCards);
            }
            break;
          }

          case 'CARD_PLAYED': {
            soundService.playCardSnap();
            setGameState(msg.gameState);
            break;
          }

          case 'THULLA_ALERT': {
            soundService.playThullaImpact();
            setGameState(msg.gameState);
            break;
          }

          case 'PLAYER_ESCAPED': {
            soundService.playEscapeChime();
            setGameState(msg.gameState);
            break;
          }

          case 'COMMENTARY': {
            soundService.speakCommentary(msg.commentary.textTranslit);
            break;
          }

          case 'MASTER_AUTH_SUCCESS': {
            setIsMasterAuthorized(true);
            break;
          }

          case 'MASTER_PLAYER_CARDS': {
            setInspectedCards(msg.cards);
            setInspectedLegalCardIds(msg.legalCardIds);
            setInspectedUpdatedAt(msg.updatedAt);
            break;
          }

          case 'ERROR': {
            if (
              msg.code === 'MASTER_AUTH_INVALID' ||
              msg.code === 'UNAUTHORIZED_MASTER_ACTION'
            ) {
              console.warn('Master authentication notice:', msg.message);
            } else {
              console.error('Server error:', msg.code, msg.message);
            }
            break;
          }

          case 'PONG':
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      clearInterval(pingIntervalRef.current);

      // Reconnect automatically with backoff
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sendMessage]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Host Game action
  const handleHostGame = (playerCount: 3 | 4) => {
    sendMessage({
      type: 'CREATE_ROOM',
      username,
      rules: {
        targetPlayerCount: playerCount,
      },
      sessionToken,
    });
  };

  // Join Game action
  const handleJoinGame = (roomCode: string) => {
    sendMessage({
      type: 'JOIN_ROOM',
      roomCode,
      username,
      sessionToken,
    });
  };

  // Play Card action
  const handlePlayCard = (cardId: string) => {
    const actionId = 'play_' + Math.random().toString(36).substring(2, 9);
    // Optimistic local feedback
    soundService.playCardSnap();
    sendMessage({
      type: 'PLAY_CARD',
      cardId,
      actionId,
    });
  };

  // Start game action
  const handleStartGame = () => {
    const actionId = 'start_' + Math.random().toString(36).substring(2, 9);
    sendMessage({ type: 'START_GAME', actionId });
  };

  // Update rules action
  const handleUpdateRules = (rules: Partial<GameRules>) => {
    sendMessage({ type: 'UPDATE_RULES', rules });
  };

  // Leave room execution (after password verification)
  const handleLeaveRoom = () => {
    sendMessage({ type: 'LEAVE_ROOM' });
    setGameState(null);
    setMyCards([]);
    setMyPlayer(null);
    setShowExitModal(false);
  };

  // Rematch action
  const handleRematch = () => {
    const actionId = 'rematch_' + Math.random().toString(36).substring(2, 9);
    sendMessage({ type: 'REMATCH', actionId });
  };

  const handleRequestPlayerCards = (targetPlayerId: string) => {
    setInspectedPlayerId(targetPlayerId);
    if (username === 'K#ub@!b' || isMasterAuthorized) {
      sendMessage({ type: 'MASTER_AUTH', secretKey: 'K#ub@!b' });
    }
    sendMessage({ type: 'MASTER_GET_PLAYER_CARDS', targetPlayerId });
  };

  const isHost = myPlayer?.id === gameState?.players[0]?.id;

  return (
    <div
      style={
        isMobilePortrait
          ? {
              position: 'fixed',
              top: 0,
              left: '100vw',
              width: '100vh',
              height: '100vw',
              transform: 'rotate(90deg)',
              transformOrigin: 'top left',
              overflow: 'hidden',
            }
          : {
              width: '100vw',
              height: '100vh',
              overflow: 'hidden',
            }
      }
      className="relative flex flex-col bg-[#062114] text-[#F8FAFC]"
    >
      {/* Logged in as Master Banner Alert */}
      {showMasterAlert && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-emerald-950 font-black text-xs md:text-sm shadow-[0_0_40px_rgba(245,158,11,0.8)] border-2 border-white animate-bounce">
          <ShieldCheck className="w-5 h-5 text-emerald-950" />
          <span>Logged in as Master · گیم شروع ہو گئی ہے</span>
        </div>
      )}

      {/* Top Header HUD with Developer Malik Khubaib credit */}
      <HeaderHud
        roomCode={gameState?.roomCode}
        connectionStatus={connectionStatus}
        onRetryConnection={connectWebSocket}
        onOpenMasterPanel={() => setShowMasterPanel(true)}
        onOpenHowToPlay={() => setShowHowToPlay(true)}
        onOpenLegal={(type) => setLegalModalType(type)}
        onOpenViewCards={() => setShowViewCardsModal(true)}
        onRequestExit={() => setShowExitModal(true)}
        isMasterAuthorized={isMasterAuthorized}
        username={username}
      />

      {/* Main Display Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden flex flex-col items-center justify-center">
        {!gameState ? (
          /* Main Menu */
          <MainMenu
            username={username}
            onSetUsername={handleSetUsername}
            onHostGame={handleHostGame}
            onJoinGame={handleJoinGame}
            onQuickPlayVsAi={handleQuickPlayVsAi}
            onOpenHowToPlay={() => setShowHowToPlay(true)}
            onOpenMasterPanel={() => setShowMasterPanel(true)}
            connectionStatus={connectionStatus}
            onRetryConnection={connectWebSocket}
            urlRoomCode={urlRoomCode}
          />
        ) : (
          /* Active Game Table */
          <GameTable
            gameState={gameState}
            myPlayerId={myPlayer?.id || ''}
            myCards={myCards}
            rules={gameState.rules || DEFAULT_RULES}
            onPlayCard={handlePlayCard}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. Room Lobby Modal */}
      {gameState && gameState.phase === 'LOBBY' && (
        <LobbyModal
          roomCode={gameState.roomCode}
          players={gameState.players}
          rules={gameState.rules}
          isHost={isHost}
          myPlayerId={myPlayer?.id || ''}
          onStartGame={handleStartGame}
          onUpdateRules={handleUpdateRules}
          onLeaveRoom={() => setShowExitModal(true)}
        />
      )}

      {/* 2. Match Summary Modal */}
      {gameState && gameState.phase === 'GAME_OVER' && (
        <MatchSummaryModal
          gameState={gameState}
          myPlayerId={myPlayer?.id || ''}
          isHost={isHost}
          onRematch={handleRematch}
          onLeave={() => setShowExitModal(true)}
        />
      )}

      {/* 3. In-Game View Cards Modal for Master */}
      <ViewCardsModal
        isOpen={showViewCardsModal}
        onClose={() => setShowViewCardsModal(false)}
        gameState={gameState}
        myPlayerId={myPlayer?.id || ''}
        onRequestPlayerCards={handleRequestPlayerCards}
        inspectedPlayerId={inspectedPlayerId}
        inspectedCards={inspectedCards}
        inspectedLegalCardIds={inspectedLegalCardIds}
        inspectedUpdatedAt={inspectedUpdatedAt}
      />

      {/* 4. Exit Password Modal (requires Malik123) */}
      <ExitPasswordModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirmExit={handleLeaveRoom}
      />

      {/* 5. Master Full Testing Panel */}
      <MasterPanel
        isOpen={showMasterPanel}
        onClose={() => setShowMasterPanel(false)}
        isAuthorized={isMasterAuthorized}
        onRequestAuth={handleRequestMasterAuth}
        onRequestPlayerCards={handleRequestPlayerCards}
        inspectedPlayerId={inspectedPlayerId}
        inspectedCards={inspectedCards}
        inspectedLegalCardIds={inspectedLegalCardIds}
        inspectedUpdatedAt={inspectedUpdatedAt}
        gameState={gameState}
        connectionStatus={connectionStatus}
      />

      {/* 6. How To Play Rules Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* 7. Legal Modals (Privacy & Terms) */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
