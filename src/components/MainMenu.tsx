import React, { useState } from 'react';
import {
  Users,
  Play,
  PlusCircle,
  LogIn,
  BookOpen,
  Volume2,
  VolumeX,
  ShieldAlert,
  Bot,
  Sparkles,
  Wifi,
  WifiOff,
  RotateCw,
} from 'lucide-react';
import { soundService } from '../services/sound';

interface MainMenuProps {
  username: string;
  onSetUsername: (name: string) => void;
  onHostGame: (playerCount: 3 | 4) => void;
  onJoinGame: (roomCode: string) => void;
  onQuickPlayVsAi: () => void;
  onOpenHowToPlay: () => void;
  onOpenMasterPanel: () => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  onRetryConnection: () => void;
  urlRoomCode?: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  username,
  onSetUsername,
  onHostGame,
  onJoinGame,
  onQuickPlayVsAi,
  onOpenHowToPlay,
  onOpenMasterPanel,
  connectionStatus,
  onRetryConnection,
  urlRoomCode,
}) => {
  const [view, setView] = useState<
    'main' | 'choose_username' | 'host_select' | 'join_input'
  >(urlRoomCode && !username ? 'choose_username' : 'main');

  const [inputName, setInputName] = useState(username || '');
  const [inputRoomCode, setInputRoomCode] = useState(urlRoomCode || '');
  const [nameError, setNameError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [pendingAction, setPendingAction] = useState<
    'host' | 'join' | 'ai' | null
  >(urlRoomCode ? 'join' : null);

  const [sfxOn, setSfxOn] = useState(true);

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    soundService.setSettings(next, true, 0.8);
    if (next) soundService.playCardSnap();
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputName.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    if (!clean) {
      setNameError('Please enter a display name');
      return;
    }
    if (clean.length > 20) {
      setNameError('Name must be 20 characters or less');
      return;
    }

    setNameError('');
    onSetUsername(clean);

    if (clean === 'K#ub@!b') {
      onOpenMasterPanel();
    }

    if (pendingAction === 'host') {
      setView('host_select');
    } else if (pendingAction === 'join') {
      if (urlRoomCode) {
        onJoinGame(urlRoomCode);
      } else {
        setView('join_input');
      }
    } else if (pendingAction === 'ai') {
      onQuickPlayVsAi();
    } else {
      setView('main');
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputRoomCode.trim();
    if (!/^\d{4}$/.test(cleanCode)) {
      setRoomError('Room code must be a 4-digit number (e.g. 1234)');
      return;
    }
    setRoomError('');
    onJoinGame(cleanCode);
  };

  const isReservedUsername = username === 'K#ub@!b';

  return (
    <div className="relative w-full h-[calc(100vh-48px)] flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Background Ambience */}
      <div className="absolute inset-4 md:inset-8 rounded-[40px] border-[6px] border-[#2D1810] bg-gradient-to-b from-[#0B3B24] via-[#082819] to-[#04140C] shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] flex items-center justify-center -z-10">
        <div className="absolute inset-3 rounded-[32px] border border-amber-500/20" />
      </div>

      {/* Main Container Card */}
      <div className="relative w-full max-w-md flex flex-col items-center text-center p-6 md:p-8 rounded-3xl bg-emerald-950/90 border-2 border-amber-500/70 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-md">
        {/* Game Logo & Crest */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-xl mb-3 flex items-center justify-center">
          <div className="w-full h-full rounded-[14px] bg-[#062114] flex flex-col items-center justify-center">
            <span className="text-amber-400 text-2xl font-black">♠</span>
            <span className="text-[9px] font-mono font-bold text-amber-200 uppercase tracking-widest">
              BT
            </span>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-black tracking-wider text-amber-300 drop-shadow">
          BHABHI THULLA
        </h1>
        <p className="text-xs md:text-sm font-sans font-semibold text-emerald-300 mt-1 mb-6">
          گیٹ اوے · Traditional Pakistani Multiplayer
        </p>

        {/* Current Active Username Pill */}
        {username && view === 'main' && (
          <div className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-amber-500/40 text-xs text-slate-200">
            <span>Playing as:</span>
            <span className="font-bold text-amber-300">{username}</span>
            <button
              onClick={() => {
                setInputName(username);
                setView('choose_username');
              }}
              className="text-[10px] text-emerald-400 hover:text-white underline ml-1"
            >
              Change
            </button>
          </div>
        )}

        {/* VIEW 1: MAIN MENU ACTIONS */}
        {view === 'main' && (
          <div className="w-full space-y-3">
            {/* Quick Play vs AI */}
            <button
              onClick={() => {
                if (!username) {
                  setPendingAction('ai');
                  setView('choose_username');
                } else {
                  onQuickPlayVsAi();
                }
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-black text-sm md:text-base shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <Bot className="w-5 h-5 fill-emerald-950" />
              <span>Quick Play vs AI · اکیلے کھیلیں</span>
            </button>

            {/* Host Game */}
            <button
              onClick={() => {
                if (!username) {
                  setPendingAction('host');
                  setView('choose_username');
                } else {
                  setView('host_select');
                }
              }}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-900/90 hover:bg-emerald-800/90 border border-amber-500/40 text-slate-100 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Host Multiplayer Game · روم بنائیں</span>
            </button>

            {/* Join Game */}
            <button
              onClick={() => {
                if (!username) {
                  setPendingAction('join');
                  setView('choose_username');
                } else {
                  setView('join_input');
                }
              }}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-900/90 hover:bg-emerald-800/90 border border-emerald-700/80 text-slate-100 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Join with Room Code · روم میں شامل ہوں</span>
            </button>

            {/* How to Play */}
            <button
              onClick={onOpenHowToPlay}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>How to Play · کھیل کے اصول</span>
            </button>
          </div>
        )}

        {/* VIEW 2: CHOOSE USERNAME */}
        {view === 'choose_username' && (
          <form onSubmit={handleNameSubmit} className="w-full space-y-4">
            <div className="text-left">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1.5">
                Enter Your Name · اپنا نام درج کریں
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Enter username (e.g. Ali, Hamza)"
                value={inputName}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputName(val);
                  if (val.trim() === 'K#ub@!b') {
                    onSetUsername('K#ub@!b');
                    onOpenMasterPanel();
                  }
                }}
                maxLength={20}
                className="w-full px-4 py-3 rounded-2xl bg-emerald-950 border border-amber-500/50 text-white placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-semibold shadow-inner"
              />
              {nameError && (
                <p className="text-xs text-rose-400 mt-1 font-semibold">{nameError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView('main')}
                className="w-1/3 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-xs font-bold text-slate-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-black text-sm shadow transition"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: HOST SELECT PLAYER COUNT */}
        {view === 'host_select' && (
          <div className="w-full space-y-4">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
              Select Match Size
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onHostGame(3)}
                className="p-4 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 border-2 border-emerald-700 hover:border-amber-400 flex flex-col items-center transition"
              >
                <Users className="w-6 h-6 text-amber-400 mb-1" />
                <span className="font-bold text-sm text-white">3 Players</span>
                <span className="text-[10px] text-emerald-300 mt-0.5">
                  17 cards each
                </span>
              </button>

              <button
                onClick={() => onHostGame(4)}
                className="p-4 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 border-2 border-emerald-700 hover:border-amber-400 flex flex-col items-center transition"
              >
                <Users className="w-6 h-6 text-amber-400 mb-1" />
                <span className="font-bold text-sm text-white">4 Players</span>
                <span className="text-[10px] text-emerald-300 mt-0.5">
                  13 cards each (Standard)
                </span>
              </button>
            </div>

            <button
              onClick={() => setView('main')}
              className="w-full py-2 rounded-xl bg-emerald-950 text-slate-400 text-xs hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* VIEW 4: JOIN ROOM WITH 4-DIGIT CODE */}
        {view === 'join_input' && (
          <form onSubmit={handleJoinSubmit} className="w-full space-y-4">
            <div className="text-left">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1.5">
                Enter 4-Digit Room Code
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. 4829"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value.replace(/\D/g, ''))}
                maxLength={4}
                className="w-full px-4 py-3 rounded-2xl bg-emerald-950 border border-amber-500/50 text-amber-300 placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center font-mono text-2xl font-black tracking-widest shadow-inner"
              />
              {roomError && (
                <p className="text-xs text-rose-400 mt-1 font-semibold text-center">
                  {roomError}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView('main')}
                className="w-1/3 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-xs font-bold text-slate-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-black text-sm shadow transition"
              >
                Join Room
              </button>
            </div>
          </form>
        )}

        {/* Connection Notice / Retry */}
        {connectionStatus === 'disconnected' && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-600/60 text-xs text-rose-200 flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-rose-400" />
              <span>Offline from game server</span>
            </div>
            <button
              onClick={onRetryConnection}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-900 hover:bg-rose-800 text-white font-bold text-[11px]"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
