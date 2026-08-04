import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  textColor: string;
  status?: 'GOOD' | 'WARNING' | 'ERROR';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  textColor,
  status,
}) => {
  return (
    <div className={`${color} rounded-lg shadow-md p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold ${textColor} mt-2`}>{value}</p>
          {status && (
            <p className="text-xs mt-2">
              {status === 'GOOD' && '✅ On Track'}
              {status === 'WARNING' && '⚠️ Below 75%'}
              {status === 'ERROR' && '❌ Critical'}
            </p>
          )}
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
};

export default StatCard;