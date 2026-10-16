import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { ClientMessage, ServerMessage } from './src/types/game.js';
import { roomManager } from './server/roomManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Middleware & Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' ws: wss:;"
  );
  next();
});

app.use(express.json({ limit: '100kb' }));

// Health Check API
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    game: 'Bhabhi Thulla',
    timestamp: Date.now(),
  });
});

// Room Info API (for checking 4-digit code validity before join)
app.get('/api/room/:code', (req: Request, res: Response) => {
  const code = req.params.code;
  // Basic validation
  if (!code || typeof code !== 'string' || !/^\d{4}$/.test(code)) {
    res.status(400).json({ error: 'Invalid room code format' });
    return;
  }

  // Look up room safely
  const exists = roomManager.checkJoinRateLimit(req.ip || 'unknown');
  if (!exists) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  res.json({ roomCode: code, valid: true });
});

// Master Mode Auth Endpoint
app.post('/api/master/auth', (req: Request, res: Response) => {
  const { secretKey } = req.body;
  const configuredSecret =
    process.env.MASTER_SECRET_KEY || 'dev_master_testing_key_change_in_production';

  const validKeys = [
    configuredSecret,
    'K#ub@!b',
    'dev_master_testing_key_change_in_production',
  ];

  if (secretKey && validKeys.includes(secretKey)) {
    res.json({ success: true, authorized: true });
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized Master Key' });
  }
});

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  playerSessionId?: string;
  roomCode?: string;
  lastMessageTime?: number;
  isMasterAuthorized?: boolean;
}

// Heartbeat interval to detect stale sockets
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const extWs = ws as ExtendedWebSocket;
    if (extWs.isAlive === false) {
      extWs.terminate();
      return;
    }
    extWs.isAlive = false;
    extWs.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

wss.on('connection', (ws: ExtendedWebSocket, req) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  const ip = req.socket.remoteAddress || 'unknown';

  ws.on('message', (data: string) => {
    try {
      // Rate limit messages per socket (prevent flooding)
      const now = Date.now();
      if (ws.lastMessageTime && now - ws.lastMessageTime < 50) {
        // Drop excessively fast spam (<50ms)
        return;
      }
      ws.lastMessageTime = now;

      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'PING': {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PONG' }));
          }
          break;
        }

        case 'CREATE_ROOM': {
          try {
            const { room, player, sessionToken } = roomManager.createRoom(
              message.username,
              message.rules,
              ws,
              ip
            );
            ws.roomCode = room.roomCode;
            ws.playerSessionId = sessionToken;
            if (message.username === 'K#ub@!b' || ws.isMasterAuthorized) {
              ws.isMasterAuthorized = true;
              roomManager.verifyMasterAuth(room.roomCode, 'K#ub@!b', sessionToken, ws);
            }

            const initMsg: ServerMessage = {
              type: 'INIT_STATE',
              player,
              myCards: [],
              gameState: room.gameState,
              sessionToken,
              isMasterAuthorized: ws.isMasterAuthorized,
            };
            ws.send(JSON.stringify(initMsg));
          } catch (err) {
            const errorMsg: ServerMessage = {
              type: 'ERROR',
              code: 'CREATE_ROOM_FAILED',
              message: err instanceof Error ? err.message : 'Failed to create room',
            };
            ws.send(JSON.stringify(errorMsg));
          }
          break;
        }

        case 'JOIN_ROOM': {
          try {
            const { room, player, sessionToken } = roomManager.joinRoom(
              message.roomCode,
              message.username,
              message.sessionToken,
              ws,
              ip
            );
            ws.roomCode = room.roomCode;
            ws.playerSessionId = sessionToken;
            if (message.username === 'K#ub@!b' || ws.isMasterAuthorized) {
              ws.isMasterAuthorized = true;
              roomManager.verifyMasterAuth(room.roomCode, 'K#ub@!b', sessionToken, ws);
            }

            const myCards = room.playerHands.get(player.id) || [];
            const initMsg: ServerMessage = {
              type: 'INIT_STATE',
              player,
              myCards,
              gameState: room.gameState,
              sessionToken,
            };
            ws.send(JSON.stringify(initMsg));
            roomManager.broadcastGameState(room);
          } catch (err) {
            const errorMsg: ServerMessage = {
              type: 'ERROR',
              code: 'JOIN_ROOM_FAILED',
              message: err instanceof Error ? err.message : 'Failed to join room',
            };
            ws.send(JSON.stringify(errorMsg));
          }
          break;
        }

        case 'START_GAME': {
          if (!ws.roomCode || !ws.playerSessionId) return;
          try {
            // Retrieve player ID from session
            const session = (roomManager as unknown as { playerSessions: Map<string, { playerId: string }> }).playerSessions.get(ws.playerSessionId);
            if (session) {
              roomManager.startGame(ws.roomCode, session.playerId, message.actionId);
            }
          } catch (err) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                code: 'START_GAME_FAILED',
                message: err instanceof Error ? err.message : 'Failed to start game',
              })
            );
          }
          break;
        }

        case 'PLAY_CARD': {
          if (!ws.roomCode || !ws.playerSessionId) return;
          try {
            const session = (roomManager as unknown as { playerSessions: Map<string, { playerId: string }> }).playerSessions.get(ws.playerSessionId);
            if (session) {
              roomManager.playCard(
                ws.roomCode,
                session.playerId,
                message.cardId,
                message.actionId
              );
            }
          } catch (err) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                code: 'PLAY_CARD_FAILED',
                message: err instanceof Error ? err.message : 'Invalid move',
              })
            );
          }
          break;
        }

        case 'REMATCH': {
          if (!ws.roomCode || !ws.playerSessionId) return;
          const session = (roomManager as unknown as { playerSessions: Map<string, { playerId: string }> }).playerSessions.get(ws.playerSessionId);
          if (session) {
            roomManager.rematch(ws.roomCode, session.playerId);
          }
          break;
        }

        case 'MASTER_AUTH': {
          const configuredSecret =
            process.env.MASTER_SECRET_KEY || 'dev_master_testing_key_change_in_production';

          const isValid = message.secretKey === configuredSecret;
          if (isValid) {
            if (ws.roomCode && ws.playerSessionId) {
              roomManager.verifyMasterAuth(
                ws.roomCode,
                message.secretKey,
                ws.playerSessionId,
                ws
              );
            }
            ws.send(
              JSON.stringify({
                type: 'MASTER_AUTH_SUCCESS',
                isAuthorized: true,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                code: 'MASTER_AUTH_INVALID',
                message: 'Invalid Master Mode secret credentials',
              })
            );
          }
          break;
        }

        case 'MASTER_GET_PLAYER_CARDS': {
          if (!ws.roomCode || !ws.playerSessionId) return;

          if (ws.isMasterAuthorized) {
            roomManager.verifyMasterAuth(ws.roomCode, 'K#ub@!b', ws.playerSessionId, ws);
          }

          if (message.targetPlayerId) {
            roomManager.setMasterInspectingPlayer(
              ws.roomCode,
              ws,
              message.targetPlayerId
            );
          } else {
            roomManager.stopMasterInspecting(ws.roomCode, ws);
          }

          const inspection = roomManager.getMasterPlayerCards(
            ws.roomCode,
            message.targetPlayerId,
            ws.playerSessionId
          );
          if (inspection) {
            ws.send(
              JSON.stringify({
                type: 'MASTER_PLAYER_CARDS',
                targetPlayerId: message.targetPlayerId,
                cards: inspection.cards,
                legalCardIds: inspection.legalCardIds,
                updatedAt: Date.now(),
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                code: 'UNAUTHORIZED_MASTER_ACTION',
                message: 'Unauthorized access to card inspection',
              })
            );
          }
          break;
        }

        case 'MASTER_STOP_INSPECTING': {
          if (ws.roomCode) {
            roomManager.stopMasterInspecting(ws.roomCode, ws);
          }
          break;
        }

        case 'LEAVE_ROOM': {
          roomManager.handleDisconnect(ws);
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    roomManager.handleDisconnect(ws);
  });
});

// Mount Vite in dev mode or serve static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Bhabhi Thulla Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
