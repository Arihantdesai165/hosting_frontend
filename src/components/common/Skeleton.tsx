import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  circle = false,
}) => (
  <div
    className={`animate-pulse bg-slate-200 dark:bg-slate-700 ${circle ? 'rounded-full' : 'rounded'} ${className}`}
    style={{ width: width ?? '100%', height: height ?? '16px' }}
  />
);

export const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3 shadow-sm">
    <div className="flex items-center justify-between">
      <Skeleton width="40%" height="14px" />
      <Skeleton width="32px" height="32px" circle />
    </div>
    <Skeleton width="60%" height="20px" />
    <Skeleton width="80%" height="12px" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="space-y-2">
    <div className="flex gap-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="flex-grow" height="16px" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-3">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="flex-grow" height="12px" />
        ))}
      </div>
    ))}
  </div>
);

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-1">
        <Skeleton width="30%" height="12px" />
        <Skeleton width="100%" height="42px" className="rounded-md" />
      </div>
    ))}
  </div>
);

export default Skeleton;
