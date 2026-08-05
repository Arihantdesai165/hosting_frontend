import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../../services/api';
import { Search, Eye, Filter, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';

const STATUSES = ['All', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ENROLLED'];

const STATUS_STYLE = {
    DRAFT: 'bg-slate-100 text-slate-700',
    REGISTERED: 'bg-slate-100 text-slate-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    UNDER_REVIEW: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    ENROLLED: 'bg-purple-100 text-purple-700',
};

const StudentList = () => {
    const [applications, setApplications] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const navigate = useNavigate();

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15 });
            if (search) params.set('search', search);
            if (statusFilter !== 'All') params.set('status', statusFilter);

            const res = await api.get(`/admin/admissions?${params.toString()}`);
            if (res.data.success) {
                setApplications(res.data.data.applications);
                setTotal(res.data.data.total);
                setTotalPages(res.data.data.totalPages);
            }
        } catch (err) {
            console.error('Failed to fetch applications:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => { setPage(1); fetchApplications(); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Users className="text-primary-600" size={26} />
                        All Applications
                    </h1>
                    <p className="text-slate-500 mt-1">{total} total applications</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="pl-3 pr-8 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    >
                        {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-primary-600" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Users size={40} />
                        <p>No applications found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wide">
                                <th className="text-left px-5 py-3">Applicant</th>
                                <th className="text-left px-5 py-3">App. No.</th>
                                <th className="text-left px-5 py-3">Branch</th>
                                <th className="text-left px-5 py-3">Type</th>
                                <th className="text-left px-5 py-3">Status</th>
                                <th className="text-left px-5 py-3">Applied</th>
                                <th className="text-right px-5 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {applications.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50 transition">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={app.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                                alt="avatar"
                                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                            />
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">
                                                    {app.user?.firstName} {app.user?.lastName}
                                                </p>
                                                <p className="text-xs text-slate-500">{app.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm font-mono text-slate-600">{app.applicationNumber}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-700">{app.branch?.code || '—'}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-700">{app.admissionType || '—'}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[app.applicationStatus] || 'bg-slate-100 text-slate-600'}`}>
                                            {app.applicationStatus}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-500">
                                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : '—'}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <button
                                            onClick={() => navigate(`/admin/students/${app.id}`)}
                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-800 transition"
                                        >
                                            <Eye size={15} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
                        <p className="text-sm text-slate-500">
                            Page {page} of {totalPages} · {total} results
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft size={15} /> Prev
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                Next <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentList;
