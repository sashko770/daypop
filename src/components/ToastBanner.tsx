import React from 'react';
import { Sparkles, CheckCircle2, X } from 'lucide-react';

interface ToastBannerProps {
  message: string;
  subtext?: string;
  onDismiss: () => void;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({ message, subtext, onDismiss }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none animate-in slide-in-from-bottom-5 duration-300">
      <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-4 shadow-2xl border border-amber-300/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-lg shrink-0 shadow-md">
            ⚡
          </div>
          <div>
            <div className="text-sm font-black text-amber-200 flex items-center gap-1.5">
              <span>{message}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            {subtext && <div className="text-xs text-slate-300 font-medium">{subtext}</div>}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="סגור התראה"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
