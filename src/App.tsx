import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, ViewMode } from './types';
import { getSampleTasks } from './utils/sampleTasks';
import { getTodayDateStr, addDays } from './utils/dateUtils';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { TaskCard } from './components/TaskCard';
import { WeekView } from './components/WeekView';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { NewTaskModal } from './components/NewTaskModal';
import { WelcomeModal } from './components/WelcomeModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ToastBanner } from './components/ToastBanner';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { AndroidBanner } from './components/AndroidBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { usePWAInstall } from './hooks/usePWAInstall';
import { isSoundEnabled, setSoundEnabled, playAllDoneFanfare } from './utils/sound';
import { fireSuperConfetti } from './utils/confetti';
import { Plus, Search } from 'lucide-react';

const STORAGE_KEY = 'daypop_tasks_v3';
const USER_NAME_KEY = 'daypop_user_name';

export default function App() {
  const todayStr = getTodayDateStr();

  // User Name state (Customer name onboarding)
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem(USER_NAME_KEY) || '';
  });
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    return !localStorage.getItem(USER_NAME_KEY);
  });

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load tasks from localStorage', e);
    }
    return getSampleTasks();
  });

  // Sound toggle
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());

  // View state: 'today' | 'week' | 'all'
  const [viewMode, setViewMode] = useState<ViewMode>('today');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // PWA and Android Installation hook
  const { isInstallable, isInstalled, isAndroid, install: triggerNativeInstall } = usePWAInstall();
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<string | undefined>(undefined);

  // Quick inline add on Today's view
  const [quickTitle, setQuickTitle] = useState('');

  // Toast banner state
  const [toast, setToast] = useState<{ message: string; subtext?: string } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  // Show Toast Helper
  const showToast = (message: string, subtext?: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, subtext });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Save Customer Name
  const handleSaveUserName = (name: string) => {
    setUserName(name);
    localStorage.setItem(USER_NAME_KEY, name);
    setIsWelcomeModalOpen(false);
    showToast(`איזה כיף שבאת, ${name}! ✨`, 'העוזר הקולי האישי שלך מוכן לפקודות');
  };

  // Toggle Sound Helper
  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    showToast(next ? 'הצלילים הופעלו 🔔' : 'הצלילים הושתקו 🔕');
  };

  // Reset to sample data
  const handleResetSampleData = () => {
    const samples = getSampleTasks();
    setTasks(samples);
    showToast('נטענו משימות חדשות לדוגמה! ✨', 'תצוגת היום והשבוע מלאות ומוכנות');
  };

  // Task Actions
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    showToast('המשימה עודכנה בהצלחה! ✏️');
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('המשימה נמחקה');
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;

      const nextCompleted = !target.completed;
      const updated = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : undefined,
            }
          : t
      );

      // Check if all today tasks are completed now
      if (nextCompleted) {
        const todayTasks = updated.filter((t) => t.date === todayStr);
        if (todayTasks.length > 0 && todayTasks.every((t) => t.completed)) {
          setTimeout(() => {
            playAllDoneFanfare();
            fireSuperConfetti();
            showToast(`כל הכבוד, ${userName || 'אלופים'}! כל המשימות להיום הושלמו! 🏆🎉`);
          }, 350);
        }
      }

      return updated;
    });
  };

  const handleRescheduleTomorrow = (id: string) => {
    const tomorrow = addDays(todayStr, 1);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, date: tomorrow } : t))
    );
    showToast('המשימה הועברה למחר ➡️');
  };

  // Filter tasks based on view mode
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === todayStr);
  }, [tasks, todayStr]);

  const upcomingWeekTasks = useMemo(() => {
    const inSevenDays = addDays(todayStr, 7);
    return tasks.filter((t) => t.date >= todayStr && t.date <= inSevenDays);
  }, [tasks, todayStr]);

  const currentViewTasks = useMemo(() => {
    let list: Task[] = [];
    if (viewMode === 'today') {
      list = todayTasks;
    } else if (viewMode === 'week') {
      list = upcomingWeekTasks;
    } else {
      list = tasks;
    }

    if (statusFilter === 'pending') {
      list = list.filter((t) => !t.completed);
    } else if (statusFilter === 'completed') {
      list = list.filter((t) => t.completed);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [viewMode, todayTasks, upcomingWeekTasks, tasks, statusFilter, searchQuery]);

  // Quick Inline Add for Today
  const handleQuickAddToday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    handleAddTask({
      title: quickTitle.trim(),
      date: todayStr,
      time: '12:00',
    });

    setQuickTitle('');
    showToast(`נוספה משימה להיום: "${quickTitle.trim()}" ✨`);
  };

  const handleOpenQuickAddForDate = (dateStr: string) => {
    setEditingTask(null);
    setQuickAddDate(dateStr);
    setIsNewTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsNewTaskModalOpen(true);
  };

  const currentViewTitle =
    viewMode === 'today'
      ? 'המשימות להיום'
      : viewMode === 'week'
      ? 'השבוע הקרוב'
      : 'כל המשימות';

  const completedCount = currentViewTasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-b from-amber-50/50 via-rose-50/20 to-amber-50/40 text-slate-800 pb-24 sm:pb-28">
      {/* Smartphone-friendly Compact Header with Personal Greeting */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenNewTaskModal={() => {
          setEditingTask(null);
          setQuickAddDate(todayStr);
          setIsNewTaskModalOpen(true);
        }}
        todayCount={todayTasks.length}
        weekCount={upcomingWeekTasks.length}
        allCount={tasks.length}
        userName={userName}
        onOpenEditName={() => setIsWelcomeModalOpen(true)}
        onOpenAndroidInstall={() => setIsAndroidModalOpen(true)}
        isInstallable={isInstallable}
      />

      {/* Android PWA Install Notification Banner */}
      <AndroidBanner
        isInstalled={isInstalled}
        onOpenModal={() => setIsAndroidModalOpen(true)}
      />

      <main className="w-full max-w-xl mx-auto px-3 sm:px-4 pt-3 sm:pt-5 overflow-x-hidden">
        {/* Compact Progress Banner with Personal Cheer */}
        <StatsBanner
          total={currentViewTasks.length}
          completed={completedCount}
          viewTitle={currentViewTitle}
          userName={userName}
        />

        {/* View Mode: Week View or Today / All */}
        {viewMode === 'week' ? (
          <WeekView
            tasks={upcomingWeekTasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onRescheduleTomorrow={handleRescheduleTomorrow}
            onEditTask={handleEditTask}
            onQuickAddForDate={handleOpenQuickAddForDate}
          />
        ) : (
          <div className="space-y-3.5">
            {/* Quick Add Bar for Today */}
            {viewMode === 'today' && (
              <form
                onSubmit={handleQuickAddToday}
                className="bg-white rounded-2xl p-2 border border-amber-200/80 shadow-xs flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-black text-xs shrink-0">
                  ⚡
                </div>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder={userName ? `מה בתכנון להיום, ${userName}?` : 'הוסף משימה להיום...'}
                  className="flex-1 bg-transparent px-1 text-sm font-medium focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!quickTitle.trim()}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-40 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>הוסף</span>
                </button>
              </form>
            )}

            {/* Clean, Uncluttered Filter & Search Bar */}
            <div className="flex items-center justify-between gap-2">
              {/* Status Toggle */}
              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'all' ? 'bg-amber-100 text-amber-900 font-extrabold' : 'hover:bg-slate-50'
                  }`}
                >
                  הכל
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'pending' ? 'bg-amber-100 text-amber-900 font-extrabold' : 'hover:bg-slate-50'
                  }`}
                >
                  לביצוע
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'completed' ? 'bg-amber-100 text-amber-900 font-extrabold' : 'hover:bg-slate-50'
                  }`}
                >
                  הושלמו
                </button>
              </div>

              {/* Minimal Search */}
              <div className="relative flex-1 max-w-[170px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש..."
                  className="w-full bg-white pr-7 pl-2.5 py-1 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Task List */}
            {currentViewTasks.length > 0 ? (
              <div className="space-y-2">
                {currentViewTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onDeleteTask={handleDeleteTask}
                    onRescheduleTomorrow={handleRescheduleTomorrow}
                    onEditTask={handleEditTask}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-amber-200/80 bg-white/70 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 mx-auto flex items-center justify-center text-2xl">
                  🎉
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    {searchQuery
                      ? 'לא נמצאו משימות מתאימות'
                      : viewMode === 'today'
                      ? (userName ? `אין משימות להיום, ${userName}!` : 'אין משימות להיום!')
                      : 'אין משימות ברשימה'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-0.5">
                    {userName
                      ? `${userName}, הקש על כפתור המיקרופון למטה לפקודה קולית מהירה.`
                      : 'הקש על כפתור המיקרופון למטה לפקודה קולית, או הוסף ידנית.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Smartphone Bottom Navigation Bar (Thumbs Reach) */}
      <MobileBottomNav
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenNewTaskModal={() => {
          setEditingTask(null);
          setQuickAddDate(todayStr);
          setIsNewTaskModalOpen(true);
        }}
        todayCount={todayTasks.length}
        weekCount={upcomingWeekTasks.length}
        allCount={tasks.length}
      />

      {/* Voice Assistant Modal (Personalized with Customer Name) */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        userName={userName}
        onClose={() => setIsVoiceModalOpen(false)}
        onAddTask={handleAddTask}
        onShowToast={showToast}
      />

      {/* Manual Task Add/Edit Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => {
          setIsNewTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSaveTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
        initialTask={editingTask}
        defaultDate={quickAddDate}
      />

      {/* Welcome / Customer Name Onboarding Modal */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        initialName={userName}
        onSaveName={handleSaveUserName}
        onClose={userName ? () => setIsWelcomeModalOpen(false) : undefined}
      />

      {/* Android Installation Modal (WebAPK & APK Package) */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isAndroid={isAndroid}
        onTriggerInstall={triggerNativeInstall}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Toast Notification */}
      {toast && (
        <ToastBanner
          message={toast.message}
          subtext={toast.subtext}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
