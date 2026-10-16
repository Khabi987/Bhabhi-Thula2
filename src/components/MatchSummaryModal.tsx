import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameState, Player } from '../types/game';
import { Trophy, RefreshCw, LogOut, Award, Flame, Skull } from 'lucide-react';
import { soundService } from '../services/sound';

interface MatchSummaryModalProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  onRematch: () => void;
  onLeave: () => void;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  gameState,
  myPlayerId,
  isHost,
  onRematch,
  onLeave,
}) => {
  const bhabhiPlayer = gameState.players.find(
    (p) => p.id === gameState.bhabhiPlayerId
  );
  const firstWinnerId = gameState.escapeOrder[0];
  const firstWinner = gameState.players.find((p) => p.id === firstWinnerId);

  const isMeBhabhi = gameState.bhabhiPlayerId === myPlayerId;
  const isMeWinner = firstWinnerId === myPlayerId;

  useEffect(() => {
    soundService.playGameOver();
    if (isMeWinner) {
      soundService.playEscapeChime();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isMeWinner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg flex flex-col rounded-3xl bg-[#062114] border-2 border-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.3)] text-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-[#0B3B24] to-emerald-950 border-b border-amber-500/40 text-center">
          <h2 className="text-2xl md:text-3xl font-black font-serif text-amber-300">
            Khel Khatam · کھیل ختم
          </h2>
          <p className="text-xs text-emerald-400 font-medium mt-1">
            Match Result & Escape Order
          </p>
        </div>

        {/* Center Spotlight: The BHABHI */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {bhabhiPlayer && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-red-950/80 via-red-900/30 to-red-950/80 border-2 border-red-500/80 flex flex-col items-center text-center shadow-lg">
              <div className="w-12 h-12 rounded-full bg-red-600/30 border-2 border-red-400 flex items-center justify-center text-red-300 mb-2">
                <Skull className="w-6 h-6 animate-pulse" />
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">
                Official Match Bhabhi
              </span>
              <div className="text-2xl font-black font-serif text-amber-300 mt-0.5">
                {bhabhiPlayer.username} {isMeBhabhi ? '(You!)' : ''}
              </div>
              <div className="text-sm font-serif font-bold text-amber-200 mt-1">
                ہائے ہائے! بھابھی بن گیا!
              </div>

              <div className="mt-2 text-xs text-red-200/90 font-medium">
                Caught with {bhabhiPlayer.cardCount} unescaped cards & received{' '}
                {bhabhiPlayer.thullasReceived} Thulla penalties.
              </div>
            </div>
          )}

          {/* Escape Rankings */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Escape Rankings (Bachne Ki Tarteeb)</span>
            </h3>

            <div className="space-y-2">
              {gameState.escapeOrder.map((playerId, index) => {
                const player = gameState.players.find((p) => p.id === playerId);
                if (!player) return null;
                const isFirst = index === 0;

                return (
                  <div
                    key={playerId}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isFirst
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-emerald-950/60 border-emerald-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          isFirst
                            ? 'bg-amber-500 text-emerald-950 shadow'
                            : 'bg-emerald-900 text-emerald-300'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">
                            {player.username}
                          </span>
                          {player.id === myPlayerId && (
                            <span className="text-[10px] text-amber-400 font-bold">
                              (You)
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-400">
                          {isFirst ? 'First Out · Champion (Bach Gaya)' : 'Escaped Safe'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium">
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{player.thullasGiven} dealt</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-emerald-950/90 border-t border-amber-500/30 flex items-center justify-between gap-3">
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-xs font-bold text-slate-300 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Main Menu</span>
          </button>

          {isHost ? (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-black text-sm shadow-lg shadow-amber-500/30 transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Rematch · دوبارہ کھیلیں</span>
            </button>
          ) : (
            <div className="text-xs text-amber-300 font-medium animate-pulse">
              Waiting for host to trigger rematch...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
