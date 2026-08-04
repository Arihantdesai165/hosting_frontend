import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass, delay = 0 }) => {
    return (
        <div
            className="bg-white rounded-lg p-5 border border-slate-200 animate-fade-in hover:shadow-md transition-shadow"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-2xl font-semibold text-slate-900">{value}</h3>
                </div>
                <div className={`w-10 h-10 rounded-lg ${colorClass} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={colorClass.replace('bg-', 'text-')} size={20} />
                </div>
            </div>
        </div>
    );
};

export default StatCard;
