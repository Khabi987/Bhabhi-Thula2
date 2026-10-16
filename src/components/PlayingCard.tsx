import React from 'react';
import { Card, Suit } from '../types/game';

interface PlayingCardProps {
  card?: Card; // If undefined, renders card back
  isFaceUp?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  isLeading?: boolean;
  isThullaCard?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hand';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const SUIT_ICONS: Record<Suit, { symbol: string; color: string; label: string }> = {
  spades: { symbol: '♠', color: 'text-slate-900', label: 'Spades' },
  hearts: { symbol: '♥', color: 'text-red-600', label: 'Hearts' },
  diamonds: { symbol: '♦', color: 'text-red-600', label: 'Diamonds' },
  clubs: { symbol: '♣', color: 'text-slate-900', label: 'Clubs' },
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFaceUp = true,
  isPlayable = false,
  isSelected = false,
  isLeading = false,
  isThullaCard = false,
  size = 'md',
  onClick,
  className = '',
  style,
}) => {
  // Dimension presets
  const sizeClasses = {
    sm: 'w-10 h-14 text-xs rounded',
    md: 'w-16 h-24 text-sm rounded-lg',
    lg: 'w-24 h-36 text-base rounded-xl',
    hand: 'w-20 h-32 md:w-24 md:h-36 text-sm md:text-base rounded-xl',
  }[size];

  if (!card || !isFaceUp) {
    // Elegant Card Back with gold and emerald oriental geometric lattice
    return (
      <div
        onClick={onClick}
        style={style}
        className={`relative select-none border-2 border-amber-600/60 shadow-lg cursor-default overflow-hidden bg-gradient-to-br from-[#0B3B24] via-[#062114] to-[#04140C] ${sizeClasses} ${className}`}
      >
        <div className="absolute inset-1 border border-amber-500/30 rounded flex items-center justify-center p-1">
          {/* Islamic geometric pattern overlay */}
          <div className="w-full h-full border border-dashed border-amber-400/20 rounded flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border border-amber-500/40 flex items-center justify-center bg-emerald-950/40">
              <span className="text-amber-400/80 text-xs font-serif font-black">BT</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { symbol, color } = SUIT_ICONS[card.suit];
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      style={style}
      className={`relative select-none flex flex-col justify-between p-1.5 md:p-2 bg-[#FAF8F5] border-2 transform-gpu will-change-transform transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-md ${sizeClasses} ${
        isSelected
          ? 'border-amber-400 -translate-y-5 scale-105 ring-4 ring-amber-400/60 shadow-2xl z-30'
          : isPlayable
          ? 'border-amber-400/80 hover:-translate-y-3.5 hover:scale-[1.03] cursor-pointer hover:shadow-2xl hover:ring-2 hover:ring-emerald-400 ring-1 ring-emerald-500/30 z-10'
          : 'border-slate-300/80 opacity-80 cursor-not-allowed'
      } ${
        isThullaCard ? 'border-red-600 ring-4 ring-red-500 animate-pulse' : ''
      } ${
        isLeading ? 'ring-2 ring-amber-400' : ''
      } ${className}`}
    >
      {/* Top Left Rank & Pip */}
      <div className={`flex flex-col items-center leading-none ${color} font-bold font-serif`}>
        <span className="text-xs md:text-sm font-black tracking-tighter">{card.rank}</span>
        <span className="text-xs md:text-sm">{symbol}</span>
      </div>

      {/* Center Art / Pip */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {['J', 'Q', 'K', 'A'].includes(card.rank) ? (
          <div
            className={`w-8 h-10 md:w-12 md:h-16 border border-amber-500/30 rounded flex flex-col items-center justify-center ${
              isRed ? 'bg-red-50/50' : 'bg-slate-100/60'
            }`}
          >
            <span className={`text-xl md:text-3xl font-serif font-black ${color}`}>
              {card.rank === 'A' ? symbol : card.rank}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-amber-800 font-sans font-semibold">
              {card.rank === 'A'
                ? 'Ace'
                : card.rank === 'K'
                ? 'King'
                : card.rank === 'Q'
                ? 'Queen'
                : 'Jack'}
            </span>
          </div>
        ) : (
          <span className={`text-2xl md:text-4xl ${color} opacity-90`}>{symbol}</span>
        )}
      </div>

      {/* Bottom Right Rank & Pip (Inverted) */}
      <div
        className={`flex flex-col items-center leading-none rotate-180 self-end ${color} font-bold font-serif`}
      >
        <span className="text-xs md:text-sm font-black tracking-tighter">{card.rank}</span>
        <span className="text-xs md:text-sm">{symbol}</span>
      </div>

      {/* Legal Playable Dot Indicator */}
      {isPlayable && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border border-white rounded-full shadow" />
      )}
    </div>
  );
};
