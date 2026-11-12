import React, { useRef } from 'react';
import { Task } from '../types';
import { Check, Clock, Calendar, Trash2, ArrowRight, Edit2 } from 'lucide-react';
import { formatHebrewRelativeDate, getTodayDateStr } from '../utils/dateUtils';
import { fireTaskConfetti } from '../utils/confetti';
import { playTaskCompleteSound } from '../utils/sound';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onRescheduleTomorrow: (id: string) => void;
  onEditTask: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onDeleteTask,
  onRescheduleTomorrow,
  onEditTask,
}) => {
  const checkBtnRef = useRef<HTMLButtonElement>(null);
  const relativeDate = formatHebrewRelativeDate(task.date);
  const isToday = task.date === getTodayDateStr();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      if (checkBtnRef.current) {
        const rect = checkBtnRef.current.getBoundingClientRect();
        fireTaskConfetti({
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        });
      } else {
        fireTaskConfetti();
      }
      playTaskCompleteSound();
    }
    onToggleComplete(task.id);
  };

  return (
    <div
      className={`group relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border transition-all duration-200 ${
        task.completed
          ? 'bg-slate-50/70 border-slate-200/80 opacity-75'
          : 'bg-white border-amber-200/70 hover:border-amber-300 shadow-xs hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Bouncy Complete Checkbox Button */}
        <button
          ref={checkBtnRef}
          type="button"
          onClick={handleToggle}
          className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center transition-all transform active:scale-80 cursor-pointer ${
            task.completed
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
              : 'border-2 border-amber-300 hover:border-emerald-500 bg-amber-50/50 hover:bg-emerald-50 hover:scale-105'
          }`}
          aria-label={task.completed ? 'סמן כלא הושלם' : 'סמן כהושלם'}
        >
          {task.completed ? (
            <Check className="w-5 h-5 stroke-[3] animate-in zoom-in-50 duration-200" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-emerald-400 transition-colors" />
          )}
        </button>

        {/* Task Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Time Tag */}
            {task.time && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200/80">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{task.time}</span>
              </span>
            )}

            {/* Date Tag */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isToday
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{relativeDate}</span>
            </span>
          </div>

          {/* Title */}
          <h3
            className={`text-base sm:text-lg font-bold leading-snug break-words transition-all ${
              task.completed ? 'line-through text-slate-400' : 'text-slate-800'
            }`}
          >
            {task.title}
          </h3>

          {/* Notes or Voice origin */}
          {task.notes && (
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed font-normal">
              {task.notes}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="shrink-0 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Reschedule to Tomorrow */}
          {!task.completed && isToday && (
            <button
              onClick={() => onRescheduleTomorrow(task.id)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
              title="העבר למחר"
              aria-label="העבר למחר"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          )}

          {/* Edit Task */}
          <button
            onClick={() => onEditTask(task)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="ערוך משימה"
            aria-label="ערוך משימה"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Task */}
          <button
            onClick={() => onDeleteTask(task.id)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="מחק משימה"
            aria-label="מחק משימה"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
