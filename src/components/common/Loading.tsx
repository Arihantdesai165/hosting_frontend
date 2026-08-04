import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-12">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
        {/* Inner reverse spin ring */}
        <div className="absolute w-10 h-10 rounded-full border-4 border-indigo-400/10 border-b-indigo-400 animate-spin duration-700 reverse-spin"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-400 tracking-wide animate-pulse">
        Loading portal data...
      </p>
    </div>
  );
};

export default Loading;
