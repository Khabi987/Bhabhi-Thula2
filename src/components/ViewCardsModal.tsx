import React, { useEffect, useState } from 'react';
import { Card, GameState, Player } from '../types/game';
import { PlayingCard } from './PlayingCard';
import { Eye, X, RefreshCw, Bot, User, Clock, ShieldCheck } from 'lucide-react';

interface ViewCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState | null;
  myPlayerId: string;
  onRequestPlayerCards: (playerId: string) => void;
  inspectedPlayerId: string | null;
  inspectedCards: Card[];
  inspectedLegalCardIds: string[];
  inspectedUpdatedAt: number | null;
}

export const ViewCardsModal: React.FC<ViewCardsModalProps> = ({
  isOpen,
  onClose,
  gameState,
  myPlayerId,
  onRequestPlayerCards,
  inspectedPlayerId,
  inspectedCards,
  inspectedLegalCardIds,
  inspectedUpdatedAt,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const opponents = gameState?.players.filter((p) => p.id !== myPlayerId) || [];

  useEffect(() => {
    if (isOpen && opponents.length > 0) {
      const targetId = inspectedPlayerId && opponents.some((p) => p.id === inspectedPlayerId)
        ? inspectedPlayerId
        : opponents[0].id;

      setSelectedPlayerId(targetId);
      onRequestPlayerCards(targetId);
    }
  }, [isOpen, gameState?.players]);

  if (!isOpen) return null;

  const activeInspectedPlayer = gameState?.players.find((p) => p.id === selectedPlayerId);

  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    onRequestPlayerCards(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl bg-[#062114] border-2 border-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.3)] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-emerald-950/90 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold font-serif text-amber-300">
                In-Game Card Inspector · تمام پتے دیکھیں
              </h2>
              <p className="text-[11px] text-emerald-400">
                Master View · Inspect opponents' hidden cards in real time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              Master Authorized
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-950/50 border-b border-emerald-800/50 overflow-x-auto">
          {opponents.map((p) => {
            const isSelected = p.id === selectedPlayerId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPlayer(p.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-emerald-950 shadow-md'
                    : 'bg-emerald-900/60 text-slate-300 hover:bg-emerald-850'
                }`}
              >
                {p.isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                <span>{p.username}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-950 text-emerald-400'
                  }`}
                >
                  {p.cardCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cards Display Arena */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between text-xs pb-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">
                Viewing <strong className="text-amber-300">{activeInspectedPlayer?.username}</strong>'s Hand:
              </span>
              <span className="text-emerald-400 font-bold">
                {inspectedCards.length} cards remaining
              </span>
            </div>

            <button
              onClick={() => {
                if (selectedPlayerId) onRequestPlayerCards(selectedPlayerId);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-[11px] text-amber-300 font-semibold transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {inspectedCards.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 bg-emerald-950/40 rounded-2xl border border-dashed border-emerald-800">
              This player has escaped or has no cards remaining in hand.
            </div>
          ) : (
            <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/60 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-3">
                {inspectedCards.map((card) => {
                  const isLegal = inspectedLegalCardIds.includes(card.id);
                  return (
                    <div key={card.id} className="flex flex-col items-center">
                      <PlayingCard
                        card={card}
                        size="md"
                        isPlayable={isLegal}
                        className="transition-transform duration-200 hover:-translate-y-1.5"
                      />
                      <span
                        className={`text-[9px] mt-1 font-bold ${
                          isLegal ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {isLegal ? 'LEGAL PLAY' : 'LOCKED'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-emerald-950/90 border-t border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Updated {inspectedUpdatedAt ? new Date(inspectedUpdatedAt).toLocaleTimeString() : 'Live'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-bold text-xs shadow transition active:scale-95"
          >
            Resume Game
          </button>
        </div>
      </div>
    </div>
  );
};
