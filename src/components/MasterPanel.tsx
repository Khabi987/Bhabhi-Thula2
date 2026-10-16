import React, { useState } from 'react';
import { Card, GameState, Player } from '../types/game';
import { PlayingCard } from './PlayingCard';
import {
  ShieldCheck,
  X,
  Users,
  Eye,
  Activity,
  KeyRound,
  RefreshCw,
  Clock,
  Wifi,
  AlertCircle,
} from 'lucide-react';

interface MasterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthorized: boolean;
  onRequestAuth: (secretKey: string) => void;
  onRequestPlayerCards: (playerId: string) => void;
  inspectedPlayerId: string | null;
  inspectedCards: Card[];
  inspectedLegalCardIds: string[];
  inspectedUpdatedAt: number | null;
  gameState: GameState | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

export const MasterPanel: React.FC<MasterPanelProps> = ({
  isOpen,
  onClose,
  isAuthorized,
  onRequestAuth,
  onRequestPlayerCards,
  inspectedPlayerId,
  inspectedCards,
  inspectedLegalCardIds,
  inspectedUpdatedAt,
  gameState,
  connectionStatus,
}) => {
  const [activeTab, setActiveTab] = useState<
    'players' | 'cards' | 'state' | 'diagnostics'
  >('players');
  const [enteredSecret, setEnteredSecret] = useState('');
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredSecret.trim()) {
      setAuthError('Please enter the Master Secret Key');
      return;
    }
    setAuthError('');
    onRequestAuth(enteredSecret.trim());
  };

  const inspectedPlayer = gameState
    ? gameState.players.find((p) => p.id === inspectedPlayerId)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#062114] border-2 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.25)] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-500/30 bg-emerald-950/80">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-base md:text-lg font-bold font-serif text-amber-300 tracking-wide">
                Master Testing & Administration Panel
              </h2>
              <p className="text-[11px] text-emerald-400">
                Server-Authoritative Diagnostic & Inspection Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isAuthorized
                  ? 'bg-emerald-900 border border-emerald-500 text-emerald-200'
                  : 'bg-rose-950 border border-rose-500 text-rose-200'
              }`}
            >
              {isAuthorized ? 'Authorized' : 'Locked'}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900 transition"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Authorization Prompt if not yet verified on backend */}
        {!isAuthorized ? (
          <div className="p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-4">
              <KeyRound className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold font-serif text-amber-300 mb-2">
              Master Mode Authorization Required
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              This private testing panel is reserved for authorized debugging and QA sessions.
              Please provide your server Master authorization secret to proceed.
            </p>

            <form onSubmit={handleAuthSubmit} className="w-full space-y-3">
              <input
                type="password"
                placeholder="Enter Master Secret Key"
                value={enteredSecret}
                onChange={(e) => setEnteredSecret(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-950 border border-amber-500/50 text-white placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
              />

              {authError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold text-sm shadow-lg transition active:scale-98"
              >
                Authenticate Session
              </button>
            </form>
          </div>
        ) : (
          /* Authorized Panel Interface */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 bg-emerald-950/40 border-b border-emerald-800/40 overflow-x-auto">
              <button
                onClick={() => setActiveTab('players')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'players'
                    ? 'bg-amber-500 text-emerald-950 shadow'
                    : 'text-slate-300 hover:bg-emerald-900/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Player Inspector</span>
              </button>

              <button
                onClick={() => setActiveTab('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'cards'
                    ? 'bg-amber-500 text-emerald-950 shadow'
                    : 'text-slate-300 hover:bg-emerald-900/60'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>2. Card View</span>
              </button>

              <button
                onClick={() => setActiveTab('state')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'state'
                    ? 'bg-amber-500 text-emerald-950 shadow'
                    : 'text-slate-300 hover:bg-emerald-900/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>3. Game State</span>
              </button>

              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'diagnostics'
                    ? 'bg-amber-500 text-emerald-950 shadow'
                    : 'text-slate-300 hover:bg-emerald-900/60'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>4. Diagnostics</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* TAB 1: PLAYER INSPECTOR */}
              {activeTab === 'players' && (
                <div className="space-y-4">
                  <div className="text-xs text-emerald-300">
                    Click any player to inspect their live hand and state synchronization.
                  </div>

                  {!gameState ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-emerald-950/40 rounded-xl border border-dashed border-emerald-800">
                      No active room yet. Host a game or join a room code to inspect live players.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {gameState.players.map((p) => {
                        const isTurn = gameState.currentTurnPlayerId === p.id;
                        const isSelected = inspectedPlayerId === p.id;

                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              onRequestPlayerCards(p.id);
                              setActiveTab('cards');
                            }}
                            className={`p-3.5 rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400'
                                : 'bg-emerald-950/60 border-emerald-800/80 hover:border-amber-500/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-100">
                                  {p.username}
                                </span>
                                {p.isBot && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200">
                                    AI
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  p.isConnected
                                    ? 'bg-emerald-900 text-emerald-300'
                                    : 'bg-rose-950 text-rose-300'
                                }`}
                              >
                                {p.isConnected ? 'Online' : 'Disconnected'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                              <div>
                                <span className="text-emerald-400">ID:</span>{' '}
                                <span className="font-mono text-[10px]">{p.id}</span>
                              </div>
                              <div>
                                <span className="text-emerald-400">Cards:</span>{' '}
                                <span className="font-bold text-amber-300">{p.cardCount}</span>
                              </div>
                              <div>
                                <span className="text-emerald-400">Turn:</span>{' '}
                                <span
                                  className={`font-bold ${
                                    isTurn ? 'text-amber-400' : 'text-slate-400'
                                  }`}
                                >
                                  {isTurn ? 'ACTIVE' : 'Waiting'}
                                </span>
                              </div>
                              <div>
                                <span className="text-emerald-400">Escape:</span>{' '}
                                <span>
                                  {p.hasEscaped ? `Rank #${p.escapeRank}` : 'In Play'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CARD VIEW */}
              {activeTab === 'cards' && (
                <div className="space-y-4">
                  {/* Selector Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-emerald-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-300 font-semibold">
                        Inspecting Player:
                      </span>
                      <select
                        value={inspectedPlayerId || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            onRequestPlayerCards(e.target.value);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-amber-500/50 text-xs text-amber-300 font-bold focus:outline-none"
                      >
                        <option value="">Select a player...</option>
                        {gameState?.players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.username} ({p.cardCount} cards) {p.isBot ? '[AI]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {inspectedUpdatedAt && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>
                          Updated {new Date(inspectedUpdatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {inspectedPlayerId && inspectedPlayer ? (
                    <div>
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="text-slate-300 font-medium">
                          Holding {inspectedCards.length} cards ·{' '}
                          <span className="text-emerald-400">
                            {inspectedLegalCardIds.length} legal moves
                          </span>
                        </span>

                        <button
                          onClick={() => onRequestPlayerCards(inspectedPlayerId)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-900 hover:bg-emerald-800 text-[11px] text-amber-300 font-semibold"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Refresh Hand</span>
                        </button>
                      </div>

                      {inspectedCards.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 bg-emerald-950/40 rounded-xl border border-dashed border-emerald-800">
                          This player has no cards remaining in hand.
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5 max-h-72 overflow-y-auto p-2 bg-emerald-950/40 rounded-xl border border-emerald-900">
                          {inspectedCards.map((card) => {
                            const isLegal = inspectedLegalCardIds.includes(card.id);
                            return (
                              <div key={card.id} className="flex flex-col items-center">
                                <PlayingCard
                                  card={card}
                                  size="sm"
                                  isPlayable={isLegal}
                                />
                                <span
                                  className={`text-[9px] mt-1 font-bold ${
                                    isLegal ? 'text-emerald-400' : 'text-slate-500'
                                  }`}
                                >
                                  {isLegal ? 'LEGAL' : 'LOCKED'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Please select a player above to inspect their hand.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: GAME STATE */}
              {activeTab === 'state' && (
                <div className="space-y-4">
                  {!gameState ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-emerald-950/40 rounded-xl border border-dashed border-emerald-800">
                      Game state telemetry will appear once a room is created or joined.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                            Phase
                          </span>
                          <div className="text-sm font-bold text-amber-300">
                            {gameState.phase}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                            Trick Number
                          </span>
                          <div className="text-sm font-bold text-slate-100">
                            #{gameState.currentTrick.trickNumber}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                            Lead Suit
                          </span>
                          <div className="text-sm font-bold text-amber-300 capitalize">
                            {gameState.leadSuit || 'None (Leading)'}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                            Discard Pile
                          </span>
                          <div className="text-sm font-bold text-slate-100">
                            {gameState.discardPileCount} cards
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                            State Version
                          </span>
                          <div className="text-sm font-mono font-bold text-slate-100">
                            v{gameState.stateVersion}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                            Room Code
                          </span>
                          <div className="text-sm font-mono font-bold text-amber-300">
                            {gameState.roomCode}
                          </div>
                        </div>
                      </div>

                      {/* Trick History */}
                      <div>
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                          Recent Trick History ({gameState.trickHistory.length})
                        </h4>
                        {gameState.trickHistory.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 bg-emerald-950/40 rounded-xl">
                            No completed tricks yet.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-44 overflow-y-auto">
                            {gameState.trickHistory.slice(-5).map((trick, i) => (
                              <div
                                key={i}
                                className="p-2 rounded bg-emerald-950/80 border border-emerald-900 flex items-center justify-between text-xs"
                              >
                                <span>Trick #{trick.trickNumber}</span>
                                <span className="capitalize text-emerald-400">
                                  Lead: {trick.leadSuit}
                                </span>
                                <span
                                  className={`font-bold ${
                                    trick.isThulla ? 'text-red-400' : 'text-amber-300'
                                  }`}
                                >
                                  {trick.isThulla ? 'THULLA STRIKE' : 'Clean Trick'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: CONNECTION DIAGNOSTICS */}
              {activeTab === 'diagnostics' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">WebSocket Transport:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {connectionStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Active Test Room:</span>
                      <span className="font-mono text-amber-300 font-bold">
                        {gameState ? gameState.roomId : 'None (In Main Menu)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Master Privilege Level:</span>
                      <span className="font-mono text-emerald-300 font-bold">
                        LEVEL_1_AUTHORIZED_INSPECTOR
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Hand Isolation Protocol:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        ENFORCED_SERVER_SIDE
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-emerald-800/60 bg-emerald-950/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-slate-200 text-xs font-bold transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
