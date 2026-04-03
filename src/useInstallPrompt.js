import { useState, useEffect } from 'react';

/**
 * useInstallPrompt
 * 
 * Captures the browser's `beforeinstallprompt` event so we can:
 *   1. Suppress the default browser mini-infobar
 *   2. Show our own branded install banner at the right moment
 *   3. Track whether the app is already installed
 * 
 * Returns:
 *   canInstall      — true when the prompt is ready to fire
 *   isInstalled     — true when running as a standalone PWA
 *   isIOS           — true on iOS (needs manual Add to Home Screen instructions)
 *   promptInstall   — call this to trigger the native install dialog
 *   dismissInstall  — call this to hide the banner (persists for 7 days)
 *   showBanner      — whether to render the install banner
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall]         = useState(false);
  const [isInstalled, setIsInstalled]       = useState(false);
  const [showBanner, setShowBanner]         = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
                !window.navigator.standalone;

  useEffect(() => {
    // Already running as installed PWA?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // Has the user already dismissed within the last 7 days?
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Capture the browser's install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);

      // Show banner after a short delay so it doesn't feel intrusive on load
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Watch for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    });

    // iOS: show instructions banner after delay (no prompt event on Safari)
    if (isIOS) {
      const dismissedAt = localStorage.getItem('pwa-install-dismissed');
      if (!dismissedAt) {
        setTimeout(() => setShowBanner(true), 4000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  const dismissInstall = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return {
    canInstall,
    isInstalled,
    isIOS,
    promptInstall,
    dismissInstall,
    showBanner,
  };
}
