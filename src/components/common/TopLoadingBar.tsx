import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

/**
 * TopLoadingBar — renders a slim progress bar at the very top of the viewport
 * that animates while the Redux loading state is active.
 * Works without any router dependency; suitable for global placement in App.tsx.
 */
const TopLoadingBar: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read globalLoading flag from Redux ui slice
  const loading = useSelector((state: RootState) => state.ui.globalLoading);

  useEffect(() => {
    if (loading) {
      setVisible(true);
      setProgress(10);
      timer.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            if (timer.current) clearInterval(timer.current);
            return 85;
          }
          return prev + Math.random() * 12;
        });
      }, 350);
    } else {
      if (timer.current) clearInterval(timer.current);
      setProgress(100);
      const hide = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(hide);
    }

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [loading]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-indigo-500 transition-all duration-300 ease-out"
      style={{ width: `${progress}%`, boxShadow: '0 0 8px rgba(99,102,241,0.7)' }}
    />
  );
};

export default TopLoadingBar;
