import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, Sparkles } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { parseTaskPrompt } from '../utils/taskApi';
import { Task } from '../types';
import { playTaskAddedSound } from '../utils/sound';
import { fireTaskConfetti } from '../utils/confetti';
import { formatHebrewRelativeDate } from '../utils/dateUtils';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  userName?: string;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onShowToast: (message: string, subtext?: string) => void;
}

const SAMPLE_VOICE_COMMANDS = [
  'מתאם לפגישה למחר בשעה 3:00 בצהריים לחוג אופניים לילד',
  'תקבע לי שיחה למחר ב-3 בצהריים',
  'תתאם לע תור לרופא דוקטור אלון למחר בשיה 5 בערב',
  'לקנות חלב ולחם מחר ב-09:30',
  'אימון כושר בפארק היום ב-18:30',
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  userName,
  onClose,
  onAddTask,
  onShowToast,
}) => {
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const handleFinalSpeech = async (spokenText: string) => {
    if (!spokenText.trim() || isSubmittingRef.current) return;
    processAndAddTask(spokenText);
  };

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    onFinalResult: handleFinalSpeech,
    lang: 'he-IL',
  });

  const currentDisplaySpeech = transcript || interimTranscript;

  // Auto-decode timer: when user pauses speech, automatically process without requiring any click
  useEffect(() => {
    if (!isOpen || !currentDisplaySpeech || currentDisplaySpeech.trim().length < 4 || isProcessing || isSubmittingRef.current) {
      return;
    }

    const autoTimer = setTimeout(() => {
      if (!isSubmittingRef.current && currentDisplaySpeech.trim().length >= 4) {
        processAndAddTask(currentDisplaySpeech);
      }
    }, 1300);

    return () => clearTimeout(autoTimer);
  }, [currentDisplaySpeech, isOpen, isProcessing]);

  useEffect(() => {
    if (isOpen) {
      isSubmittingRef.current = false;
      resetTranscript();
      setManualText('');
      setStatusMessage(null);
      if (isSupported) {
        startListening();
      }
    } else {
      isSubmittingRef.current = false;
      stopListening();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const processAndAddTask = async (inputText: string) => {
    const cleanText = inputText.trim();
    if (!cleanText || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsProcessing(true);
    setStatusMessage(userName ? `${userName}, אני מפענח ומוסיף את המשימה אוטומטית... ✨` : 'מפענח אוטומטית ומוסיף ללוח הזמנים... ✨');

    try {
      const parsed = await parseTaskPrompt(cleanText, undefined, userName);

      onAddTask({
        title: parsed.title,
        date: parsed.date,
        time: parsed.time,
        notes: `נוסף בקול: "${cleanText}"`,
      });

      playTaskAddedSound();
      fireTaskConfetti();

      const relativeDate = formatHebrewRelativeDate(parsed.date);
      const timeStr = parsed.time ? `בשעה ${parsed.time}` : '';
      const toastText = parsed.summaryHebrew || (userName ? `${userName}, קבעתי לך: ${parsed.title}` : `נוספה משימה: ${parsed.title}`);
      const sub = `נקבעה ל-${relativeDate} ${timeStr}`;

      onShowToast(toastText, sub);
      onClose();
    } catch (err) {
      console.error('Failed to process voice command:', err);
      setStatusMessage(userName ? `${userName}, אירעה תקלה קטנה, אנא נסה שוב` : 'אירעה שגיאה בניתוח, אנא נסה שוב');
      isSubmittingRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      processAndAddTask(manualText);
    }
  };

  // Detect afternoon 3 PM reference in real-time to show smart feedback badge
  const hasAfternoonTimeNotice = /(?:3|שלוש)(?::00)?\s*(?:בצהריים|בצהרים|אחר הצהריים|אחה"?צ)/.test(currentDisplaySpeech);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-amber-200 overflow-hidden max-h-[90vh] flex flex-col pb-[max(env(safe-area-inset-bottom),1rem)]">
        {/* Header Ribbon with Personal Greeting */}
        <div className="bg-gradient-to-r from-amber-400 via-rose-400 to-rose-500 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg">
              🎙️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {userName ? `היי ${userName}! העוזר הקולי לשירותך` : 'עוזר קולי חכם'}
              </h3>
              <p className="text-[11px] sm:text-xs text-white/90 font-medium">
                {userName ? `אמור לי מה תרצה לתזמן, ${userName}` : 'דבר בחופשיות והמשימה תתווסף מיד'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="סגור"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Pulsing Mic Visualizer */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <span className="absolute w-24 h-24 rounded-full bg-rose-400/30 animate-ping" />
                  <span
                    className="absolute w-32 h-32 rounded-full bg-amber-400/20 animate-pulse"
                    style={{ animationDuration: '1.5s' }}
                  />
                </>
              )}

              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                  isProcessing
                    ? 'bg-amber-400 animate-pulse'
                    : isListening
                    ? 'bg-gradient-to-tr from-rose-500 to-rose-600 scale-105 shadow-rose-300'
                    : 'bg-gradient-to-tr from-amber-400 via-rose-400 to-rose-500 shadow-amber-200 hover:scale-105'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-white" />
                ) : isListening ? (
                  <>
                    <Mic className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" style={{ animationDuration: '0.8s' }} />
                    <span className="text-[10px] sm:text-[11px] font-extrabold mt-1">מקשיב...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
                    <span className="text-[10px] sm:text-[11px] font-extrabold mt-1">לחץ לדיבור</span>
                  </>
                )}
              </button>
            </div>

            {/* Status text */}
            <div className="mt-3 text-center min-h-[26px]">
              {isProcessing ? (
                <div className="flex items-center justify-center gap-1.5 text-amber-700 font-bold text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                  <span>{statusMessage || 'מנתח ומוסיף...'}</span>
                </div>
              ) : isListening ? (
                <p className="text-xs sm:text-sm font-semibold text-rose-600 animate-pulse">
                  {userName ? `${userName}, אני מקשיב... אמור את המשימה` : 'דבר עכשיו (למשל: "תקבע לי פגישה ליום שלישי הבא ב-19:00")'}
                </p>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  {userName ? `לחץ על המיקרופון ואמור את המשימה, ${userName}` : 'לחץ על המיקרופון ואמור את המשימה'}
                </p>
              )}
            </div>
          </div>

          {/* Transcript Display Box */}
          <div className="space-y-2">
            <div className="relative bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 sm:p-4 min-h-[64px] flex flex-col items-center justify-center text-center transition-all">
              {currentDisplaySpeech ? (
                <>
                  <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                    "{currentDisplaySpeech}"
                  </p>

                  {/* Smart Pill for 3 in afternoon detection */}
                  {hasAfternoonTimeNotice && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 animate-in fade-in zoom-in duration-200">
                      <span>⏱️</span>
                      <span>3 בצהריים מזוהה כ-15:00</span>
                    </div>
                  )}

                  {/* Auto-decoding indicator bar */}
                  {!isProcessing && (
                    <div className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-100/70 py-1 px-2.5 rounded-lg border border-amber-200 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>מפענח ומוסיף אוטומטית ללא צורך בלחיצה...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 italic">
                    {userName ? `הקול שלך יופיע כאן, ${userName}, ויפוענח מיד אוטומטית...` : 'הקול שלך יופיע כאן ויפוענח אוטומטית ללא צורך בלחיצה...'}
                  </p>
                  <p className="text-[10px] text-amber-600/90 font-medium">
                    ⚡ כולל זיהוי חכם ש-3 בצהריים = 15:00
                  </p>
                </div>
              )}
            </div>

            {currentDisplaySpeech && !isProcessing && (
              <button
                type="button"
                onClick={() => processAndAddTask(currentDisplaySpeech)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>פענח עכשיו ⚡ (או המתן לפיענוח אוטומטי)</span>
              </button>
            )}
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="או הקלד: למשל תקבע לי פגישה לשלישי ב-19:00"
                className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs sm:text-sm bg-white"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!manualText.trim() || isProcessing}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
              >
                הוסף
              </button>
            </div>
          </form>

          {/* Error Message if any */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Sample quick suggestions */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>דוגמאות מהירות (לחץ להוספה מיידית):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_VOICE_COMMANDS.map((cmd, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => processAndAddTask(cmd)}
                  disabled={isProcessing}
                  className="text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 transition-colors text-right cursor-pointer"
                >
                  💬 {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
