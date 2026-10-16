import React from 'react';
import { X, BookOpen, AlertTriangle, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-[#062114] border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950/90 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg md:text-xl font-bold font-serif text-amber-300">
              How to Play Bhabhi Thulla · بھابھی ٹھُلا کے اصول
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
          {/* Section 1: Objective */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <Trophy className="w-4 h-4" />
              <span>1. The Objective: Get Away (بچنا)!</span>
            </div>
            <p>
              Unlike most trick-taking card games where players try to win points, in
              <strong> Bhabhi Thulla</strong> (also known as <em>Get Away</em>), the sole goal is to
              empty your hand of cards as quickly as possible. The first player to shed all cards
              escapes in <strong>1st Place</strong>. The last remaining player holding cards is the
              <strong> Bhabhi</strong>!
            </p>
          </div>

          {/* Section 2: First Trick */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>2. Opening Trick: Hukam Ka Ikka (♠A)</span>
            </div>
            <p>
              Cards are dealt equally. The player holding the <strong>Ace of Spades (♠A)</strong> must
              lead the very first trick. Every player who holds a Spade must follow suit. By traditional
              courtesy, the opening trick is protected—cards are cleared safely to the discard pile.
            </p>
          </div>

          {/* Section 3: Suit Following */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>3. Suit Following (Chaal Chalna)</span>
            </div>
            <p>
              In subsequent tricks, the leader plays any card they wish. Each player in clockwise order
              <strong> must follow the lead suit</strong> if they hold even one card of that suit.
              Cards rank from <strong>2 (Lowest)</strong> to <strong>Ace (Highest)</strong>.
            </p>
          </div>

          {/* Section 4: THULLA! */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 to-emerald-950/80 border border-red-500/60">
            <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>4. THULLA! (ٹھُلا لگ گیا!)</span>
            </div>
            <p className="mb-1.5">
              If a player holds <strong>no cards of the lead suit</strong>, they can strike with any
              off-suit card. This explosive strike is a <strong>THULLA</strong>!
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li>
                The player who played the <strong>highest card of the lead suit</strong> is caught in the
                penalty.
              </li>
              <li>
                That player must <strong>pick up all cards in the trick</strong> into their hand!
              </li>
              <li>
                The player who struck the Thulla gets the lead for the next trick to continue their attack.
              </li>
            </ul>
          </div>

          {/* Section 5: Winning & Bhabhi */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <Trophy className="w-4 h-4" />
              <span>5. Escaping & Declaring the Bhabhi</span>
            </div>
            <p>
              When your last card is played, you escape safe and celebrate! Once all but one player have
              escaped, the game ends immediately and the unlucky last player is crowned the
              <strong> Bhabhi</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-emerald-950/90 border-t border-amber-500/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-bold text-xs shadow transition active:scale-95"
          >
            Samajh Gaya (Got It!)
          </button>
        </div>
      </div>
    </div>
  );
};
