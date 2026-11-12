import { Task } from '../types';
import { getTodayDateStr, addDays } from './dateUtils';

export function getSampleTasks(): Task[] {
  const today = getTodayDateStr();
  const tomorrow = addDays(today, 1);
  const inTwoDays = addDays(today, 2);
  const inThreeDays = addDays(today, 3);
  const inFiveDays = addDays(today, 5);

  return [
    {
      id: 'task-sample-1',
      title: 'לשתות 2 ליטר מים ומתיחות בוקר 💧',
      completed: true,
      completedAt: new Date().toISOString(),
      date: today,
      time: '08:30',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-sample-2',
      title: 'פגישת סנכרון עם הצוות 💼',
      completed: false,
      date: today,
      time: '11:00',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-sample-3',
      title: 'לקנות מצרכים לארוחת ערב 🛒',
      completed: false,
      date: today,
      time: '17:30',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-sample-4',
      title: 'אימון כושר או הליכה מהירה 🏃‍♂️',
      completed: false,
      date: today,
      time: '19:15',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-sample-5',
      title: 'שיעור ספרדית באפליקציה 📚',
      completed: false,
      date: tomorrow,
      time: '09:00',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-sample-6',
      title: 'בדיקת שיניים במרפאה 🦷',
      completed: false,
      date: tomorrow,
      time: '14:00',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-sample-7',
      title: 'פגישת פיתוח ותכנון רבעוני 💻',
      completed: false,
      date: inTwoDays,
      time: '10:30',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-sample-8',
      title: 'לקחת חבילה ממרכז המסירה 📦',
      completed: false,
      date: inThreeDays,
      time: '16:00',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-sample-9',
      title: 'ארוחת ערב משפחתית 🥗✨',
      completed: false,
      date: inFiveDays,
      time: '19:30',
      createdAt: new Date().toISOString(),
    },
  ];
}
