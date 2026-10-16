import React from 'react';
import { Player, Trick } from '../types/game';
import { PlayingCard } from './PlayingCard';
import { Layers } from 'lucide-react';

interface TrickArenaProps {
  trick: Trick;
  players: Player[];
  discardPileCount: number;
}

export const TrickArena: React.FC<TrickArenaProps> = ({
  trick,
  players,
  discardPileCount,
}) => {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Positions for up to 4 played cards in the center circle
  const getCardOffset = (index: number, total: number) => {
    if (total === 1) return { x: 0, y: 0, rot: 0 };
    if (total === 2) {
      return index === 0
        ? { x: -35, y: 0, rot: -4 }
        : { x: 35, y: 0, rot: 4 };
    }
    if (total === 3) {
      if (index === 0) return { x: 0, y: -25, rot: 0 };
      if (index === 1) return { x: -40, y: 20, rot: -8 };
      return { x: 40, y: 20, rot: 8 };
    }
    // 4 cards
    const offsets = [
      { x: 0, y: 28, rot: 2 }, // Bottom (self)
      { x: -55, y: 0, rot: -6 }, // Left
      { x: 0, y: -28, rot: -2 }, // Top
      { x: 55, y: 0, rot: 6 }, // Right
    ];
    return offsets[index % 4];
  };

  const suitIcons: Record<string, { symbol: string; color: string; label: string }> = {
    spades: { symbol: '♠', color: 'text-slate-100', label: 'Spades' },
    hearts: { symbol: '♥', color: 'text-red-400', label: 'Hearts' },
    diamonds: { symbol: '♦', color: 'text-red-400', label: 'Diamonds' },
    clubs: { symbol: '♣', color: 'text-slate-100', label: 'Clubs' },
  };

  const leadInfo = trick.leadSuit ? suitIcons[trick.leadSuit] : null;

  return (
    <div className="relative w-72 h-72 md:w-88 md:h-88 flex items-center justify-center select-none pointer-events-none">
      {/* Table Center Inset Ring */}
      <div className="absolute inset-4 rounded-full border border-amber-500/20 bg-emerald-950/30 flex items-center justify-center shadow-inner">
        {/* Subtle Pakistani card logo watermark */}
        <div className="text-center opacity-15">
          <div className="text-4xl md:text-5xl font-serif font-black text-amber-300">
            BHABHI
          </div>
          <div className="text-sm font-semibold tracking-widest text-amber-200">
            THULLA
          </div>
        </div>
      </div>

      {/* Discard Pile Indicator */}
      <div className="absolute left-2 top-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-300 font-medium">
        <Layers className="w-3.5 h-3.5 text-amber-400" />
        <span>Discards: {discardPileCount}</span>
      </div>

      {/* Active Lead Suit HUD */}
      {leadInfo && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 shadow text-xs font-bold text-amber-300">
          <span>Lead:</span>
          <span className={`text-sm ${leadInfo.color}`}>{leadInfo.symbol}</span>
          <span className="capitalize">{leadInfo.label}</span>
        </div>
      )}

      {/* Center Played Cards */}
      <div className="relative w-full h-full flex items-center justify-center">
        {trick.cards.map((play, index) => {
          const offset = getCardOffset(index, trick.cards.length);
          const player = playerMap.get(play.playerId);
          const isOffSuit =
            trick.leadSuit && play.card.suit !== trick.leadSuit;

          return (
            <div
              key={`${play.card.id}-${index}`}
              className="absolute flex flex-col items-center transition-all duration-300"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rot}deg)`,
                zIndex: index + 10,
              }}
            >
              {/* Player Name Pill */}
              <div
                className={`mb-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md truncate max-w-[100px] border ${
                  isOffSuit
                    ? 'bg-red-950 border-red-500 text-red-200 animate-bounce'
                    : 'bg-emerald-950/90 border-emerald-700 text-slate-100'
                }`}
              >
                {player?.username || 'Player'}
                {isOffSuit && ' (THULLA!)'}
              </div>

              {/* Card Face */}
              <PlayingCard
                card={play.card}
                size="md"
                isLeading={index === 0}
                isThullaCard={!!isOffSuit}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
