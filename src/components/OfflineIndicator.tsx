import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-20 sm:bottom-4 start-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xl border border-amber-400/50 animate-bounce"
    >
      <WifiOff className="w-4 h-4 text-amber-200" />
      <span>מצב לא מקוון (אופליין) — הנתונים נשמרים במכשיר.</span>
    </div>
  );
};
