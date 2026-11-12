import React, { useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

interface AndroidBannerProps {
  isInstalled: boolean;
  onOpenModal: () => void;
}

export const AndroidBanner: React.FC<AndroidBannerProps> = ({ isInstalled, onOpenModal }) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('daypop_dismiss_android_banner') === 'true';
    } catch {
      return false;
    }
  });

  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('daypop_dismiss_android_banner', 'true');
    } catch {
      // ignore
    }
  };

  return (
    <div
      dir="rtl"
      className="w-full max-w-full overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-md flex items-center justify-between gap-1.5 sm:gap-2 z-20 border-b border-emerald-400/40 text-xs"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
        <span className="text-sm sm:text-base shrink-0">🤖</span>
        <div className="truncate min-w-0">
          <span className="font-black text-[11px] sm:text-xs">גרסת אנדרואיד זמינה</span>{' '}
          <span className="hidden md:inline text-emerald-100 font-medium text-[11px]">
            – התקן את DayPop כמערכת עצמאית
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenModal}
          className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-white text-emerald-900 font-black text-[11px] sm:text-xs hover:bg-emerald-50 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1 whitespace-nowrap"
        >
          <Download className="w-3 h-3 text-emerald-700 stroke-[2.5]" />
          <span>התקנה</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-black/10 transition-colors cursor-pointer"
          aria-label="סגור הודעה"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
