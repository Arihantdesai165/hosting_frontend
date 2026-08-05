import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../../services/api';
import { 
    Users, Clock, CheckCircle2, XCircle, Eye, 
    GraduationCap, TrendingUp, BarChart3, Loader2, RefreshCw
} from 'lucide-react';

const STATUS_COLORS = {
    DRAFT: 'bg-slate-100 text-slate-700',
    REGISTERED: 'bg-slate-100 text-slate-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    UNDER_REVIEW: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    ENROLLED: 'bg-purple-100 text-purple-700',
};

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={22} />
        </div>
        <div>
            <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/stats');
            if (res.data.success) setStats(res.data.data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={36} className="animate-spin text-primary-600" />
                    <p className="text-slate-500 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <GraduationCap className="text-primary-600" size={28} />
                        Admission Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Session 2024–25 overview</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard label="Total Applications" value={stats?.total} icon={BarChart3} color="bg-slate-100 text-slate-600" />
                <StatCard label="Draft / Registered" value={stats?.draft ?? stats?.registered} icon={Users} color="bg-slate-100 text-slate-600" />
                <StatCard label="Submitted" value={stats?.submitted} icon={Clock} color="bg-blue-100 text-blue-600" />
                <StatCard label="Under Review" value={stats?.underReview} icon={TrendingUp} color="bg-amber-100 text-amber-600" />
                <StatCard label="Enrolled" value={stats?.enrolled ?? stats?.approved} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
                <StatCard label="Rejected" value={stats?.rejected} icon={XCircle} color="bg-red-100 text-red-600" />
            </div>

            {/* Recent Applications */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800">Recent Pending Applications</h2>
                    <button
                        onClick={() => navigate('/admin/students')}
                        className="text-sm text-primary-600 font-semibold hover:underline"
                    >
                        View All →
                    </button>
                </div>
                {!stats?.recent?.length ? (
                    <div className="p-10 text-center text-slate-400">
                        <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-300" />
                        <p>No pending applications</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {stats.recent.map((app) => (
                            <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={app.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                        alt="avatar"
                                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            {app.user?.firstName} {app.user?.lastName}
                                        </p>
                                        <p className="text-sm text-slate-500">{app.user?.email} · {app.branch?.name || 'No branch'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[app.applicationStatus] || 'bg-slate-100 text-slate-600'}`}>
                                        {app.applicationStatus}
                                    </span>
                                    <button
                                        onClick={() => navigate(`/admin/students/${app.id}`)}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
                                    >
                                        <Eye size={16} /> Review
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
