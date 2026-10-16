import React, { useState } from 'react';
import { Lock, X, LogOut, AlertCircle, KeyRound } from 'lucide-react';

interface ExitPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export const ExitPasswordModal: React.FC<ExitPasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Malik123') {
      setError('');
      setPassword('');
      onConfirmExit();
    } else {
      setError('Incorrect exit password! Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#062114] border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-slate-100 p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold font-serif text-amber-300">
            Exit Game Verification
          </h3>
          <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
            Please enter the exit security pass to leave the card room.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-emerald-500" />
              <input
                type="password"
                autoFocus
                placeholder="Enter exit pass"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-emerald-950 border border-amber-500/50 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-semibold"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-xs font-bold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-emerald-950 font-black text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Exit</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
