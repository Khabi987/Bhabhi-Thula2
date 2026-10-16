import React, { useEffect } from 'react';
import { Player } from '../types/game';
import { Flame } from 'lucide-react';
import { soundService } from '../services/sound';

interface ThullaOverlayProps {
  thullaPlayerId: string;
  penaltyPlayerId: string;
  cardsCount: number;
  players: Player[];
  onDismiss?: () => void;
}

export const ThullaOverlay: React.FC<ThullaOverlayProps> = ({
  thullaPlayerId,
  penaltyPlayerId,
  cardsCount,
  players,
}) => {
  const thullaPlayer = players.find((p) => p.id === thullaPlayerId);
  const penaltyPlayer = players.find((p) => p.id === penaltyPlayerId);

  useEffect(() => {
    soundService.playThullaImpact();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Shockwave circle expansion */}
      <div className="absolute w-40 h-40 rounded-full border-4 border-amber-400 bg-red-600/20 animate-ping opacity-75" />

      {/* Impact Banner Box */}
      <div className="relative flex flex-col items-center px-8 py-5 rounded-3xl bg-gradient-to-b from-red-950/95 via-[#062114]/95 to-red-950/95 border-2 border-amber-400 shadow-[0_0_50px_rgba(220,38,38,0.7)] backdrop-blur-md animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <Flame className="w-8 h-8 text-amber-400 animate-bounce" />
          <span className="text-3xl md:text-5xl font-black font-serif tracking-wider text-amber-400 drop-shadow">
            THULLA!
          </span>
          <Flame className="w-8 h-8 text-amber-400 animate-bounce" />
        </div>

        {/* Urdu Callout */}
        <div className="text-lg md:text-2xl font-serif font-bold text-amber-200 mb-2">
          اوئے، ٹھُلا لگ گیا!
        </div>

        {/* Detailed event breakdown */}
        <div className="text-xs md:text-sm font-semibold text-slate-200 text-center max-w-sm">
          <span className="text-amber-400 font-bold">{thullaPlayer?.username || 'Player'}</span>{' '}
          struck{' '}
          <span className="text-rose-400 font-bold">{penaltyPlayer?.username || 'Opponent'}</span>{' '}
          with <span className="text-amber-300 font-bold">{cardsCount}</span> penalty cards!
        </div>
      </div>
    </div>
  );
};
