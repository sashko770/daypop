export type TaskCategory = 'work' | 'personal' | 'health' | 'errands' | 'study' | 'general';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  category?: TaskCategory;
  priority?: TaskPriority;
  notes?: string;
  createdAt: string;
}

export type ViewMode = 'today' | 'week' | 'all';

export interface DayInfo {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // ראשון, שני...
  dayShort: string; // א', ב'...
  dateFormatted: string; // 12 נוב'
  dayNumber: number; // 12
  isToday: boolean;
  isPast: boolean;
  tasks: Task[];
}
