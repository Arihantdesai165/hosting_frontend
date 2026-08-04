import React from 'react';

interface ChartCardProps {
  title: string;
  content: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, content, className = '' }) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700/80 transition-all duration-300 ${className}`}>
      <h3 className="text-lg font-semibold tracking-tight text-white mb-6">
        {title}
      </h3>
      <div className="w-full">
        {content}
      </div>
    </div>
  );
};

export default ChartCard;
