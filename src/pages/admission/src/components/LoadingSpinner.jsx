import React from 'react';

const LoadingSpinner = ({ text = "Please wait..." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 gap-4 animate-fade-in">
            <div className="relative">
                <div className="h-10 w-10 rounded-full border-4 border-slate-100"></div>
                <div className="absolute top-0 left-0 h-10 w-10 rounded-full border-4 border-t-primary-600 animate-spin"></div>
            </div>
            <p className="text-xs font-medium text-slate-400">
                {text}
            </p>
        </div>
    );
};

export default LoadingSpinner;
