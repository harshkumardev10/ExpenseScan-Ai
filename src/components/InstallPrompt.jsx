import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, X, Share, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState('android'); // 'android', 'ios', 'desktop'

  useEffect(() => {
    // 1. Detect if the app is already running in standalone mode (already installed)
    const isStandalone = window.navigator.standalone === true || 
                         window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // 2. Check if the user previously dismissed the prompt
    const isDismissed = localStorage.getItem('expensescan_prompt_dismissed');
    if (isDismissed === 'true') return;

    // 3. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
      // For iOS, show the prompt after a brief 2-second delay to let the app load first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (!isMobile) {
      setPlatform('desktop');
    } else {
      setPlatform('android');
    }

    // 4. Listen for browser installation prompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to show the install button
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also trigger custom display if it's Chrome/Desktop where beforeinstallprompt might fire later
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Hide our custom install UI
    setIsVisible(false);
    
    // Show the browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't show again for 7 days
    localStorage.setItem('expensescan_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md z-[9999] animate-fade-in-up">
      <div className="glass-panel border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 rounded-2xl shadow-2xl flex flex-col gap-4 text-slate-100 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors p-1"
          aria-label="Dismiss prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Info Area */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-900/30 flex-shrink-0">
            ES
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              Install ExpenseScan
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Add ExpenseScan to your home screen for quick offline access, full-screen mode, and local OCR sheet scanning.
            </p>
          </div>
        </div>

        {/* Platform Specific Action Button */}
        {platform === 'ios' ? (
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-850 flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              iOS Installation Instructions
            </span>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-slate-800 font-bold">1</span>
              <span>Tap the share button <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> below in Safari.</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-slate-800 font-bold">2</span>
              <span>Scroll down and select <strong className="text-white inline-flex items-center gap-1 font-semibold">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 text-slate-300" /></strong>.</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 bg-slate-950 rounded-xl transition-all"
            >
              Not Now
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40"
            >
              {platform === 'desktop' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              Install App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
