import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-[#062114] border-2 border-amber-500/70 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950/90 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === 'privacy' ? (
              <Shield className="w-5 h-5 text-amber-400" />
            ) : (
              <FileText className="w-5 h-5 text-amber-400" />
            )}
            <h2 className="text-lg md:text-xl font-bold font-serif text-amber-300">
              {type === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm text-slate-200 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <p>
                <strong>Last Updated: October 2026</strong>
              </p>
              <h3 className="text-amber-400 font-bold text-sm">1. Information We Collect</h3>
              <p>
                Bhabhi Thulla is designed with privacy by default. We do not require account
                passwords or collect personal contact information. Display usernames chosen by players
                are stored ephemerally during multiplayer game sessions for room identification.
              </p>

              <h3 className="text-amber-400 font-bold text-sm">2. Real-Time Gameplay Data</h3>
              <p>
                Authoritative game states and card distribution are managed on the server to ensure
                fair play. Private card hands are strictly isolated and never transmitted to opponent
                clients during ordinary gameplay.
              </p>

              <h3 className="text-amber-400 font-bold text-sm">3. Local Storage</h3>
              <p>
                We may store user preferences (such as audio volume, sound effects toggle, and saved
                display name) locally in your device's browser localStorage for your convenience.
              </p>

              <h3 className="text-amber-400 font-bold text-sm">4. Data Security</h3>
              <p>
                Connections are routed through secure WebSockets and HTTPS. We do not sell or share
                any player information with third-party advertisers.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Last Updated: October 2026</strong>
              </p>
              <h3 className="text-amber-400 font-bold text-sm">1. Acceptance of Terms</h3>
              <p>
                By accessing and playing Bhabhi Thulla, you agree to these Terms and Conditions. This
                game is provided for casual entertainment and cultural recreation.
              </p>

              <h3 className="text-amber-400 font-bold text-sm">2. Fair Play & Conduct</h3>
              <p>
                Players agree not to engage in abusive behavior, offensive usernames, or attempts to
                disrupt the WebSocket server. The server enforces authoritative move validation.
              </p>

              <h3 className="text-amber-400 font-bold text-sm">3. Master Testing Mode</h3>
              <p>
                Master Mode testing tools are strictly restricted to authenticated development and QA
                purposes. Unauthorized access attempts are rejected server-side.
              </p>

              <h3 className="text-amber-400 font-bold text-sm">4. Disclaimer</h3>
              <p>
                The game is provided &quot;as is&quot; without warranties of any kind. Service
                availability may be subject to maintenance or network conditions.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-emerald-950/90 border-t border-amber-500/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-slate-200 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
