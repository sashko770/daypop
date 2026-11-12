import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { X, Calendar, Clock, Check } from 'lucide-react';
import { getTodayDateStr, addDays } from '../utils/dateUtils';
import { playTaskAddedSound } from '../utils/sound';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onUpdateTask?: (task: Task) => void;
  initialTask?: Task | null;
  defaultDate?: string;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  onUpdateTask,
  initialTask,
  defaultDate,
}) => {
  const today = getTodayDateStr();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate || today);
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDate(initialTask.date);
      setTime(initialTask.time || '10:00');
      setNotes(initialTask.notes || '');
    } else {
      setTitle('');
      setDate(defaultDate || today);
      setTime('10:00');
      setNotes('');
    }
  }, [initialTask, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (initialTask && onUpdateTask) {
      onUpdateTask({
        ...initialTask,
        title: title.trim(),
        date,
        time: time || undefined,
        category: initialTask.category || 'general',
        priority: initialTask.priority || 'medium',
        notes: notes.trim() || undefined,
      });
    } else {
      onSaveTask({
        title: title.trim(),
        date,
        time: time || undefined,
        category: 'general',
        priority: 'medium',
        notes: notes.trim() || undefined,
      });
      playTaskAddedSound();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
              {initialTask ? '✏️' : '✨'}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {initialTask ? 'עריכת משימה' : 'הוספת משימה חדשה'}
              </h3>
              <p className="text-xs text-white/90 font-medium">
                תכנון פשוט, מהיר וללא עומס
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              שם המשימה <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: לקנות מצרכים לארוחת ערב 🛒"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-slate-50/50 font-medium"
              autoFocus
            />
          </div>

          {/* Date & Quick Date Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">תאריך</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDate(today)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                    date === today ? 'bg-amber-200 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  היום
                </button>
                <button
                  type="button"
                  onClick={() => setDate(addDays(today, 1))}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                    date === addDays(today, 1) ? 'bg-amber-200 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  מחר
                </button>
                <button
                  type="button"
                  onClick={() => setDate(addDays(today, 2))}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                    date === addDays(today, 2) ? 'bg-amber-200 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  מחרתיים
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-white"
            />
          </div>

          {/* Time Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">שעה (אופציונלי)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-white"
            />
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">הערה קצרה (אופציונלי)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="מיקום, פרטים קצרים או תזכורת..."
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm bg-white"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{initialTask ? 'שמור שינויים' : 'הוסף משימה'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
