import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-5 right-5 z-50 animate-slide-in">
      <div
        className={`flex items-center space-x-3 px-5 py-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 ${
          isSuccess
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-950/80 text-rose-300 border-rose-500/30'
        }`}
      >
        <span className="text-xl">{isSuccess ? '✅' : '❌'}</span>
        <div className="text-sm font-medium tracking-wide">{message}</div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors duration-150 pl-2 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
