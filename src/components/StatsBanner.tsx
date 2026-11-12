import React from 'react';
import { Flame, CheckCircle2 } from 'lucide-react';

interface StatsBannerProps {
  total: number;
  completed: number;
  viewTitle: string;
  userName?: string;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ total, completed, viewTitle, userName }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const namePrefix = userName ? `${userName}, ` : '';

  let cheerMessage = `${namePrefix}בוא נתקתק משימות באנרגיות שיא! ✨`;
  let badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';

  if (total === 0) {
    cheerMessage = `${namePrefix}אין משימות ברשימה זו ✨`;
  } else if (percentage === 100) {
    cheerMessage = `כל הכבוד, ${namePrefix}כל המשימות הושלמו! 🏆🎉`;
    badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  } else if (percentage >= 75) {
    cheerMessage = `${namePrefix}כמעט סיימת הכל! עוד מאמץ קטן 🚀`;
    badgeColor = 'bg-rose-100 text-rose-900 border-rose-300';
  } else if (percentage >= 50) {
    cheerMessage = `${namePrefix}חצי דרך כבר מאחוריך! שומרים על קצב מעולה ⚡`;
    badgeColor = 'bg-sky-100 text-sky-900 border-sky-300';
  } else if (percentage > 0) {
    cheerMessage = `${namePrefix}התחלה נהדרת! ממשיכים לסמן וי 💪`;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-amber-200/70 shadow-xs relative overflow-hidden mb-4 sm:mb-6">
      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Title & Motivational Quote */}
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-800 truncate">
              {viewTitle}
            </h2>
            <span className={`text-[11px] px-2 py-0.2 rounded-full font-extrabold border ${badgeColor} shrink-0`}>
              {percentage}%
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium truncate">
            {cheerMessage}
          </p>
        </div>

        {/* Compact Right Stats */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1.5 rounded-xl border border-amber-100 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-black text-slate-800">
              {completed}/{total}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-white/95 px-2 py-1.5 rounded-xl border border-rose-100 shadow-2xs">
            <Flame className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-black text-rose-600">3🔥</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mt-2.5">
        <div className="w-full h-2.5 sm:h-3 bg-amber-200/50 rounded-full overflow-hidden p-0.5 border border-amber-300/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-emerald-400 transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${Math.max(percentage, total > 0 ? 3 : 0)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
