import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  MessageSquare,
  HelpCircle,
  Wifi,
  WifiOff,
  Settings,
  Shield,
  FileText,
  Eye,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { soundService } from '../services/sound';

interface HeaderHudProps {
  roomCode?: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  onRetryConnection: () => void;
  onOpenMasterPanel: () => void;
  onOpenHowToPlay: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
  onOpenViewCards: () => void;
  onRequestExit: () => void;
  isMasterAuthorized: boolean;
  username: string;
}

export const HeaderHud: React.FC<HeaderHudProps> = ({
  roomCode,
  connectionStatus,
  onRetryConnection,
  onOpenMasterPanel,
  onOpenHowToPlay,
  onOpenLegal,
  onOpenViewCards,
  onRequestExit,
  isMasterAuthorized,
  username,
}) => {
  const [sfxOn, setSfxOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    soundService.setSettings(next, voiceOn, 0.8);
    if (next) soundService.playCardSnap();
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    soundService.setSettings(sfxOn, next, 0.8);
  };

  const isReservedUsername = username === 'K#ub@!b';

  return (
    <header className="relative w-full z-30 px-3 py-2 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-[#04140C]/95 to-transparent">
      {/* Brand & Room Badge */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 font-serif font-black text-xs shadow">
            ♠
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif font-black text-xs md:text-sm tracking-wider text-amber-300">
              BHABHI THULLA
            </span>
            <span className="text-[9px] font-sans text-emerald-400 font-medium">
              گیٹ اوے · Pakistani Card Room
            </span>
          </div>
        </div>

        {/* Room Badge */}
        {roomCode && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-amber-500/50 text-[11px] font-mono text-amber-300 font-bold shadow">
            <span>Room: {roomCode}</span>
          </div>
        )}
      </div>

      {/* Center Developer Credit */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-950/90 via-[#0B3B24] to-emerald-950/90 border border-amber-400/50 shadow-md">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="text-[10px] md:text-xs font-semibold text-emerald-300">
          Developer:
        </span>
        <span className="text-xs md:text-sm font-black font-serif text-amber-300 tracking-wide">
          Malik Khubaib
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Connection Status Indicator */}
        <div
          onClick={connectionStatus === 'disconnected' ? onRetryConnection : undefined}
          title={
            connectionStatus === 'connected'
              ? 'Server Connected'
              : connectionStatus === 'connecting'
              ? 'Connecting to Server...'
              : 'Connection Lost · Click to Retry'
          }
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition ${
            connectionStatus === 'connected'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              : connectionStatus === 'connecting'
              ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
              : 'bg-rose-950/80 border-rose-500 text-rose-300 cursor-pointer hover:bg-rose-900'
          }`}
        >
          {connectionStatus === 'connected' ? (
            <Wifi className="w-3 h-3 text-emerald-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-rose-400" />
          )}
          <span className="hidden md:inline capitalize">{connectionStatus}</span>
        </div>

        {/* SFX Toggle */}
        <button
          onClick={toggleSfx}
          className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-slate-300 hover:text-amber-300 transition"
          title={sfxOn ? 'Mute SFX' : 'Enable SFX'}
        >
          {sfxOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Urdu Commentary Toggle */}
        <button
          onClick={toggleVoice}
          className={`p-1.5 rounded-xl border transition ${
            voiceOn
              ? 'bg-emerald-950/80 border-emerald-700 text-amber-400'
              : 'bg-emerald-950/50 border-emerald-900 text-slate-500'
          }`}
          title={voiceOn ? 'Commentary Audio Active' : 'Commentary Muted'}
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* How to Play Guide Button */}
        <button
          onClick={onOpenHowToPlay}
          className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-amber-300 hover:text-white transition"
          title="Game Rules & Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings / Actions dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-slate-300 transition"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {showSettingsMenu && (
            <div className="absolute right-0 top-10 w-48 rounded-2xl bg-[#062114] border border-amber-500/50 shadow-2xl p-1.5 text-xs text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Master-Only Option: View Cards during game! */}
              {(isMasterAuthorized || isReservedUsername) && (
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    onOpenViewCards();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-left transition border border-amber-500/30 mb-1"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>View Cards (پتے دیکھیں)</span>
                </button>
              )}

              {/* Exit Game with Password Malik123 */}
              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  onRequestExit();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-950/60 text-rose-300 font-bold text-left transition mb-1"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Exit Game · باہر جائیں</span>
              </button>

              <div className="h-px bg-emerald-800/60 my-1" />

              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  onOpenLegal('privacy');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-emerald-900 text-left transition text-slate-300"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Privacy Policy</span>
              </button>
              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  onOpenLegal('terms');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-emerald-900 text-left transition text-slate-300"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Terms & Conditions</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
