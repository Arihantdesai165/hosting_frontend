import React from 'react';

export interface SubjectAttendanceItem {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalClasses: number;
  classesPresent: number;
  classesAbsent: number;
  percentage: string;
}

interface AttendanceTableProps {
  subjects: SubjectAttendanceItem[];
  onSubjectClick?: (subjectId: string) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ subjects, onSubjectClick }) => {
  const getPercentageColor = (pctStr: string) => {
    const pct = parseFloat(pctStr);
    if (pct >= 85) return 'text-[#16A34A] bg-[#E8F5E9] dark:bg-emerald-950/30 dark:text-emerald-400';
    if (pct >= 75) return 'text-[#4F46E5] bg-[#E8E5FF] dark:bg-indigo-950/30 dark:text-indigo-400';
    return 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-450';
  };

  const getProgressBarColor = (pctStr: string) => {
    const pct = parseFloat(pctStr);
    if (pct >= 85) return 'from-emerald-400 to-emerald-500';
    if (pct >= 75) return 'from-indigo-400 to-indigo-500';
    return 'from-rose-400 to-rose-500';
  };

  return (
    <div className="w-full overflow-hidden rounded-[24px] glass-table-container shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4 text-center">Classes Attended</th>
              <th className="px-6 py-4">Attendance Progress</th>
              <th className="px-6 py-4 text-center">Percentage</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
            {subjects.map((item) => {
              const pct = parseFloat(item.percentage);
              return (
                <tr
                  key={item.subjectId}
                  className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all duration-150"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-neutral-900 dark:text-white tracking-tight">{item.subjectName}</p>
                    <p className="text-neutral-400 text-xs mt-0.5 font-medium">{item.subjectCode}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold">
                    <span className="text-neutral-900 dark:text-white">{item.classesPresent}</span>
                    <span className="text-neutral-400"> / {item.totalClasses}</span>
                  </td>
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${getProgressBarColor(item.percentage)}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${getPercentageColor(item.percentage)}`}>
                      {item.percentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSubjectClick?.(item.subjectId)}
                      className="text-[#1A1A1A] dark:text-white hover:underline font-bold text-xs transition-colors duration-150 cursor-pointer focus:outline-none"
                    >
                      View Logs
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
