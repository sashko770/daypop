import React from 'react';
import { ViewMode } from '../types';
import { Plus } from 'lucide-react';
import { formatHebrewFullDate, getTodayDateStr } from '../utils/dateUtils';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenVoiceModal: () => void;
  onOpenNewTaskModal: () => void;
  onResetSampleData?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  todayCount: number;
  weekCount: number;
  allCount: number;
  userName?: string;
  onOpenEditName?: () => void;
  onOpenAndroidInstall?: () => void;
  isInstallable?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenVoiceModal,
  onOpenNewTaskModal,
  todayCount,
  weekCount,
  allCount,
  userName,
  onOpenEditName,
  onOpenAndroidInstall,
  isInstallable,
}) => {
  const todayStr = getTodayDateStr();
  const formattedToday = formatHebrewFullDate(todayStr);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-amber-100/80 shadow-2xs w-full max-w-full overflow-hidden">
      <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3.5">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
          {/* Brand Logo & Personalized Greeting */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-emerald-400 p-0.5 shadow-xs flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-base sm:text-xl">
                ✨
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-l from-amber-600 via-rose-500 to-emerald-600 bg-clip-text text-transparent shrink-0">
                  DayPop
                </h1>
                {userName && (
                  <button
                    type="button"
                    onClick={onOpenEditName}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-200 text-amber-900 text-[10px] sm:text-[11px] font-extrabold transition-colors cursor-pointer min-w-0"
                    title="לחץ לעריכת שמך"
                  >
                    <span className="truncate max-w-[70px] sm:max-w-[120px]">היי {userName} 👋</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                {formattedToday}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Tabs (Hidden on mobile where bottom nav is active) */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-amber-100/60 rounded-2xl border border-amber-200/50 me-2">
              <button
                type="button"
                onClick={() => onViewModeChange('today')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'today'
                    ? 'bg-white text-amber-900 shadow-xs scale-102 font-extrabold'
                    : 'text-amber-800/80 hover:text-amber-950'
                }`}
              >
                ☀️ היום ({todayCount})
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('week')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-white text-rose-900 shadow-xs scale-102 font-extrabold'
                    : 'text-amber-800/80 hover:text-amber-950'
                }`}
              >
                🗓️ השבוע ({weekCount})
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-white text-emerald-900 shadow-xs scale-102 font-extrabold'
                    : 'text-amber-800/80 hover:text-amber-950'
                }`}
              >
                📋 הכל ({allCount})
              </button>
            </div>


            {/* Android / PWA Install Button */}
            <button
              type="button"
              onClick={onOpenAndroidInstall}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              title="התקנת אפליקציה לאנדרואיד (WebAPK / APK)"
            >
              <span className="text-sm">🤖</span>
              <span className="hidden sm:inline">התקנה לאנדרואיד</span>
              <span className="sm:hidden text-[11px]">התקן</span>
              {isInstallable && (
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-300 animate-ping" />
              )}
            </button>

            {/* Manual New Task Button */}
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              <span className="hidden sm:inline">משימה</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
