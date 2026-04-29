'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (running as PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt event (Android Chrome)
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);

    // Check user agent for iOS
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
      setShowBanner(true); // Show iOS instructions banner
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner || isInstalled) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📱</span>
        <div className="flex-1">
          <p className="font-semibold text-primary-900 text-sm">
            {isIOS ? 'Installa KYKOS sulla schermata Home' : 'Installa KYKOS come app'}
          </p>
          {isIOS ? (
            <ol className="mt-2 text-xs text-primary-700 space-y-1">
              <li>1. Tocca il <strong>pulsante Condividi</strong> <span className="inline-flex items-center">(⬆️)</span></li>
              <li>2. Scorri e tocca <strong>"Aggiungi alla schermata Home"</strong></li>
              <li>3. Tocca <strong>"Aggiungi"</strong> in alto a destra</li>
            </ol>
          ) : (
            <p className="mt-2 text-xs text-primary-700">
              Installa KYKOS sulla schermata Home per un accesso rapido.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg font-medium hover:bg-primary-700"
            >
              Installa
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-primary-400 hover:text-primary-600 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}