import React from 'react';

export const Skeleton = ({ className = '', width, height, circle = false }) => {
    const styles = {};
    if (width) styles.width = width;
    if (height) styles.height = height;

    return (
        <div
            className={`animate-shimmer bg-slate-200/50 ${
                circle ? 'rounded-full' : 'rounded-lg'
            } ${className}`}
            style={styles}
        />
    );
};

export const CardSkeleton = () => {
    return (
        <div className="card p-5 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton width="40%" height="14px" />
                <Skeleton width="32px" height="32px" className="rounded-full" />
            </div>
            <div className="space-y-2 mt-2">
                <Skeleton width="60%" height="20px" />
                <Skeleton width="80%" height="12px" />
            </div>
        </div>
    );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
    return (
        <div className="w-full space-y-4">
            <div className="flex gap-4 border-b border-slate-200 pb-3">
                {[...Array(cols)].map((_, i) => (
                    <Skeleton key={i} className="flex-grow" height="16px" />
                ))}
            </div>
            {[...Array(rows)].map((_, r) => (
                <div key={r} className="flex gap-4 items-center py-3 border-b border-slate-100">
                    {[...Array(cols)].map((_, c) => (
                        <Skeleton key={c} className="flex-grow" height="12px" />
                    ))}
                </div>
            ))}
        </div>
    );
};

export const FormSkeleton = ({ fields = 4 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            {[...Array(fields)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton width="30%" height="12px" />
                    <Skeleton width="100%" height="42px" className="rounded-md" />
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
