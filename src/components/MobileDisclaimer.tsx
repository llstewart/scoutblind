'use client';

import { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';

const DISCLAIMER_STORAGE_KEY = 'scoutblind_mobile_disclaimer_dismissed';

export function MobileDisclaimer() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if previously dismissed
        const dismissed = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
        if (!dismissed) {
            // Small timeout to allow hydration to settle and ensuring it's actually mobile
            // (though md:hidden handles the display logic, this prevents it from being "open" in state unnecessary)
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4 md:hidden pointer-events-none flex justify-center pb-8 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-zinc-900/95 backdrop-blur-md border border-violet-500/30 shadow-2xl rounded-xl p-4 max-w-sm w-full pointer-events-auto relative overflow-hidden">
                {/* Decorative gradient blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl -mr-10 -mt-10" />

                <div className="relative flex items-start gap-4">
                    <div className="bg-violet-500/10 p-2 rounded-lg shrink-0">
                        <Monitor className="w-6 h-6 text-violet-400" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm mb-1">Desktop Recommended</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                            Scoutblind is optimized for larger screens. For the best analysis experience, we recommend using a desktop computer.
                        </p>

                        <button
                            onClick={handleDismiss}
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
                        >
                            Continue on Mobile
                        </button>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
