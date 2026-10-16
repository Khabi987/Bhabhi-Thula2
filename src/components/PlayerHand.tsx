import React, { useState } from 'react';
import { Card, GameRules, Trick } from '../types/game';
import { PlayingCard } from './PlayingCard';
import { getLegalCards, sortHand } from '../game/engine';
import { ArrowUpCircle, Sparkles, Filter } from 'lucide-react';

interface PlayerHandProps {
  cards: Card[];
  currentTrick: Trick;
  rules: GameRules;
  isMyTurn: boolean;
  onPlayCard: (cardId: string) => void;
  disabled?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  currentTrick,
  rules,
  isMyTurn,
  onPlayCard,
  disabled = false,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Compute legal playable cards
  const legalCards = isMyTurn && !disabled
    ? getLegalCards(cards, currentTrick, rules)
    : [];

  const legalCardIds = new Set(legalCards.map((c) => c.id));

  // Sort cards by suit/rank
  const sortedCards = sortHand(cards);

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn || disabled) return;
    if (!legalCardIds.has(cardId)) return;

    if (selectedCardId === cardId) {
      // Second click confirms play
      onPlayCard(cardId);
      setSelectedCardId(null);
    } else {
      setSelectedCardId(cardId);
    }
  };

  const handleConfirmPlay = () => {
    if (selectedCardId && legalCardIds.has(selectedCardId)) {
      onPlayCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  // Calculate dynamic overlap
  const totalCards = sortedCards.length;
  // Dynamic offset depending on total card count
  const cardSpacing = totalCards > 14 ? 32 : totalCards > 10 ? 42 : totalCards > 6 ? 54 : 64;

  return (
    <div className="relative w-full flex flex-col items-center justify-end pb-1 md:pb-3 select-none pointer-events-auto">
      {/* Turn indicator & Action bar */}
      <div className="flex items-center gap-3 mb-2 z-30">
        {isMyTurn ? (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 px-4 py-1.5 rounded-full font-bold shadow-lg shadow-amber-500/20 text-xs md:text-sm animate-pulse border border-amber-300">
            <Sparkles className="w-4 h-4" />
            <span>YOUR TURN · آپ کی باری ہے</span>
            {selectedCardId && (
              <button
                onClick={handleConfirmPlay}
                className="ml-2 flex items-center gap-1 bg-emerald-950 hover:bg-emerald-900 text-amber-300 px-3 py-1 rounded-full text-xs font-black shadow transition active:scale-95"
              >
                <span>Play Card</span>
                <ArrowUpCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 px-3 py-1 rounded-full text-xs font-medium">
            Waiting for opponent's turn...
          </div>
        )}

        <div className="bg-emerald-950/90 border border-emerald-700/60 px-2.5 py-1 rounded-full text-xs text-amber-300 font-bold flex items-center gap-1.5 shadow">
          <span>{totalCards}</span>
          <span className="text-[10px] text-emerald-400 font-normal">cards in hand</span>
        </div>
      </div>

      {/* Fan of cards */}
      <div className="relative h-32 md:h-38 w-full max-w-4xl flex justify-center items-end px-4">
        {sortedCards.map((card, idx) => {
          const isLegal = legalCardIds.has(card.id);
          const isSelected = selectedCardId === card.id;

          // Fan arc angle calculation
          const midpoint = (totalCards - 1) / 2;
          const offsetFromMid = idx - midpoint;
          const rotateAngle = offsetFromMid * (totalCards > 12 ? 1.5 : 2.5);
          const yOffset = Math.abs(offsetFromMid) * (totalCards > 12 ? 1.5 : 2);

          return (
            <div
              key={card.id}
              className="absolute transform-gpu will-change-transform transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{
                transform: `translateX(${offsetFromMid * cardSpacing}px) translateY(${
                  isSelected ? -28 : yOffset
                }px) rotate(${isSelected ? 0 : rotateAngle}deg)`,
                zIndex: isSelected ? 40 : idx + 10,
              }}
            >
              <PlayingCard
                card={card}
                isFaceUp={true}
                size="hand"
                isPlayable={isLegal}
                isSelected={isSelected}
                onClick={() => handleCardClick(card.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
