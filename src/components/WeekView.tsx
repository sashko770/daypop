import React, { useState } from 'react';
import { Task } from '../types';
import { getUpcomingWeekDays } from '../utils/dateUtils';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface WeekViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onRescheduleTomorrow: (id: string) => void;
  onEditTask: (task: Task) => void;
  onQuickAddForDate: (dateStr: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onRescheduleTomorrow,
  onEditTask,
  onQuickAddForDate,
}) => {
  const weekDays = getUpcomingWeekDays();
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const displayedDays = selectedDateFilter
    ? weekDays.filter((d) => d.dateStr === selectedDateFilter)
    : weekDays;

  return (
    <div className="space-y-4">
      {/* 7-Days Horizontal Selector Pills (mobile touch friendly) */}
      <div className="flex sm:grid sm:grid-cols-7 gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
        {weekDays.map((day) => {
          const dayTasks = tasks.filter((t) => t.date === day.dateStr);
          const completedCount = dayTasks.filter((t) => t.completed).length;
          const isSelected = selectedDateFilter === day.dateStr;
          const isAllDone = dayTasks.length > 0 && completedCount === dayTasks.length;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDateFilter(isSelected ? null : day.dateStr)}
              className={`min-w-[62px] sm:min-w-0 flex-1 p-2 sm:p-2.5 rounded-2xl border text-center transition-all cursor-pointer transform active:scale-95 shrink-0 snap-start ${
                isSelected
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-102 font-bold ring-2 ring-rose-400'
                  : day.isToday
                  ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-bold shadow-xs'
                  : 'bg-white border-amber-200/70 text-slate-700 hover:bg-amber-50'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase">
                {day.isToday ? 'היום' : day.dayShort}
              </div>
              <div className="text-base sm:text-lg font-black my-0.5">
                {day.dayNumber}
              </div>
              <div className="text-[9px] font-bold">
                {isAllDone ? (
                  <span className="text-emerald-500 bg-emerald-50 px-1 py-0.2 rounded-full font-bold">
                    ✓
                  </span>
                ) : (
                  <span className={isSelected ? 'text-white/90' : 'text-slate-400'}>
                    {dayTasks.length}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Reset if a day is focused */}
      {selectedDateFilter && (
        <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-rose-200">
          <span className="text-xs font-bold text-slate-700">
            מציג יום בודד
          </span>
          <button
            type="button"
            onClick={() => setSelectedDateFilter(null)}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
          >
            הצג את כל השבוע
          </button>
        </div>
      )}

      {/* Days Breakdown */}
      <div className="space-y-4">
        {displayedDays.map((day) => {
          const dayTasks = tasks.filter((t) => t.date === day.dateStr);
          const completedCount = dayTasks.filter((t) => t.completed).length;

          return (
            <div
              key={day.dateStr}
              className="bg-white/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-amber-200/70 shadow-xs space-y-2.5"
            >
              {/* Day Header Row */}
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      day.isToday
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {day.dayShort}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-1.5">
                      <span>{day.dayName}</span>
                      <span className="text-xs font-normal text-slate-400">
                        {day.dayNumber} ב{day.monthName}
                      </span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                          היום
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                {/* Quick Add Button */}
                <button
                  type="button"
                  onClick={() => onQuickAddForDate(day.dateStr)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>הוסף</span>
                </button>
              </div>

              {/* Tasks for this day */}
              {dayTasks.length > 0 ? (
                <div className="space-y-2 pt-0.5">
                  {dayTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onDeleteTask={onDeleteTask}
                      onRescheduleTomorrow={onRescheduleTomorrow}
                      onEditTask={onEditTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center rounded-xl border border-dashed border-amber-200/60 bg-amber-50/20">
                  <p className="text-xs font-medium text-slate-400">
                    אין משימות מתוכננות ליום זה
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
