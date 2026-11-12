import { Task, TaskCategory, TaskPriority } from '../types';
import { getTodayDateStr } from './dateUtils';

export interface ParsedTaskResult {
  title: string;
  date: string;
  time: string;
  category: TaskCategory;
  priority: TaskPriority;
  summaryHebrew?: string;
  aiGenerated?: boolean;
}

const HEBREW_NUMBER_WORDS: Record<string, number> = {
  'אחת': 1, 'אחד': 1,
  'שתיים': 2, 'שתים': 2, 'שניים': 2, 'שנים': 2,
  'שלוש': 3, 'שלושה': 3,
  'ארבע': 4, 'ארבעה': 4,
  'חמש': 5, 'חמישה': 5,
  'שש': 6, 'שישה': 6,
  'שבע': 7, 'שבעה': 7,
  'שמונה': 8,
  'תשע': 9, 'תשעה': 9,
  'עשר': 10, 'עשרה': 10,
  'אחת עשרה': 11, 'אחד עשר': 11,
  'שתים עשרה': 12, 'שתיים עשרה': 12, 'שנים עשר': 12,
};

/**
 * Phonetic & speech-to-text normalizer for Hebrew speech commands
 */
export function normalizeHebrewSTT(raw: string): string {
  let text = raw.trim();

  // Normalize common speech-recognition phonetic mistakes
  text = text
    .replace(/(?:^|\s)בשיה(?:\s|$)/g, ' בשעה ')
    .replace(/(?:^|\s)בשאה(?:\s|$)/g, ' בשעה ')
    .replace(/(?:^|\s)בשה(?:\s|$)/g, ' בשעה ')
    .replace(/(?:^|\s)בשייאה(?:\s|$)/g, ' בשעה ')
    .replace(/(?:^|\s)אחהצ(?:\s|$)/g, ' אחה"צ ')
    .replace(/(?:^|\s)בצהרים(?:\s|$)/g, ' בצהריים ')
    .replace(/(?:^|\s)בבקר(?:\s|$)/g, ' בבוקר ');

  return text;
}

/**
 * Advanced local Hebrew task parser (works offline or when API is unavailable)
/**
 * Helper to guarantee 24-hour time format based on Hebrew context (e.g., "3 בצהריים" -> "15:00")
 */
export function ensure24HourTime(timeStr: string | undefined, originalPrompt: string): string {
  if (!timeStr) return '10:00';
  const match = timeStr.match(/^([0-2]?[0-9]):([0-5][0-9])$/);
  if (!match) return timeStr;

  let h = parseInt(match[1], 10);
  const m = match[2];
  const promptLower = originalPrompt.toLowerCase();

  const isAfternoon = /בצהריים|בצהרים|אחר הצהריים|אחה"?צ/.test(promptLower);
  const isEvening = /בערב|בלילה/.test(promptLower);
  const isMorning = /בבוקר|בבקר|לפנות בוקר/.test(promptLower);

  // If text mentions afternoon (e.g. "3 בצהריים", "3:00 בצהריים", "ב-3 בצהריים")
  if (isAfternoon) {
    if (h >= 1 && h <= 11) {
      h += 12; // 1 -> 13, 2 -> 14, 3 -> 15, 4 -> 16, 5 -> 17, 6 -> 18, etc.
    }
  } else if (isEvening) {
    if (h >= 1 && h <= 11) {
      h += 12; // 5 -> 17, 7 -> 19, 8 -> 20, 11 -> 23
    } else if (h === 12 && /בלילה|חצות/.test(promptLower)) {
      h = 0; // 12 בלילה = 00:00
    }
  } else if (isMorning && h === 12) {
    h = 0;
  }

  return `${h.toString().padStart(2, '0')}:${m}`;
}

/**
 * Advanced local Hebrew task parser (works offline or when API is unavailable)
 */
export function parseTaskLocally(prompt: string, referenceDateStr = getTodayDateStr()): ParsedTaskResult {
  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const refDate = new Date(y, m - 1, d);
  let targetDate = new Date(refDate);

  let text = normalizeHebrewSTT(prompt);

  // 1. Strip command verbs prefixes (e.g., "מתאם לפגישה", "מתאם ל", "תתאם לי", "תקבע לי", "תרשום לי")
  const commandPrefixes = [
    'מתאם לפגישה', 'מתאם לי', 'מתאם לע', 'מתאמת לי', 'מתאמת לע', 'מתאם ל', 'מתאמת ל', 'מתאם', 'מתאמת', 'מתאמים',
    'קובע לפגישה', 'קובע לי', 'קובעת לי', 'קובע ל', 'קובעת ל', 'קובע', 'קובעת',
    'רושם לי', 'רושמת לי', 'רושם', 'רושמת',
    'תתאם לי', 'תתאם לע', 'תתאמי לי', 'תתאמי לע', 'לתאם לי', 'לתאם', 'תתאם', 'תתאמי',
    'תקבע לי', 'תקבע לע', 'תקבעי לי', 'תקבעי לע', 'לקבוע לי', 'לקבוע', 'תקבע', 'תקבעי',
    'תרשום לי', 'תרשום לע', 'תרשמי לי', 'תרשמי לע', 'לרשום לי', 'לרשום', 'תרשום', 'תרשמי',
    'תזכיר לי', 'תזכירי לי', 'להזכיר לי', 'להזכיר', 'תזכיר', 'תזכירי',
    'תוסיף לי', 'תוסיפי לי', 'להוסיף לי', 'להוסיף', 'תוסיף', 'תוסיפי',
    'תכניס לי', 'תכניסי לי', 'להכניס לי', 'להכניס', 'תכניס', 'תכניסי',
    'תסדר לי', 'תסדרי לי', 'לסדר לי', 'לסדר', 'תסדר', 'תסדרי',
    'אני צריך', 'אני צריכה', 'צריך', 'צריכה', 'יש לי', 'נא לקבוע', 'נא לתאם', 'נא לרשום', 'נא להוסיף',
    'בבקשה'
  ];

  for (const prefix of commandPrefixes) {
    if (text.startsWith(prefix + ' ')) {
      text = text.substring(prefix.length + 1).trim();
      break;
    }
  }

  let remaining = text;
  let timeStr = '10:00';
  let category: TaskCategory = 'general';
  let priority: TaskPriority = 'medium';

  // 2. Time Extraction
  // Pattern A: Digital format e.g. "3:00 בצהריים", "בשעה 3:00 בצהריים", "17:00", "09:30", "ב-19:00"
  const digitalTimeMatch = remaining.match(
    /(?:ב-|ב|בשעה|לשעה)?\s*([0-2]?[0-9]):([0-5][0-9])\s*(בערב|בלילה|בבוקר|לפנות בוקר|אחה"?צ|אחר הצהריים|בצהריים)?/
  );
  if (digitalTimeMatch) {
    let h = parseInt(digitalTimeMatch[1], 10);
    const min = digitalTimeMatch[2];
    const period = digitalTimeMatch[3] || '';

    const hasAfternoonWord = period.includes('צהריים') || period.includes('אחה') || /(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ)(?:\s|$)/.test(remaining);
    const hasEveningWord = period.includes('ערב') || period.includes('לילה') || /(?:^|\s)(?:בערב|בלילה)(?:\s|$)/.test(remaining);

    if (hasAfternoonWord && h >= 1 && h <= 11) {
      h += 12; // 3 בצהריים -> 15:00
    } else if (hasEveningWord && h >= 1 && h <= 11) {
      h += 12; // 5 בערב -> 17:00
    } else if (hasEveningWord && h === 12 && /(?:^|\s)(?:בלילה|חצות)(?:\s|$)/.test(remaining)) {
      h = 0;
    }

    timeStr = `${h.toString().padStart(2, '0')}:${min}`;
    remaining = remaining.replace(digitalTimeMatch[0], ' ');
    remaining = remaining
      .replace(/(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ)(?:\s|$)/g, ' ')
      .replace(/(?:^|\s)(?:בערב|בלילה|בבוקר|לפנות בוקר)(?:\s|$)/g, ' ');
  } else {
    // Pattern B: Digits + period e.g. "בשעה 3 בצהריים", "ב-3 בצהריים", "3 בצהריים", "5 בערב", "בשעה 8 וחצי בבוקר"
    const digitPeriodMatch = remaining.match(
      /(?:ב-|ב|בשעה|לשעה|שעה)?\s*([1-9]|1[0-2])(?::00)?\s*(וחצי|ורבע)?\s*(בערב|בלילה|בבוקר|לפנות בוקר|אחה"?צ|אחר הצהריים|בצהריים)?/
    );
    if (digitPeriodMatch && (digitPeriodMatch[3] || digitPeriodMatch[0].includes('שעה') || digitPeriodMatch[0].includes('ב-') || /(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ|בערב|בלילה)(?:\s|$)/.test(remaining))) {
      let h = parseInt(digitPeriodMatch[1], 10);
      const min = digitPeriodMatch[2] === 'וחצי' ? '30' : digitPeriodMatch[2] === 'ורבע' ? '15' : '00';
      const period = digitPeriodMatch[3] || '';

      const hasAfternoonWord = period.includes('צהריים') || period.includes('אחה') || /(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ)(?:\s|$)/.test(remaining);
      const hasEveningWord = period.includes('ערב') || period.includes('לילה') || /(?:^|\s)(?:בערב|בלילה)(?:\s|$)/.test(remaining);

      if (hasAfternoonWord && h >= 1 && h <= 11) {
        h += 12; // 3 בצהריים -> 15:00
      } else if (hasEveningWord && h >= 1 && h <= 11) {
        h += 12; // 5 בערב -> 17:00
      } else if (hasEveningWord && h === 12) {
        h = 0;
      }
      timeStr = `${h.toString().padStart(2, '0')}:${min}`;
      remaining = remaining.replace(digitPeriodMatch[0], ' ');
      remaining = remaining
        .replace(/(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ)(?:\s|$)/g, ' ')
        .replace(/(?:^|\s)(?:בערב|בלילה|בבוקר|לפנות בוקר)(?:\s|$)/g, ' ');
    } else {
      // Pattern C: Hebrew word numbers e.g. "בשעה שלוש בצהריים", "שלוש בצהריים", "בשמונה בבוקר"
      for (const [word, val] of Object.entries(HEBREW_NUMBER_WORDS)) {
        const wordRegex = new RegExp(`(?:ב-|ב|בשעה|לשעה|שעה)?\\s*${word}\\s*(וחצי|ורבע)?\\s*(בערב|בלילה|בבוקר|לפנות בוקר|אחה"?צ|אחר הצהריים|בצהריים)?`);
        const match = remaining.match(wordRegex);
        if (match && (match[2] || match[0].includes('שעה') || match[0].includes('ב-') || /(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ|בערב|בלילה)(?:\s|$)/.test(remaining))) {
          let h = val;
          const min = match[1] === 'וחצי' ? '30' : match[1] === 'ורבע' ? '15' : '00';
          const period = match[2] || '';

          const hasAfternoonWord = period.includes('צהריים') || period.includes('אחה') || /(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ)(?:\s|$)/.test(remaining);
          const hasEveningWord = period.includes('ערב') || period.includes('לילה') || /(?:^|\s)(?:בערב|בלילה)(?:\s|$)/.test(remaining);

          if (hasAfternoonWord && h >= 1 && h <= 11) {
            h += 12;
          } else if (hasEveningWord && h >= 1 && h <= 11) {
            h += 12;
          } else if (hasEveningWord && h === 12) {
            h = 0;
          }
          timeStr = `${h.toString().padStart(2, '0')}:${min}`;
          remaining = remaining.replace(match[0], ' ');
          remaining = remaining
            .replace(/(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ)(?:\s|$)/g, ' ')
            .replace(/(?:^|\s)(?:בערב|בלילה|בבוקר|לפנות בוקר)(?:\s|$)/g, ' ');
          break;
        }
      }
    }
  }

  // 3. Date Extraction
  let relativeDatePhrase = 'היום';
  if (/(?:^|\s)(?:ל)?מחרתיים(?:\s|$)/.test(remaining)) {
    targetDate.setDate(targetDate.getDate() + 2);
    remaining = remaining.replace(/(?:^|\s)(?:ל)?מחרתיים(?:\s|$)/g, ' ');
    relativeDatePhrase = 'מחרתיים';
  } else if (/(?:^|\s)(?:ל|ב)?(?:מחר|מחרת)(?:\s|$)/.test(remaining)) {
    targetDate.setDate(targetDate.getDate() + 1);
    remaining = remaining.replace(/(?:^|\s)(?:ל|ב)?(?:מחר|מחרת)(?:\s|$)/g, ' ');
    relativeDatePhrase = 'מחר';
  } else if (/(?:^|\s)(?:ל|ב)?היום(?:\s|$)/.test(remaining)) {
    remaining = remaining.replace(/(?:^|\s)(?:ל|ב)?היום(?:\s|$)/g, ' ');
    relativeDatePhrase = 'היום';
  } else {
    // Days of week
    const daysMap: Record<string, number> = {
      'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6
    };
    for (const [dayName, dayIndex] of Object.entries(daysMap)) {
      const dayRegex = new RegExp(`(?:^|\\s)(?:ב|ל|ביום|ליום|יום)?\\s*${dayName}(?:\\s+(?:הבא|הבאה|הקרוב|הקרובה))?(?:\\s|$)`);
      if (dayRegex.test(remaining)) {
        const isNextWeek = remaining.includes('הבא') || remaining.includes('בשבוע הבא');
        const currentDayIndex = refDate.getDay();
        let daysAhead = (dayIndex - currentDayIndex + 7) % 7;
        if (daysAhead === 0 && isNextWeek) daysAhead = 7;
        else if (isNextWeek && daysAhead < 7) daysAhead += 7;
        targetDate.setDate(targetDate.getDate() + daysAhead);
        relativeDatePhrase = `יום ${dayName}`;
        remaining = remaining.replace(dayRegex, ' ');
        break;
      }
    }
  }

  // 4. Category & Priority Detection
  const promptLower = prompt.toLowerCase();
  if (/תור|רופא|דוקטור|ד"ר|דר\b|מרפאה|שיניים|בדיקה|בריאות|תרופה|כושר|ריצה|אימון|יוגה|הליכה|פילאטיס|מים/.test(promptLower)) {
    category = 'health';
  } else if (/פגישה|עבודה|משרד|בוס|לקוח|מצגת|דוח|זום|צוות|אימייל|חוזה/.test(promptLower)) {
    category = 'work';
  } else if (/לקנות|סופר|חלב|לחם|מצרכים|קניות|דואר|בנק|חבילה|תשלום|שטיפה|טסט|מוסך/.test(promptLower)) {
    category = 'errands';
  } else if (/ללמוד|שיעור|קורס|הרצאה|מבחן|תרגול|ספר|לקרוא|שיעורי בית/.test(promptLower)) {
    category = 'study';
  } else if (/חבר|משפחה|חוג|אופניים|ילד|ילדים|יום הולדת|בילוי|מסעדה|סרט|קפה|סופש|מתנה|טיול/.test(promptLower)) {
    category = 'personal';
  }

  if (/דחוף|חשוב מאוד|עדיפות עליונה|בהקדם|קריטי|אסור לשכוח/.test(promptLower)) {
    priority = 'high';
  } else if (/רגוע|מתישהו|כשיהיה זמן|עדיפות נמוכה|לא דחוף/.test(promptLower)) {
    priority = 'low';
  }

  // 5. Clean Title
  let cleanTitle = remaining
    // Condense "תור לרופא דוקטור אלון" -> "תור לדוקטור אלון"
    .replace(/(?:^|\s)תור\s+לרופא\s+(דוקטור|ד"ר|דר)(?:\s|$)/g, ' תור ל$1 ')
    .replace(/(?:^|\s)לרופא\s+(דוקטור|ד"ר|דר)(?:\s|$)/g, ' ל$1 ')
    .replace(/(?:בעדיפות\s+(?:גבוהה|נמוכה|רגילה|בינונית))/g, '')
    .replace(/(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ|בערב|בלילה|בבוקר)(?:\s|$)/g, ' ')
    .replace(/(?:^|\s)(?:בשעה|לשעה|ב-)\s*[0-2]?[0-9]:[0-5][0-9](?:\s|$)/g, ' ')
    .replace(/[\s\-–—:;,\.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip trailing connectors (e.g. "ב", "ל", "בשעה", "ב-")
  cleanTitle = cleanTitle.replace(/\s+(?:ב|ל|בשעה|ב-)$/, '').trim();

  // If title was stripped down to "לחוג אופניים לילד", simplify leading "ל-" if appropriate
  if (cleanTitle.startsWith('לחוג ')) {
    cleanTitle = cleanTitle.substring(1); // "חוג אופניים לילד"
  }

  if (!cleanTitle || cleanTitle.length < 2) {
    cleanTitle = prompt.trim();
  }

  const dayNamesHe = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const dayName = dayNamesHe[targetDate.getDay()];
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');

  const formattedDayStr = relativeDatePhrase === 'מחר'
    ? `מחר (יום ${dayName})`
    : relativeDatePhrase === 'היום'
    ? `היום (יום ${dayName})`
    : `יום ${dayName}`;

  return {
    title: cleanTitle,
    date: `${yyyy}-${mm}-${dd}`,
    time: timeStr,
    category,
    priority,
    summaryHebrew: `נקבעה משימה: "${cleanTitle}" ל-${formattedDayStr} בשעה ${timeStr}`,
    aiGenerated: false,
  };
}

/**
 * Send spoken/typed prompt to backend AI parser, with local heuristic fallback
 */
export async function parseTaskPrompt(
  prompt: string,
  referenceDate = getTodayDateStr(),
  userName?: string
): Promise<ParsedTaskResult> {
  const normalized = normalizeHebrewSTT(prompt);

  try {
    const res = await fetch('/api/parse-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: normalized, referenceDate, userName }),
    });

    if (res.ok) {
      const data = await res.json();
      const safeTime = ensure24HourTime(data.time || '10:00', normalized);
      return {
        title: data.title || normalized,
        date: data.date || referenceDate,
        time: safeTime,
        category: (data.category as TaskCategory) || 'general',
        priority: (data.priority as TaskPriority) || 'medium',
        summaryHebrew: data.summaryHebrew,
        aiGenerated: data.aiGenerated ?? true,
      };
    }
  } catch (err) {
    console.warn('Network call to /api/parse-task failed, using local parser:', err);
  }

  const local = parseTaskLocally(normalized, referenceDate);
  local.time = ensure24HourTime(local.time, normalized);
  if (userName && local.summaryHebrew) {
    local.summaryHebrew = `${local.summaryHebrew}, ${userName}! ✨`;
  }
  return local;
}
