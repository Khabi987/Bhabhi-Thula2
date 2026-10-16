import React from 'react';
import { Player } from '../types/game';
import { PlayingCard } from './PlayingCard';
import { Bot, User, Award, ShieldAlert, Eye } from 'lucide-react';

interface OpponentSeatProps {
  player: Player;
  isCurrentTurn: boolean;
  position: 'top' | 'left' | 'right';
  className?: string;
  isMasterMode?: boolean;
  isInspected?: boolean;
  onSelectToInspect?: (playerId: string) => void;
}

export const OpponentSeat: React.FC<OpponentSeatProps> = ({
  player,
  isCurrentTurn,
  position,
  className = '',
  isMasterMode = false,
  isInspected = false,
  onSelectToInspect,
}) => {
  // Render a visual card back fan based on card count (clamped to max 8 cards visual fan)
  const fanCount = Math.min(8, player.cardCount);
  const cardBacks = Array.from({ length: fanCount });

  return (
    <div
      className={`relative flex flex-col items-center select-none pointer-events-auto transition-all ${
        position === 'left' ? 'items-start' : position === 'right' ? 'items-end' : 'items-center'
      } ${className}`}
    >
      {/* Speech Bubble for Urdu Commentary */}
      {player.lastCommentary && (
        <div className="absolute -top-12 z-40 bg-amber-50 text-emerald-950 px-3 py-1.5 rounded-xl shadow-xl border border-amber-300 text-xs font-semibold animate-bounce flex flex-col items-center">
          <span className="font-serif font-bold text-emerald-900">{player.lastCommentary}</span>
          <div className="absolute -bottom-1 w-2 h-2 bg-amber-50 rotate-45 border-r border-b border-amber-300" />
        </div>
      )}

      {/* Opponent Card Fan (Backs) */}
      {!player.hasEscaped && player.cardCount > 0 && (
        <div className="relative h-14 w-28 flex justify-center items-center mb-1">
          {cardBacks.map((_, i) => {
            const angle = (i - (fanCount - 1) / 2) * 8;
            const xOffset = (i - (fanCount - 1) / 2) * 7;
            return (
              <div
                key={i}
                className="absolute transition-transform duration-300"
                style={{
                  transform: `translateX(${xOffset}px) rotate(${angle}deg)`,
                  transformOrigin: 'bottom center',
                }}
              >
                <PlayingCard isFaceUp={false} size="sm" />
              </div>
            );
          })}
        </div>
      )}

      {/* Player Badge / Avatar Box */}
      <div
        onClick={() => {
          if (isMasterMode && onSelectToInspect) {
            onSelectToInspect(player.id);
          }
        }}
        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-md border transition-all duration-300 ${
          isInspected
            ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.7)] cursor-pointer scale-105'
            : isCurrentTurn
            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
            : 'bg-emerald-950/70 border-emerald-700/60'
        } ${isMasterMode ? 'cursor-pointer hover:border-amber-400 hover:bg-emerald-900/80' : ''} ${
          !player.isConnected ? 'opacity-60' : ''
        }`}
        title={isMasterMode ? `Click to inspect ${player.username}'s real-time cards` : undefined}
      >
        {/* Avatar Circle */}
        <div className="relative">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
              isInspected
                ? 'bg-amber-400 text-emerald-950 border-white animate-pulse'
                : isCurrentTurn
                ? 'bg-amber-500 text-emerald-950 border-amber-300'
                : player.isBot
                ? 'bg-emerald-800 text-emerald-100 border-emerald-600'
                : 'bg-emerald-900 text-amber-300 border-amber-500/50'
            }`}
          >
            {player.isBot ? (
              <Bot className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          {/* Online status indicator */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-emerald-950 ${
              player.isConnected ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
        </div>

        {/* Username & Card Count */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs md:text-sm font-bold text-slate-100 truncate max-w-[90px] md:max-w-[120px]">
              {player.username}
            </span>
            {player.isBot && (
              <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-emerald-800/80 text-emerald-300 font-semibold">
                AI
              </span>
            )}
            {isInspected && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-emerald-950 text-[9px] font-black uppercase shadow">
                <Eye className="w-2.5 h-2.5" />
                Live
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-emerald-300 font-medium">
            {player.hasEscaped ? (
              <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                <Award className="w-3 h-3" />
                {player.escapeRank === 1
                  ? '1st (Bach Gaya)'
                  : `${player.escapeRank}th Out`}
              </span>
            ) : (
              <span>{player.cardCount} cards</span>
            )}

            {isCurrentTurn && (
              <span className="text-amber-400 font-bold animate-pulse">
                Thinking...
              </span>
            )}
          </div>
        </div>

        {/* Master Inspect Button / Pill */}
        {isMasterMode && !isInspected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectToInspect?.(player.id);
            }}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-emerald-950 border border-amber-400/40 text-[9px] font-bold transition ml-0.5"
            title="Inspect cards in real time"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">View</span>
          </button>
        )}

        {/* Thulla penalty count tag */}
        {player.thullasReceived > 0 && !player.hasEscaped && (
          <div
            title={`Caught in ${player.thullasReceived} Thulla(s)`}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-700/50 text-red-300 text-[10px] font-bold"
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>{player.thullasReceived}</span>
          </div>
        )}
      </div>
    </div>
  );
};
