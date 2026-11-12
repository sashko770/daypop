import React, { useState } from 'react';
import { Sparkles, User, ArrowLeft, Heart } from 'lucide-react';
import { fireTaskConfetti } from '../utils/confetti';
import { playTaskAddedSound } from '../utils/sound';

interface WelcomeModalProps {
  isOpen: boolean;
  initialName?: string;
  onSaveName: (name: string) => void;
  onClose?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  initialName = '',
  onSaveName,
  onClose,
}) => {
  const [name, setName] = useState(initialName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    onSaveName(cleanName);
    fireTaskConfetti();
    playTaskAddedSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-amber-300 overflow-hidden text-center p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Playful Floating Avatar Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-400 to-rose-500 p-1 shadow-lg shadow-rose-200/80 flex items-center justify-center transform hover:rotate-6 transition-transform">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-3xl">
            👋
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400"></span>
          </span>
        </div>

        {/* Heading & Subtext */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            שלום! איך לקרוא לך?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            העוזר הקולי האישי שלך יקרא לך בשמך ויתאים את לוח הזמנים במיוחד בשבילך ✨
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
              <User className="w-5 h-5 text-amber-500" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הקלד את שמך כאן..."
              className="w-full pr-11 pl-4 py-3 rounded-2xl border-2 border-amber-200 focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-100 text-base font-bold text-slate-800 text-center bg-amber-50/30 transition-all placeholder:text-slate-400"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-lg shadow-rose-200 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>נעים להכיר, בוא נתחיל!</span>
            <Sparkles className="w-4 h-4 text-amber-200" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors cursor-pointer"
            >
              ביטול
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
