/// <reference types="vite-plugin-pwa/react" />
import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X, Sparkles } from 'lucide-react';

const PwaManager: React.FC = () => {
    // ─── PWA Update Lifecycle ───
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisterError(error) {
            console.error('PWA service worker registration error:', error);
        }
    });

    // ─── Custom PWA Install Banner ───
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show banner if not already installed
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Hide banner if app is installed successfully
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setShowInstallBanner(false);
            console.log('JCER PWA was installed successfully');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA installation prompt outcome: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    const closeInstallBanner = () => {
        setShowInstallBanner(false);
    };

    return (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-[9999] flex flex-col gap-3 font-sans">
            
            {/* 1. App Update Banner */}
            {needRefresh && (
                <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 p-4 md:p-5 flex flex-col gap-3.5 animate-slide-in backdrop-blur-md bg-opacity-95">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                            <div className="size-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                <RefreshCw className="size-5 animate-spin" />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-bold tracking-tight">New version available</h4>
                                <p className="text-[11px] text-slate-400 leading-normal">JCER Admission Portal has been updated. Refresh now to experience the latest features.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setNeedRefresh(false)}
                            className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800 rounded transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button 
                            onClick={() => setNeedRefresh(false)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                            Later
                        </button>
                        <button 
                            onClick={() => updateServiceWorker(true)}
                            className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-md shadow-primary-600/20 hover:shadow-lg transition-all flex items-center gap-1.5"
                        >
                            Refresh App
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Offline Ready Banner */}
            {offlineReady && (
                <div className="bg-emerald-950/95 text-emerald-100 rounded-xl shadow-2xl border border-emerald-800/30 p-4 flex items-center justify-between gap-4 animate-slide-in backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-emerald-800/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <Sparkles className="size-4" />
                        </div>
                        <p className="text-xs font-bold tracking-tight">Portal is ready to use offline.</p>
                    </div>
                    <button 
                        onClick={() => setOfflineReady(false)}
                        className="text-emerald-500 hover:text-emerald-300 p-1 hover:bg-emerald-800/20 rounded transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* 3. Custom Install Prompt Banner */}
            {showInstallBanner && (
                <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl shadow-deep border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 animate-slide-in">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                            <div className="size-11 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-950">
                                <img src="/logo.png" alt="JCER Logo" className="size-9 object-contain" />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-extrabold tracking-tight">Install JCER Admission</h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Add the admission app to your home screen for instant access, native layouts, and full offline capabilities.</p>
                            </div>
                        </div>
                        <button 
                            onClick={closeInstallBanner}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button 
                            onClick={closeInstallBanner}
                            className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Later
                        </button>
                        <button 
                            onClick={handleInstallClick}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-md shadow-primary-600/20 hover:shadow-lg transition-all flex items-center gap-1.5"
                        >
                            <Download size={14} />
                            Install App
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PwaManager;
