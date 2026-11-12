import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());

// GET /api/download-android-package: Serves the prepared Android ZIP bundle
app.get('/api/download-android-package', (_req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'public', 'android', 'daypop-android-package.zip');
  res.download(zipPath, 'DayPop-Android-Package.zip', (err) => {
    if (err) {
      console.error('Failed to download Android package:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download Android package' });
      }
    }
  });
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

function normalizeHebrewSTT(raw: string): string {
  let text = raw.trim();
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

// Helper to guarantee 24-hour time format based on Hebrew context (e.g., "3 בצהריים" -> "15:00")
function ensure24HourTime(timeStr: string | undefined, originalPrompt: string): string {
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

// Fallback heuristic parser in Hebrew for offline/missing key reliability
function parseTaskHeuristic(prompt: string, referenceDateStr?: string) {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
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
  let targetDate = new Date(refDate);
  let timeStr = '10:00';
  let category: 'work' | 'personal' | 'health' | 'errands' | 'study' | 'general' = 'general';
  let priority: 'low' | 'medium' | 'high' = 'medium';

  // 2. Time extraction
  // Pattern A: Digital time with optional period e.g. "3:00 בצהריים", "בשעה 3:00 בצהריים", "ב-15:00", "3:00"
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
      h += 12; // e.g. 3 -> 15 (3 בצהריים = 15:00)
    } else if (hasEveningWord && h >= 1 && h <= 11) {
      h += 12; // e.g. 5 -> 17 (5 בערב = 17:00)
    } else if (hasEveningWord && h === 12 && /(?:^|\s)(?:בלילה|חצות)(?:\s|$)/.test(remaining)) {
      h = 0;
    }

    timeStr = `${h.toString().padStart(2, '0')}:${min}`;
    remaining = remaining.replace(digitalTimeMatch[0], ' ');
    // Clean any separate period words so they don't pollute the task title
    remaining = remaining
      .replace(/(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ)(?:\s|$)/g, ' ')
      .replace(/(?:^|\s)(?:בערב|בלילה|בבוקר|לפנות בוקר)(?:\s|$)/g, ' ');
  } else {
    // Pattern B: Digits + period e.g. "בשעה 3 בצהריים", "ב-3 בצהריים", "3 בצהריים", "5 בערב", "8 וחצי בבוקר"
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
      // Pattern C: Hebrew word numbers e.g. "בשעה שלוש בצהריים", "שלוש בצהריים", "חמש בערב"
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

  // 3. Date extraction
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

  // 4. Category & Priority
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

  // 5. Clean task title
  let cleanTitle = remaining
    // "תור לרופא דוקטור אלון" -> "תור לדוקטור אלון"
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
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  const formattedDayStr = relativeDatePhrase === 'מחר'
    ? `מחר (יום ${dayName})`
    : relativeDatePhrase === 'היום'
    ? `היום (יום ${dayName})`
    : `יום ${dayName}`;

  return {
    title: cleanTitle,
    date: formattedDate,
    time: timeStr,
    category,
    priority,
    confidence: 'heuristic',
    dayName: `יום ${dayName}`,
    summaryHebrew: `נקבעה משימה: "${cleanTitle}" ל-${formattedDayStr} בשעה ${timeStr}`,
  };
}

// POST /api/parse-task: Parses spoken or written Hebrew input into structured task JSON
app.post('/api/parse-task', async (req: Request, res: Response) => {
  const { prompt, referenceDate, userName } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const todayStr = referenceDate || new Date().toISOString().split('T')[0];
  const todayObj = new Date(todayStr);
  const dayNamesHe = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const currentDayName = dayNamesHe[todayObj.getDay()];

  const rawKey = process.env.GEMINI_API_KEY?.trim() || '';
  const isValidKey = Boolean(
    rawKey &&
    rawKey !== 'MY_GEMINI_API_KEY' &&
    rawKey.length > 5
  );

  // If no valid Gemini API key, use rich heuristic immediately
  if (!isValidKey) {
    const parsed = parseTaskHeuristic(prompt, todayStr);
    parsed.time = ensure24HourTime(parsed.time, prompt);
    const summary = userName
      ? `${parsed.summaryHebrew}, ${userName}! ✨`
      : `${parsed.summaryHebrew} ✨`;

    return res.json({
      ...parsed,
      summaryHebrew: summary,
      aiGenerated: false,
      note: 'Parsed via local smart engine',
    });
  }

  try {
    const systemPrompt = `You are an expert natural language task scheduler for a vibrant Hebrew task planner app called DayPop.
Current reference date is ${todayStr} (Day of week: יום ${currentDayName}).
${userName ? `The user's name is "${userName}". Address them personally with warm, friendly tone in "summaryHebrew".` : ''}
Analyze the user's task input in Hebrew and extract structured task attributes.
The input may contain speech recognition transcription typos (e.g. "בשיה" -> "בשעה", "תתאם לע" -> "תתאם לי", or "3:00 בצהריים" for 3 PM).

CRITICAL RULES:
1. "time": MUST BE A 24-HOUR HH:mm STRING.
   - HEBREW TIME CONVERSIONS:
     * "3 בצהריים" OR "3:00 בצהריים" OR "שלוש בצהריים" IS STRICTLY "15:00" (NOT "03:00"!)
     * ALL "בצהריים" / "אחר הצהריים" / "אחה\"צ" times (1 through 11) ARE PM (+12 hours):
       - 1 בצהריים -> 13:00
       - 2 בצהריים -> 14:00
       - 3 בצהריים / 3:00 בצהריים -> 15:00
       - 4 בצהריים -> 16:00
       - 5 בצהריים -> 17:00
       - 6 בצהריים -> 18:00
       - 12 בצהריים -> 12:00
     * ALL "בערב" / "בלילה" times (1 through 11) ARE PM (+12 hours):
       - 5 בערב -> 17:00
       - 7 בערב -> 19:00
       - 8 בערב -> 20:00
       - 9 בערב -> 21:00
       - 11 בלילה -> 23:00
       - 12 בלילה / חצות -> 00:00
     * "בבוקר": 08:00, 09:30, 10:00, etc.
     * Default to "10:00" ONLY if no time whatsoever is mentioned in the prompt.
2. "title": A clean, concise task description in Hebrew without command verbs (e.g. "תתאם לי", "תקבע לי", "מתאם ל", "מתאם לפגישה", "תוסיף לי") and WITHOUT the extracted date/time or period words ("בצהריים", "בערב", "למחר", "היום").
   - Example: "מתאם לפגישה למחר בשעה 3:00 בצהריים לחוג אופניים לילד" -> title: "פגישה לחוג אופניים לילד", time: "15:00".
   - Example: "תתאם לע תור לרופא דוקטור אלון למחר בשיה 5 בערב" -> title: "תור לדוקטור אלון", time: "17:00".
3. "date": In YYYY-MM-DD format based on reference date (${todayStr}). "למחר" -> tomorrow. "מחרתיים" -> in 2 days. "היום" -> today.
4. "category": 'work' | 'personal' | 'health' | 'errands' | 'study' | 'general'. (Kids activities / חוגים -> 'personal').
5. "priority": 'low' | 'medium' | 'high'.
6. "summaryHebrew": A joyful Hebrew confirmation message e.g. "נקבעה פגישה לחוג אופניים לילד למחר (יום...) בשעה 15:00 ${userName ? `, ${userName}` : ''}! 🎉".`;

    const aiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Clean task title in Hebrew' },
            date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
            time: { type: Type.STRING, description: 'Time in HH:mm 24-hour format (e.g. 15:00 for 3 in afternoon)' },
            category: {
              type: Type.STRING,
              description: 'Task category',
              enum: ['work', 'personal', 'health', 'errands', 'study', 'general'],
            },
            priority: {
              type: Type.STRING,
              description: 'Task priority',
              enum: ['low', 'medium', 'high'],
            },
            summaryHebrew: {
              type: Type.STRING,
              description: 'Cheerful Hebrew confirmation message with relative day and time',
            },
          },
          required: ['title', 'date', 'time', 'category', 'priority'],
        },
      },
    });

    let timerId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => reject(new Error('Gemini API call timed out')), 15000);
    });

    let response: { text?: string };
    try {
      response = (await Promise.race([aiCall, timeoutPromise])) as { text?: string };
    } finally {
      if (timerId) clearTimeout(timerId);
    }

    const text = response.text ? response.text.trim() : '';
    if (text) {
      const cleanJson = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      // Guarantee 24-hour conversion even if model slipped
      const safeTime = ensure24HourTime(parsed.time || '10:00', prompt);
      let cleanTitle = parsed.title || prompt;
      cleanTitle = cleanTitle
        .replace(/(?:^|\s)(?:בשעה\s*)?[0-2]?[0-9]:[0-5][0-9](?:\s|$)/g, ' ')
        .replace(/(?:^|\s)(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ|בערב|בלילה)(?:\s|$)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return res.json({
        ...parsed,
        title: cleanTitle || parsed.title,
        time: safeTime,
        aiGenerated: true,
      });
    }

    // Fallback if empty response
    const fallback = parseTaskHeuristic(prompt, todayStr);
    fallback.time = ensure24HourTime(fallback.time, prompt);
    const summary = userName
      ? `${fallback.summaryHebrew}, ${userName}! ✨`
      : `${fallback.summaryHebrew} ✨`;
    return res.json({ ...fallback, summaryHebrew: summary, aiGenerated: false });
  } catch (error) {
    console.warn('Notice in /api/parse-task with Gemini, falling back to heuristic:', error instanceof Error ? error.message : error);
    const fallback = parseTaskHeuristic(prompt, todayStr);
    fallback.time = ensure24HourTime(fallback.time, prompt);
    const summary = userName
      ? `${fallback.summaryHebrew}, ${userName}! ✨`
      : `${fallback.summaryHebrew} ✨`;
    return res.json({
      ...fallback,
      summaryHebrew: summary,
      aiGenerated: false,
      note: 'Parsed via local smart engine',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Serve index.html through Vite transform
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs/promises');
        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DayPop server running on port ${PORT} (isProd: ${isProd})`);
  });
}

startServer();
