"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone, Monitor, Tablet } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function checkIfInstalled() {
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const isAndroidApp = document.referrer.includes("android-app://");
  return isStandalone || isIOSStandalone || isAndroidApp;
}

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const installed = checkIfInstalled();

    if (installed) {
      setIsInstalled(true);
      setShowModal(false);
      return;
    }

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);

    const handler = (e: Event) => {
      if (checkIfInstalled()) {
        setIsInstalled(true);
        return;
      }
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => {
        if (!checkIfInstalled()) {
          setShowModal(true);
        }
      }, 1000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (iOS && !installed) {
      setTimeout(() => {
        if (!checkIfInstalled()) {
          setShowModal(true);
        }
      }, 2000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowModal(false);
      }
    }

    const checkInstalled = () => {
      if (checkIfInstalled()) {
        setIsInstalled(true);
        setShowModal(false);
      }
    };

    checkInstalled();
    const interval = setInterval(checkInstalled, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowModal(false);
      setInstallPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showModal) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300" />

      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
        <div
          className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md p-6 pointer-events-auto transform transition-all duration-300"
          style={{ boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)" }}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-[#FF9500] to-[#C2410C] p-4 rounded-2xl shadow-lg">
              <Download className="text-white" size={32} />
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Install Business Management
            </h3>
            <p className="text-gray-600 mb-4">
              Install the app for faster access, offline support, and a native
              app experience on your device.
            </p>

            <div className="space-y-2 mb-6 text-left">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone size={14} className="text-[#FF9500]" />
                </div>
                <span>Works offline for cached pages</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0">
                  <Monitor size={14} className="text-[#FF9500]" />
                </div>
                <span>Faster loading</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-6 h-6 rounded-full bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0">
                  <Tablet size={14} className="text-[#FF9500]" />
                </div>
                <span>App drawer shortcut on mobile</span>
              </div>
            </div>

            {isIOS && !installPrompt && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-blue-900 font-medium mb-2">iOS Installation:</p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Tap the Share button</li>
                  <li>Select &quot;Add to Home Screen&quot;</li>
                  <li>Tap &quot;Add&quot;</li>
                </ol>
              </div>
            )}

            {isAndroid && !installPrompt && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-orange-900 font-medium mb-2">Android Installation:</p>
                <p className="text-xs text-orange-800">
                  Tap the menu and select &quot;Install app&quot; or &quot;Add to Home screen&quot;
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {installPrompt && (
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-[#FF9500] to-[#C2410C] text-white font-medium py-3 px-6 rounded-xl hover:from-[#E68600] hover:to-[#9A3412] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Install Now
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
