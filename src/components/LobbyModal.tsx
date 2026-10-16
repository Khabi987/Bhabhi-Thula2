import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { GameRules, Player } from '../types/game';
import {
  Users,
  Copy,
  Check,
  Play,
  LogOut,
  Settings,
  Bot,
  User,
  Crown,
  QrCode,
} from 'lucide-react';

interface LobbyModalProps {
  roomCode: string;
  players: Player[];
  rules: GameRules;
  isHost: boolean;
  myPlayerId: string;
  onStartGame: () => void;
  onUpdateRules: (rules: Partial<GameRules>) => void;
  onLeaveRoom: () => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  roomCode,
  players,
  rules,
  isHost,
  myPlayerId,
  onStartGame,
  onUpdateRules,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQr, setShowQr] = useState(false);
  const [showRulesConfig, setShowRulesConfig] = useState(false);

  // Generate QR code for room join
  useEffect(() => {
    if (!roomCode) return;
    const joinUrl = `${window.location.origin}?room=${roomCode}`;
    QRCode.toDataURL(joinUrl, {
      width: 200,
      margin: 1.5,
      color: {
        dark: '#062114',
        light: '#FAF8F5',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [roomCode]);

  const handleCopyLink = () => {
    const joinUrl = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const targetCount = rules.targetPlayerCount;
  const emptySlotsCount = Math.max(0, targetCount - players.length);
  const emptySlots = Array.from({ length: emptySlotsCount });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl flex flex-col rounded-3xl bg-[#062114] border-2 border-amber-500/70 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-emerald-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black font-serif text-amber-300">
              Lobby · بیٹھک
            </h2>
            <p className="text-xs text-emerald-400">
              Waiting for players to assemble ({players.length}/{targetCount})
            </p>
          </div>

          {/* 4-digit Room Code Box */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-amber-400/80 uppercase font-semibold">
              Room Code
            </span>
            <div className="flex items-center gap-1.5 bg-emerald-900/90 border border-amber-500/60 px-3 py-1 rounded-xl shadow">
              <span className="font-mono text-xl font-black text-amber-300 tracking-widest">
                {roomCode}
              </span>
              <button
                onClick={handleCopyLink}
                className="text-amber-400 hover:text-white transition p-1"
                title="Copy Room Link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-amber-400 hover:text-white transition p-1"
                title="Show QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* QR Code expansion */}
        {showQr && qrDataUrl && (
          <div className="p-4 bg-emerald-950/90 border-b border-emerald-800 flex flex-col items-center">
            <div className="p-2 bg-white rounded-2xl shadow-xl mb-2">
              <img src={qrDataUrl} alt="Room QR Code" className="w-40 h-40" />
            </div>
            <p className="text-xs text-emerald-300 text-center font-medium">
              Scan with phone camera to instantly join this room
            </p>
          </div>
        )}

        {/* Body: Player Slots */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Connected Players
            </span>

            {isHost && (
              <button
                onClick={() => setShowRulesConfig(!showRulesConfig)}
                className="flex items-center gap-1 text-xs text-emerald-300 hover:text-amber-300 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{showRulesConfig ? 'Hide Rules' : 'Configure Rules'}</span>
              </button>
            )}
          </div>

          {/* Rules Configuration Toggle Box */}
          {showRulesConfig && isHost && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-amber-500/30 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Player Count:</span>
                <div className="flex gap-1">
                  {[3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() =>
                        onUpdateRules({ targetPlayerCount: count as 3 | 4 })
                      }
                      className={`px-3 py-1 rounded-lg font-bold ${
                        rules.targetPlayerCount === count
                          ? 'bg-amber-500 text-emerald-950'
                          : 'bg-emerald-900 text-slate-300'
                      }`}
                    >
                      {count} Players
                    </button>
                  ))}
                </div>
              </div>

              {rules.targetPlayerCount === 3 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">3-Player Deal:</span>
                  <button
                    onClick={() =>
                      onUpdateRules({
                        threePlayerDeal:
                          rules.threePlayerDeal === 'remove_2_diamonds'
                            ? 'uneven_18_17_17'
                            : 'remove_2_diamonds',
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-900 text-amber-300 font-bold"
                  >
                    {rules.threePlayerDeal === 'remove_2_diamonds'
                      ? 'Equal 17 Cards (Remove 2♦)'
                      : '52 Cards (18/17/17)'}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">First Trick Must Lead ♠A:</span>
                <input
                  type="checkbox"
                  checked={rules.mustLeadAceOfSpades}
                  onChange={(e) =>
                    onUpdateRules({ mustLeadAceOfSpades: e.target.checked })
                  }
                  className="rounded accent-amber-500 w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">
                  Auto-fill Empty Seats with AI:
                </span>
                <input
                  type="checkbox"
                  checked={rules.aiFillEnabled}
                  onChange={(e) =>
                    onUpdateRules({ aiFillEnabled: e.target.checked })
                  }
                  className="rounded accent-amber-500 w-4 h-4"
                />
              </div>
            </div>
          )}

          {/* Slots list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p, idx) => {
              const isMe = p.id === myPlayerId;
              const isHostPlayer = idx === 0;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    isMe
                      ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-emerald-950/60 border-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                        p.isBot
                          ? 'bg-emerald-800 text-emerald-200'
                          : 'bg-amber-500 text-emerald-950'
                      }`}
                    >
                      {p.isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-100">
                          {p.username}
                        </span>
                        {isMe && (
                          <span className="text-[10px] text-amber-400 font-bold">
                            (You)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-400">
                        {isHostPlayer ? 'Room Host' : 'Player'}
                      </span>
                    </div>
                  </div>

                  {isHostPlayer && (
                    <span title="Host">
                      <Crown className="w-4 h-4 text-amber-400" />
                    </span>
                  )}
                </div>
              );
            })}

            {/* Empty Slots */}
            {emptySlots.map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-3.5 rounded-2xl border border-dashed border-emerald-800/80 bg-emerald-950/20 flex items-center justify-between text-slate-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-dashed border-emerald-700/60 flex items-center justify-center text-xs text-emerald-600">
                    {players.length + i + 1}
                  </div>
                  <span className="text-xs font-medium">
                    {rules.aiFillEnabled
                      ? 'Will auto-fill with AI on start'
                      : 'Waiting for friend...'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-emerald-950/80 border-t border-amber-500/30 flex items-center justify-between gap-3">
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-xs font-bold text-slate-300 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Lobby</span>
          </button>

          {isHost ? (
            <button
              onClick={onStartGame}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-black text-sm shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-emerald-950" />
              <span>
                {players.length < targetCount && rules.aiFillEnabled
                  ? 'Start with AI Bots'
                  : 'Start Match · کھیل شروع کریں'}
              </span>
            </button>
          ) : (
            <div className="text-xs text-amber-300 font-medium animate-pulse">
              Waiting for room host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
