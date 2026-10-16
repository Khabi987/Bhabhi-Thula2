import React from 'react';
import { Card, GameRules, GameState, Player } from '../types/game';
import { OpponentSeat } from './OpponentSeat';
import { TrickArena } from './TrickArena';
import { PlayerHand } from './PlayerHand';
import { ThullaOverlay } from './ThullaOverlay';
import { PlayingCard } from './PlayingCard';
import { X, Bot, User, Eye } from 'lucide-react';

interface GameTableProps {
  gameState: GameState;
  myPlayerId: string;
  myCards: Card[];
  rules: GameRules;
  onPlayCard: (cardId: string) => void;
  isMasterMode?: boolean;
  inspectedPlayerId?: string | null;
  inspectedCards?: Card[];
  inspectedLegalCardIds?: string[];
  onSelectOpponent?: (playerId: string | null) => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  gameState,
  myPlayerId,
  myCards,
  rules,
  onPlayCard,
  isMasterMode = false,
  inspectedPlayerId = null,
  inspectedCards = [],
  inspectedLegalCardIds = [],
  onSelectOpponent,
}) => {
  const me = gameState.players.find((p) => p.id === myPlayerId);
  const mySeatIndex = me ? me.seatIndex : 0;
  const totalPlayers = gameState.players.length;

  // Order opponents clockwise relative to current player's seat
  const opponents: { player: Player; position: 'top' | 'left' | 'right' }[] = [];

  for (let i = 1; i < totalPlayers; i++) {
    const targetSeatIndex = (mySeatIndex + i) % totalPlayers;
    const opponent = gameState.players.find((p) => p.seatIndex === targetSeatIndex);
    if (!opponent) continue;

    let position: 'top' | 'left' | 'right' = 'top';
    if (totalPlayers === 3) {
      position = i === 1 ? 'left' : 'right';
    } else if (totalPlayers === 4) {
      if (i === 1) position = 'left';
      else if (i === 2) position = 'top';
      else position = 'right';
    }
    opponents.push({ player: opponent, position });
  }

  const isMyTurn = gameState.currentTurnPlayerId === myPlayerId;
  const isResolving = gameState.phase === 'RESOLVING_TRICK';

  const inspectedPlayer = gameState.players.find((p) => p.id === inspectedPlayerId);

  return (
    <div className="relative w-full h-[calc(100vh-48px)] flex flex-col justify-between items-center p-2 md:p-4 select-none overflow-hidden bg-[#062114]">
      {/* Visual Oval Card Felt Table Container */}
      <div className="absolute inset-2 md:inset-4 rounded-[40px] md:rounded-[70px] bg-gradient-to-b from-[#0B3B24] via-[#09321e] to-[#062114] border-[8px] md:border-[14px] border-[#2D1810] shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_10px_40px_rgba(0,0,0,0.9)] flex items-center justify-center">
        {/* Fine Gold Inlay Rail Border */}
        <div className="absolute inset-2 md:inset-3 rounded-[32px] md:rounded-[60px] border border-amber-500/30 pointer-events-none" />
      </div>

      {/* Opponents Area (Top / Left / Right) */}
      <div className="relative w-full z-20 flex justify-between items-start px-2 md:px-8 pt-1">
        {/* Left Opponent */}
        <div className="w-48 flex justify-start">
          {opponents.find((o) => o.position === 'left') && (
            <OpponentSeat
              player={opponents.find((o) => o.position === 'left')!.player}
              isCurrentTurn={
                gameState.currentTurnPlayerId ===
                opponents.find((o) => o.position === 'left')!.player.id
              }
              position="left"
              isMasterMode={isMasterMode}
              isInspected={opponents.find((o) => o.position === 'left')!.player.id === inspectedPlayerId}
              onSelectToInspect={onSelectOpponent}
            />
          )}
        </div>

        {/* Top Opponent */}
        <div className="flex-1 flex justify-center">
          {opponents.find((o) => o.position === 'top') && (
            <OpponentSeat
              player={opponents.find((o) => o.position === 'top')!.player}
              isCurrentTurn={
                gameState.currentTurnPlayerId ===
                opponents.find((o) => o.position === 'top')!.player.id
              }
              position="top"
              isMasterMode={isMasterMode}
              isInspected={opponents.find((o) => o.position === 'top')!.player.id === inspectedPlayerId}
              onSelectToInspect={onSelectOpponent}
            />
          )}
        </div>

        {/* Right Opponent */}
        <div className="w-48 flex justify-end">
          {opponents.find((o) => o.position === 'right') && (
            <OpponentSeat
              player={opponents.find((o) => o.position === 'right')!.player}
              isCurrentTurn={
                gameState.currentTurnPlayerId ===
                opponents.find((o) => o.position === 'right')!.player.id
              }
              position="right"
              isMasterMode={isMasterMode}
              isInspected={opponents.find((o) => o.position === 'right')!.player.id === inspectedPlayerId}
              onSelectToInspect={onSelectOpponent}
            />
          )}
        </div>
      </div>

      {/* Center Trick Arena */}
      <div className="relative z-10 my-auto flex items-center justify-center">
        <TrickArena
          trick={gameState.currentTrick}
          players={gameState.players}
          discardPileCount={gameState.discardPileCount}
        />
      </div>

      {/* Live Real-time Opponent Cards Inspector Bar (for Master) */}
      {isMasterMode && inspectedPlayer && (
        <div className="relative w-full max-w-4xl mx-auto z-25 mb-1 px-3 md:px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-[#062114]/98 to-emerald-950/95 border-2 border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.4)] backdrop-blur-md flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between">
            {/* Player Info & Live Status */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 font-bold flex items-center justify-center text-xs shadow">
                {inspectedPlayer.isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs md:text-sm text-amber-300">
                  {inspectedPlayer.username}'s Real-Time Cards · براہ راست پتے
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] text-amber-300 font-mono font-bold">
                  {inspectedCards.length} cards
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> Live Sync
                </span>
              </div>
            </div>

            {/* Quick Switcher & Prominent Cross Button */}
            <div className="flex items-center gap-2">
              {/* Opponent Switch Tabs */}
              <div className="hidden sm:flex items-center gap-1 bg-emerald-900/60 p-0.5 rounded-lg border border-emerald-800">
                {opponents.map((o) => (
                  <button
                    key={o.player.id}
                    onClick={() => onSelectOpponent?.(o.player.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      o.player.id === inspectedPlayer.id
                        ? 'bg-amber-500 text-emerald-950 shadow'
                        : 'text-slate-300 hover:text-white hover:bg-emerald-800/80'
                    }`}
                  >
                    {o.player.username}
                  </button>
                ))}
              </div>

              {/* CROSS BUTTON (❌) */}
              <button
                type="button"
                onClick={() => onSelectOpponent?.(null)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-950/90 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500 transition-all font-bold text-xs shadow-md active:scale-95 cursor-pointer"
                title="Close Card Inspector / کارڈ معائنہ بند کریں"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span className="font-sans font-bold">Close</span>
              </button>
            </div>
          </div>

          {/* Cards Display */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
            {inspectedCards.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-1 px-3 bg-emerald-950/40 rounded-xl border border-emerald-800/40">
                {inspectedPlayer.hasEscaped
                  ? `${inspectedPlayer.username} has escaped! (باہر ہو گیا)`
                  : 'No cards remaining in hand.'}
              </div>
            ) : (
              inspectedCards.map((card) => {
                const isLegal = inspectedLegalCardIds.includes(card.id);
                return (
                  <div key={card.id} className="relative shrink-0 flex flex-col items-center">
                    <PlayingCard
                      card={card}
                      size="sm"
                      isPlayable={isLegal}
                      className="transition-transform duration-200 hover:-translate-y-1.5"
                    />
                    <span
                      className={`text-[8px] font-black uppercase mt-0.5 ${
                        isLegal ? 'text-emerald-400 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {isLegal ? 'LEGAL' : 'LOCKED'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Bottom User Area */}
      <div className="relative w-full z-20 flex flex-col items-center">
        <PlayerHand
          cards={myCards}
          currentTrick={gameState.currentTrick}
          rules={rules}
          isMyTurn={isMyTurn}
          onPlayCard={onPlayCard}
          disabled={isResolving}
        />
      </div>

      {/* Thulla Overlay Animation */}
      {isResolving && gameState.currentTrick.isThulla && gameState.currentTrick.thullaPlayerId && (
        <ThullaOverlay
          thullaPlayerId={gameState.currentTrick.thullaPlayerId}
          penaltyPlayerId={gameState.currentTrick.penaltyPlayerId!}
          cardsCount={gameState.currentTrick.cards.length}
          players={gameState.players}
        />
      )}
    </div>
  );
};
