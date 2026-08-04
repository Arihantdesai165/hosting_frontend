import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart as PieIcon, Download, Users, GraduationCap, Building2, Banknote, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import officeService from '../../../services/office.service';

interface AnalyticsData {
  kpis: {
    totalEnrollment: number;
    admissionSuccessRate: string;
    activeBranches: number;
    feeCollection: string;
  };
  deptDistribution: { name: string; value: number; color: string }[];
  admissionTrends: { month: string; applications: number }[];
}

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    officeService.getAnalyticsData()
      .then(res => {
        setData(res);
      })
      .catch(err => {
        console.error('Error loading analytics:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Enrollment', value: loading ? '...' : (data?.kpis?.totalEnrollment ?? 0), icon: <Users size={24}/>, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Admission Success', value: loading ? '...' : (data?.kpis?.admissionSuccessRate ?? '0%'), icon: <GraduationCap size={24}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Branches', value: loading ? '...' : (data?.kpis?.activeBranches ?? 0), icon: <Building2 size={24}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Fee Collection', value: loading ? '...' : (data?.kpis?.feeCollection ?? '₹0'), icon: <Banknote size={24}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Analytics & Reports</h2>
          <p className="text-sm text-neutral-500">Comprehensive system metrics and downloadable reports.</p>
        </div>
        
        <button className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer">
          <Download size={16} /> Export Full Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel rounded-2xl p-6 shadow-ambient border border-neutral-200/50 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-end gap-2 mt-1">
                <h4 className="text-2xl font-extrabold text-neutral-900 dark:text-white leading-none">{stat.value}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Admission Trends */}
        <div className="glass-panel rounded-3xl p-6 border border-neutral-200/60 shadow-ambient h-[400px] flex flex-col">
          <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
            <BarChart3 className="text-violet-600"/> Admission Trends
          </h3>
          <p className="text-xs text-neutral-500 mb-6">Monthly admission applications over the current academic year.</p>
          
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm font-bold text-neutral-400">Loading...</div>
            ) : (data?.admissionTrends && data.admissionTrends.some(t => t.applications > 0)) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.admissionTrends} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="applications" name="Applications" fill="#8b5cf6" radius={[4,4,0,0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50">
                <AlertCircle className="w-8 h-8 opacity-20 mb-2" />
                <p className="font-bold text-xs">No admission applications found for this year</p>
              </div>
            )}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="glass-panel rounded-3xl p-6 border border-neutral-200/60 shadow-ambient h-[400px] flex flex-col">
          <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
            <PieIcon className="text-blue-600"/> Department Distribution
          </h3>
          <p className="text-xs text-neutral-500 mb-6">Student distribution across various engineering branches.</p>
          
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm font-bold text-neutral-400">Loading...</div>
            ) : (data?.deptDistribution && data.deptDistribution.some(d => d.value > 0)) ? (
              <div className="h-full flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.deptDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.deptDistribution.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2.5 sm:w-1/2">
                  {data.deptDistribution.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{entry.name}</span>
                      <span className="text-xs font-extrabold text-neutral-900 dark:text-white ml-auto">{entry.value} Students</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50">
                <AlertCircle className="w-8 h-8 opacity-20 mb-2" />
                <p className="font-bold text-xs">No enrolled students found</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAnalyticsPage;