"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-3 px-4 z-[10000] flex items-center justify-center gap-2 shadow-lg">
      <WifiOff size={18} />
      <span className="font-medium">
        You&apos;re offline. Some features may be limited.
      </span>
    </div>
  );
}
