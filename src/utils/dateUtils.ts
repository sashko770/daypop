export const HEBREW_DAYS = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'שבת',
];

export const HEBREW_DAYS_SHORT = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", 'שבת'];

export const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds days to a date string (YYYY-MM-DD)
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return getTodayDateStr(date);
}

/**
 * Returns human-friendly Hebrew relative date label
 */
export function formatHebrewRelativeDate(targetDateStr: string, referenceDateStr = getTodayDateStr()): string {
  if (targetDateStr === referenceDateStr) {
    return 'היום';
  }
  if (targetDateStr === addDays(referenceDateStr, 1)) {
    return 'מחר';
  }
  if (targetDateStr === addDays(referenceDateStr, 2)) {
    return 'מחרתיים';
  }
  if (targetDateStr === addDays(referenceDateStr, -1)) {
    return 'אתמול';
  }

  const [y, m, d] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const dayName = HEBREW_DAYS[targetDate.getDay()];
  const monthName = HEBREW_MONTHS[targetDate.getMonth()];

  return `${dayName}, ${d} ב${monthName}`;
}

/**
 * Format full date nicely: "יום חמישי, 12 בנובמבר 2026"
 */
export function formatHebrewFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const dayName = HEBREW_DAYS[targetDate.getDay()];
  const monthName = HEBREW_MONTHS[targetDate.getMonth()];

  return `${dayName}, ${d} ב${monthName}`;
}

/**
 * Returns an array of dates for the next 7 days starting from today
 */
export function getUpcomingWeekDays(startDateStr = getTodayDateStr()): Array<{
  dateStr: string;
  dayName: string;
  dayShort: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
}> {
  const list = [];
  for (let i = 0; i < 7; i++) {
    const curDateStr = addDays(startDateStr, i);
    const [y, m, d] = curDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayIndex = dateObj.getDay();

    list.push({
      dateStr: curDateStr,
      dayName: HEBREW_DAYS[dayIndex],
      dayShort: HEBREW_DAYS_SHORT[dayIndex],
      dayNumber: d,
      monthName: HEBREW_MONTHS[dateObj.getMonth()],
      isToday: i === 0,
    });
  }
  return list;
}

/**
 * Returns the current calendar week (Sunday to Saturday) containing the reference date
 */
export function getCalendarWeekDays(referenceDateStr = getTodayDateStr()): Array<{
  dateStr: string;
  dayName: string;
  dayShort: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
}> {
  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const refDate = new Date(y, m - 1, d);
  const dayOfWeek = refDate.getDay(); // 0 is Sunday

  // Sunday of current week
  const sunday = new Date(refDate);
  sunday.setDate(refDate.getDate() - dayOfWeek);
  const sundayStr = getTodayDateStr(sunday);

  return getUpcomingWeekDays(sundayStr);
}
