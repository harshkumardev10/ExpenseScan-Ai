import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';

export default function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState('android'); // 'android', 'ios', 'desktop'
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // 1. Detect if the app is already running in standalone mode (already installed)
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // 2. Check if the user previously dismissed the prompt (session only — don't permanently block)
    const dismissedAt = localStorage.getItem('expensescan_prompt_dismissed_at');
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) return; // Wait 24 hours before showing again
    }

    // 3. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    } else if (!isMobile) {
      setPlatform('desktop');
    } else {
      setPlatform('android');
    }

    // 4. Listen for browser installation prompt (Android / Chrome / Edge desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Fallback: show the install UI after 3 seconds even if beforeinstallprompt hasn't fired yet
    //    (It may fire later on Chrome desktop — we'll still use it when available)
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      setIsVisible(false);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setInstalling(false);
    } else {
      // Guide the user to install manually via browser menu
      alert(
        'To install:\n• Chrome/Edge: Click the ⋮ menu → "Install ExpenseScan" or "Add to Home screen"\n• Other browsers: Use "Add to Home Screen" from the browser menu.'
      );
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('expensescan_prompt_dismissed_at', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[9999]"
      style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 24px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-black/60 p-5 flex flex-col gap-4 text-slate-100">
        {/* Gradient top accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 rounded-t-2xl" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {/* App info row */}
        <div className="flex items-center gap-3.5 pr-6">
          {/* App icon — same as favicon */}
          <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700/50 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden"
            style={{ width: 52, height: 52 }}>
            <img
              src="/favicon.svg"
              alt="ExpenseScan icon"
              className="w-8 h-8 object-contain"
              style={{ width: 34, height: 34 }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-white leading-tight">
              Install ExpenseScan
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Add to home screen for offline access & full-screen mode.
            </p>
          </div>
        </div>

        {/* Platform-specific CTA */}
        {platform === 'ios' ? (
          <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              iOS Installation Steps
            </span>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 font-bold text-slate-200 flex-shrink-0">1</span>
              <span>Tap <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> in Safari's toolbar.</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 font-bold text-slate-200 flex-shrink-0">2</span>
              <span>Tap <strong className="text-white font-semibold inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 text-slate-300" /></strong>.</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 bg-slate-950 hover:bg-slate-800 rounded-xl transition-all duration-200"
            >
              Not Now
            </button>
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 active:scale-95 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-950/40 disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {installing ? 'Installing…' : 'Install App'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
