import React, { useEffect, useState } from 'react';
import { useLoadingContext } from '../context/LoadingContext';

export const TopLoadingBar = () => {
    const { globalLoading } = useLoadingContext();
    const [width, setWidth] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let timer;
        let fadeTimer;

        if (globalLoading) {
            setVisible(true);
            setWidth(10);
            
            timer = setInterval(() => {
                setWidth((prev) => {
                    if (prev >= 90) {
                        clearInterval(timer);
                        return 90;
                    }
                    const increment = Math.max(1, Math.floor((100 - prev) / 10));
                    return prev + increment;
                });
            }, 150);
        } else {
            setWidth(100);
            fadeTimer = setTimeout(() => {
                setVisible(false);
                setWidth(0);
            }, 300);
        }

        return () => {
            if (timer) clearInterval(timer);
            if (fadeTimer) clearTimeout(fadeTimer);
        };
    }, [globalLoading]);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-[3px] bg-neutral-100/30 z-[9999] pointer-events-none">
            <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 shadow-[0_0_8px_rgba(37,99,235,0.8)] transition-all duration-300 ease-out"
                style={{ width: `${width}%` }}
            />
        </div>
    );
};

export default TopLoadingBar;
