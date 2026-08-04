import React, { useState, useEffect, useRef } from 'react';

export const LoadingContainer = ({ isLoading, skeleton, children, hintText }) => {
    const [showSkeleton, setShowSkeleton] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const timerSkeletonRef = useRef(null);
    const timerHintRef = useRef(null);

    useEffect(() => {
        if (isLoading) {
            timerSkeletonRef.current = setTimeout(() => {
                setShowSkeleton(true);
            }, 500);

            timerHintRef.current = setTimeout(() => {
                setShowHint(true);
            }, 3000);
        } else {
            if (timerSkeletonRef.current) clearTimeout(timerSkeletonRef.current);
            if (timerHintRef.current) clearTimeout(timerHintRef.current);
            setShowSkeleton(false);
            setShowHint(false);
        }

        return () => {
            if (timerSkeletonRef.current) clearTimeout(timerSkeletonRef.current);
            if (timerHintRef.current) clearTimeout(timerHintRef.current);
        };
    }, [isLoading]);

    if (!isLoading) {
        return <div className="animate-fade-in">{children}</div>;
    }

    if (!showSkeleton) {
        return <div className="min-h-[100px] w-full" />;
    }

    return (
        <div className="w-full space-y-4">
            <div className="animate-fade-in">{skeleton}</div>
            {showHint && hintText && (
                <div className="flex items-center justify-center space-x-2 py-2 text-xs font-semibold text-slate-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                    <p className="tracking-wide uppercase">{hintText}</p>
                </div>
            )}
        </div>
    );
};

export default LoadingContainer;
