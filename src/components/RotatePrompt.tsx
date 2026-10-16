import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

export const RotatePrompt: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isPort = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortrait(isPort);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-emerald-950 font-bold text-xs shadow-2xl flex items-center gap-2.5 border border-amber-300 animate-bounce">
      <Smartphone className="w-4 h-4 rotate-90 shrink-0" />
      <span>Rotate device to landscape for the best card table view</span>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-amber-800/20 rounded-full transition"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
