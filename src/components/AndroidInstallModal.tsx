import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isAndroid: boolean;
  onTriggerInstall: () => Promise<boolean>;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isAndroid,
  onTriggerInstall,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'apk'>('direct');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Generate QR code for the current app URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      QRCode.toDataURL(currentUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, []);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleNativeInstall = async () => {
    setInstalling(true);
    const success = await onTriggerInstall();
    setInstalling(false);
    if (success) {
      setInstallSuccess(true);
    }
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?url=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden my-auto"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with vibrant Android gradient */}
        <div className="relative bg-gradient-to-l from-emerald-500 via-teal-500 to-amber-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner text-2xl border border-white/30">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    התקנת DayPop באנדרואיד
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
                    Android WebAPK
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-50 font-medium mt-0.5">
                  התקנה מהירה וחלקה בטלפון או בטאבלט, ללא צורך בחנות אפליקציות
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors cursor-pointer"
              aria-label="סגור חלון"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 p-1 bg-black/15 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-white text-slate-800 shadow-sm font-black'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>התקנה ישירה מהירה (מומלץ)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('apk')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'apk'
                  ? 'bg-white text-slate-800 shadow-sm font-black'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>הורדת קבצי APK וחבילה</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {activeTab === 'direct' ? (
            <div className="space-y-5">
              {/* FAQ Box: Is it an APK file? */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <h4 className="font-black text-sm sm:text-base text-amber-950">
                    האם צריך להוריד קובץ APK?
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  <strong>לא חובה!</strong> DayPop בנויה בטכנולוגיית <strong>Android WebAPK</strong> המתקדמת של Google.
                  היא מותקנת <strong>ישירות דרך דפדפן Google Chrome</strong> בטלפון ללא צורך בהורדת קבצים לא מוכרים.
                </p>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-amber-900">
                    ⚠️ לא מצליח להתקין או לא מופיע כפתור?
                  </p>
                  <p>
                    1. <strong>אם פתחת את הקישור מ-WhatsApp או פייסבוק:</strong> הדפדפן הפנימי שלהם חוסם התקנות. לחץ על <strong>3 הנקודות (⋮)</strong> בפינה ובחר <strong>"פתח ב-Chrome"</strong>.
                  </p>
                  <p>
                    2. <strong>בדפדפן Chrome:</strong> לחץ על תפריט 3 הנקודות ובחר <strong>"התקן אפליקציה"</strong> (או <strong>"הוסף למסך הבית"</strong>).
                  </p>
                  <p className="pt-1 text-[11px] text-slate-500">
                    מעדיף בכל זאת קובץ APK קלאסי? עבור ללשונית למעלה: <strong>"הורדת קבצי APK וחבילה"</strong>.
                  </p>
                </div>
              </div>

              {/* If installed already */}
              {isInstalled || installSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base">
                      DayPop כבר מותקנת במכשיר שלך בהצלחה! 🎉
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      תוכל למצוא אותה במסך הבית ובמגירת האפליקציות של האנדרואיד שלך.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Install Button if browser supports beforeinstallprompt */}
              {isInstallable && !isInstalled && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border-2 border-emerald-300 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Sparkles className="w-5 h-5 animate-spin" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base">
                          המכשיר שלך מוכן להתקנה ישירה בלחיצה אחת!
                        </h4>
                        <p className="text-xs text-slate-600">
                          לחץ למטה והאפליקציה תתווסף מיד למסך הבית כמערכת עצמאית
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleNativeInstall}
                      disabled={installing}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4 stroke-[3]" />
                      <span>{installing ? 'מתקין...' : 'התקן עכשיו באנדרואיד'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code and Desktop-to-Mobile Guide */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* QR Code Display */}
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 shrink-0 text-center">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code להורדת אפליקציית DayPop באנדרואיד"
                        className="w-36 h-36 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-slate-400">
                        טוען קוד...
                      </div>
                    )}
                    <span className="block text-[11px] font-bold text-slate-500 mt-1.5">
                      סרוק במצלמת האנדרואיד
                    </span>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2 text-right">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>רוצה להתקין בטלפון שלך ברגע זה?</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      1. פתח את אפליקציית המצלמה בטלפון האנדרואיד וכוון אל קוד ה-QR.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      2. לחץ על הקישור שמופיע לפתיחה בדפדפן כרום (Google Chrome).
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      3. לחץ על כפתור <strong>"התקן אפליקציה"</strong> או מתפריט 3 הנקודות בחר <strong>"הוסף למסך הבית"</strong>.
                    </p>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">הקישור הועתק! שלח לטלפון</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>העתק קישור לשליחה ב-WhatsApp</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Android Features Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 font-bold text-xs">
                    ⚡
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">הפעלה מיידית</h5>
                    <p className="text-[11px] text-slate-500">אייקון במסך הבית ללא סרגל דפדפן</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-200/80 text-emerald-900 flex items-center justify-center shrink-0 font-bold text-xs">
                    🛡️
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">תמיכה באופליין</h5>
                    <p className="text-[11px] text-slate-500">המשימות נשמרות ונגישות ללא אינטרנט</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-200/80 text-rose-900 flex items-center justify-center shrink-0 font-bold text-xs">
                    🎙️
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">עוזר קולי AI</h5>
                    <p className="text-[11px] text-slate-500">גישה ישירה למיקרופון לפקודות קוליות</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* APK & Developer Package Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      חבילת קבצי התקנה מלאה לאנדרואיד (Android Package)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      החבילה כוללת קובץ <strong>AndroidManifest.xml</strong> מוגדר, קובץ <strong>twa-manifest.json</strong>,
                      אייקונים ברזולוציות גבוהות (192x192, 512x512, Maskable) ומדריך הוראות בעברית.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <a
                    href="/api/download-android-package"
                    download="DayPop-Android-Package.zip"
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>הורד חבילת התקנה (DayPop-Android.zip)</span>
                  </a>
                  <a
                    href="/android/README-HEBREW.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>צפה במדריך</span>
                  </a>
                </div>
              </div>

              {/* PWABuilder 1-Click APK Generator */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-slate-800 text-xs sm:text-sm">
                    <span className="text-base">📦</span>
                    <span>בניית קובץ APK חתום בלחיצה אחת דרך PWABuilder</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">
                    חינמי & רשמי של Microsoft
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  PWABuilder קורא את ה-Manifest של DayPop ומפיק עבורך קובץ APK / AAB מוכן ישירות להתקנה בכל מכשיר (Sideload) או להעלאה ל-Google Play Store.
                </p>
                <div className="pt-1">
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span>פתח מחולל APK ב-PWABuilder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Bubblewrap CLI instructions */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 font-sans font-bold pb-1 border-b border-slate-800">
                  <span>בניית APK בטרמינל (Google Bubblewrap CLI)</span>
                  <span className="text-[11px] text-amber-400">Google Official</span>
                </div>
                <p className="text-[11px] font-sans text-slate-300">
                  אם יש לך סביבת פיתוח עם Android SDK, הרץ:
                </p>
                <div className="bg-slate-950 p-2.5 rounded-lg text-emerald-400 text-left select-all overflow-x-auto" dir="ltr">
                  <code>npx @bubblewrap/cli build</code>
                </div>
                <p className="text-[10px] font-sans text-slate-400">
                  הפקודה תיקח את קובץ ה-twa-manifest.json ותפיק קובץ app-release-signed.apk מוכן להתקנה.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>מותאם לכל גרסאות Android (כולל 12, 13, 14, 15)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
