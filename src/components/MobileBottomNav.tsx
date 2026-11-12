import React from 'react';
import { ViewMode } from '../types';
import { Calendar, Sun, CheckCircle, Mic, Plus } from 'lucide-react';

interface MobileBottomNavProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenVoiceModal: () => void;
  onOpenNewTaskModal: () => void;
  todayCount: number;
  weekCount: number;
  allCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode,
  onViewModeChange,
  onOpenVoiceModal,
  onOpenNewTaskModal,
  todayCount,
  weekCount,
  allCount,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-amber-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 px-1.5 sm:px-3 w-full max-w-full overflow-hidden">
      <div className="max-w-md mx-auto flex items-center justify-around sm:justify-between relative w-full">
        {/* Tab 1: Today */}
        <button
          type="button"
          onClick={() => onViewModeChange('today')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer ${
            viewMode === 'today'
              ? 'text-amber-600 scale-105 font-black'
              : 'text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <div className="relative">
            <Sun className={`w-5 h-5 ${viewMode === 'today' ? 'stroke-[2.5] text-amber-500' : ''}`} />
            {todayCount > 0 && (
              <span className="absolute -top-1 -end-2 w-4 h-4 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black flex items-center justify-center">
                {todayCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5">היום</span>
        </button>

        {/* Tab 2: Week */}
        <button
          type="button"
          onClick={() => onViewModeChange('week')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer ${
            viewMode === 'week'
              ? 'text-rose-600 scale-105 font-black'
              : 'text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <div className="relative">
            <Calendar className={`w-5 h-5 ${viewMode === 'week' ? 'stroke-[2.5] text-rose-500' : ''}`} />
            {weekCount > 0 && (
              <span className="absolute -top-1 -end-2 w-4 h-4 rounded-full bg-rose-400 text-white text-[10px] font-black flex items-center justify-center">
                {weekCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5">השבוע</span>
        </button>

        {/* Center Button: Smart Voice Mic (Pulsing, elevated for thumbs) */}
        <div className="relative -top-5 flex flex-col items-center shrink-0">
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="group relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-300/80 active:scale-90 transition-all border-4 border-white cursor-pointer"
            aria-label="פתח עוזר קולי"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-40 pointer-events-none" />
            <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform relative z-10" />
          </button>
          <span className="text-[10px] font-extrabold text-slate-700 mt-0.5">דיבור</span>
        </div>

        {/* Tab 3: All Tasks */}
        <button
          type="button"
          onClick={() => onViewModeChange('all')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer ${
            viewMode === 'all'
              ? 'text-emerald-600 scale-105 font-black'
              : 'text-slate-400 hover:text-slate-600 font-bold'
          }`}
        >
          <div className="relative">
            <CheckCircle className={`w-5 h-5 ${viewMode === 'all' ? 'stroke-[2.5] text-emerald-500' : ''}`} />
            {allCount > 0 && (
              <span className="absolute -top-1 -end-2 w-4 h-4 rounded-full bg-emerald-400 text-white text-[10px] font-black flex items-center justify-center">
                {allCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5">הכל</span>
        </button>

        {/* Tab 4: Manual Add */}
        <button
          type="button"
          onClick={onOpenNewTaskModal}
          className="flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 rounded-2xl text-slate-500 hover:text-slate-700 transition-all cursor-pointer font-bold"
        >
          <div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-slate-700 stroke-[3]" />
          </div>
          <span className="text-[11px] mt-0.5">הוספה</span>
        </button>
      </div>
    </nav>
  );
};
