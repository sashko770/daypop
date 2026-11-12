import { useState, useEffect, useRef, useCallback } from 'react';
import { playMicStartSound } from '../utils/sound';

interface UseVoiceRecognitionOptions {
  onFinalResult?: (transcript: string) => void;
  lang?: string;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const { onFinalResult, lang = 'he-IL' } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalResultRef = useRef(onFinalResult);
  onFinalResultRef.current = onFinalResult;

  const accumulatedTextRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDispatchedRef = useRef(false);

  // Initialize SpeechRecognition once per lang
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      setIsSupported(true);
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          hasDispatchedRef.current = false;
          playMicStartSound();
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let currentFinal = '';
          let currentInterim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              currentFinal += item[0].transcript + ' ';
            } else {
              currentInterim += item[0].transcript;
            }
          }

          const trimmedFinal = currentFinal.trim();
          if (trimmedFinal) {
            accumulatedTextRef.current = trimmedFinal;
            setTranscript(trimmedFinal);
          }
          setInterimTranscript(currentInterim);

          const totalSpoken = (trimmedFinal || currentInterim || accumulatedTextRef.current).trim();
          if (totalSpoken) {
            accumulatedTextRef.current = totalSpoken;
          }

          // Clear previous silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Automatic decode after brief silence (1.2s) without pressing any button
          if (totalSpoken.length >= 4 && !hasDispatchedRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              const textToSend = accumulatedTextRef.current.trim() || totalSpoken;
              if (textToSend.length >= 3 && !hasDispatchedRef.current) {
                hasDispatchedRef.current = true;
                onFinalResultRef.current?.(textToSend);
                try {
                  recognition.stop();
                } catch {
                  // ignore
                }
              }
            }, 1200);
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition notice/error:', event.error);
          if (event.error === 'not-allowed') {
            setError('גישת המיקרופון חסומה. אנא אשר גישה למיקרופון בהגדרות הדפדפן.');
            setIsListening(false);
          } else if (event.error === 'no-speech') {
            // no-speech is common during pauses, ignore or report gently
          } else if (event.error === 'aborted') {
            setIsListening(false);
          } else {
            setError(`שים לב: ${event.error}`);
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          // If browser ended recognition after silence and text was accumulated, auto-submit!
          const textToSend = accumulatedTextRef.current.trim();
          if (textToSend.length >= 3 && !hasDispatchedRef.current) {
            hasDispatchedRef.current = true;
            onFinalResultRef.current?.(textToSend);
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Failed to initialize SpeechRecognition:', err);
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    accumulatedTextRef.current = '';
    hasDispatchedRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch {
              // ignore
            }
          }, 150);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);

    // If text was accumulated, trigger final result if not already sent
    const finalText = accumulatedTextRef.current.trim();
    if (finalText && !hasDispatchedRef.current && onFinalResultRef.current) {
      hasDispatchedRef.current = true;
      onFinalResultRef.current(finalText);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedTextRef.current = '';
    hasDispatchedRef.current = false;
    setError(null);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
