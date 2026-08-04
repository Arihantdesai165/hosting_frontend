import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { AdmissionApplication, AdmissionListResult } from '../../services/admission.service';
import {
  Search, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, FileText,
  RefreshCw, Eye, Filter, Calendar, User, GraduationCap, ShieldCheck, Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

interface PrincipalAdmissionQueuePageProps {
  defaultStatus?: string;
}

export const PrincipalAdmissionQueuePage: React.FC<PrincipalAdmissionQueuePageProps> = ({ defaultStatus = 'APPROVED' }) => {
  const navigate = useNavigate();

  const getRouteForStatus = (tabStatus: string) => {
    switch (tabStatus) {
      case 'APPROVED': return '/principal/admissions/pending';
      case 'ENROLLED': return '/principal/admissions/approved';
      case 'REJECTED': return '/principal/admissions/rejected';
      case 'ALL': return '/principal/admissions/history';
      default: return '/principal/admissions/pending';
    }
  };

  const [data, setData] = useState<AdmissionListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>(defaultStatus);
  const [branchId, setBranchId] = useState('ALL');
  const [admissionType, setAdmissionType] = useState('ALL');
  const [qualification, setQualification] = useState('ALL');
  const [academicYear, setAcademicYear] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Stats
  const [stats, setStats] = useState({
    approved: 0,
    enrolled: 0,
    rejected: 0,
    total: 0
  });

  const loadInitialData = async () => {
    try {
      const [statsRes, branchRes] = await Promise.all([
        API.get('/principal/admissions/stats'),
        API.get('/branches')
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (branchRes.data.data) setBranches(branchRes.data.data);
    } catch (e) {
      console.error('Failed to load initial data', e);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', '10');
      if (status) query.set('status', status);
      if (branchId !== 'ALL') query.set('branchId', branchId);
      if (admissionType !== 'ALL') query.set('admissionType', admissionType);
      if (qualification !== 'ALL') query.set('qualification', qualification);
      if (academicYear !== 'ALL') query.set('academicYear', academicYear);
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);
      if (search) query.set('search', search);
      if (sortBy) query.set('sortBy', sortBy);
      if (sortOrder) query.set('sortOrder', sortOrder);

      const res = await API.get(`/principal/admissions/list?${query.toString()}`);
      if (res.data.success) {
        setData(res.data.data as AdmissionListResult);
      }
    } catch (error) {
      console.error('Failed to fetch applications', error);
      toast.error('Failed to fetch applications list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setStatus(defaultStatus);
    setPage(1);
  }, [defaultStatus]);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line
  }, [page, status, branchId, admissionType, qualification, academicYear, startDate, endDate, search, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setBranchId('ALL');
    setAdmissionType('ALL');
    setQualification('ALL');
    setAcademicYear('ALL');
    setStartDate('');
    setEndDate('');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const getStatusBadge = (appStatus: string) => {
    switch (appStatus) {
      case 'FEE_VERIFIED':
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold border border-amber-200">Awaiting Principal Approval</span>;
      case 'ENROLLED':
      case 'ADMISSION_CONFIRMED':
        return <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold border border-emerald-200">Admission Confirmed</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold border border-rose-200">Returned / Rejected</span>;
      case 'CANCELLATION_REQUESTED':
        return <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 font-bold border border-orange-200">Cancellation Requested</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold">{appStatus}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ═══ HEADER BANNER ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck size={24} className="text-indigo-600" />
            Admissions Queue Workspace
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Review Admin-verified admission files and grant final approval for enrollment.
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => fetchApplications()}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-2xl text-xs font-bold transition-all self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Queue
        </button>
      </div>

      {/* ═══ QUEUE TABS ═══ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => navigate(getRouteForStatus('APPROVED'))}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            status === 'APPROVED'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <Clock size={16} />
          Pending Approval ({stats.approved || 0})
        </button>

        <button
          onClick={() => navigate(getRouteForStatus('ENROLLED'))}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            status === 'ENROLLED'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <CheckCircle2 size={16} />
          Confirmed / Approved ({stats.enrolled || 0})
        </button>

        <button
          onClick={() => navigate(getRouteForStatus('REJECTED'))}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            status === 'REJECTED'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <XCircle size={16} />
          Rejected ({stats.rejected || 0})
        </button>

        <button
          onClick={() => navigate(getRouteForStatus('ALL'))}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            status === 'ALL'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <FileText size={16} />
          History / All ({stats.total || 0})
        </button>
      </div>

      {/* ═══ FILTER & SEARCH BAR ═══ */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Admission No, Student Name, Phone, CET/DCET No..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-neutral-400" />
            <span className="text-[10px] font-black uppercase text-neutral-400">Filters:</span>
          </div>

          {/* Branch */}
          <select
            value={branchId}
            onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
            className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
          >
            <option value="ALL">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>

          {/* Admission Type */}
          <select
            value={admissionType}
            onChange={(e) => { setAdmissionType(e.target.value); setPage(1); }}
            className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
          >
            <option value="ALL">All Quotas</option>
            <option value="KCET">KCET</option>
            <option value="DCET">DCET</option>
            <option value="MANAGEMENT">MANAGEMENT</option>
          </select>

          {/* Qualification */}
          <select
            value={qualification}
            onChange={(e) => { setQualification(e.target.value); setPage(1); }}
            className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
          >
            <option value="ALL">All Qualifications</option>
            <option value="PUC">PUC / 12th</option>
            <option value="DIPLOMA">Diploma</option>
          </select>

          {/* Academic Year */}
          <select
            value={academicYear}
            onChange={(e) => { setAcademicYear(e.target.value); setPage(1); }}
            className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
          >
            <option value="ALL">All Academic Years</option>
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() + i;
              const opt = `${y}-${y + 1}`;
              return <option key={opt} value={opt}>{opt}</option>;
            })}
          </select>

          {(branchId !== 'ALL' || admissionType !== 'ALL' || qualification !== 'ALL' || academicYear !== 'ALL' || search) && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-rose-500 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ═══ TABLE / EMPTY QUEUE ═══ */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-indigo-600" />
            <p className="text-xs font-bold text-neutral-400">Loading admission queue files...</p>
          </div>
        ) : !data || data.applications.length === 0 ? (
          <div className="py-20 px-4 text-center flex flex-col items-center justify-center space-y-4">
            <div className="size-20 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-400 flex items-center justify-center border border-slate-200 dark:border-neutral-700">
              <Inbox size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-neutral-800 dark:text-neutral-200">
                No applications found in this queue
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm">
                There are currently no student applications matching your active filters or selected status queue.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-extrabold uppercase text-[10px] tracking-wider bg-neutral-50/50 dark:bg-neutral-800/50">
                    <th className="py-4 px-6">Admission No</th>
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">Branch</th>
                    <th className="py-4 px-6">Quota</th>
                    <th className="py-4 px-6">CET / DCET No</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {data.applications.map((app) => {
                    const studentName = app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() : 'Guest Applicant';
                    return (
                      <tr key={app.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-4 px-6 font-black text-neutral-900 dark:text-white">
                          {app.applicationNumber}
                        </td>
                        <td className="py-4 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                          {studentName}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-indigo-600 dark:text-indigo-400">
                          {app.branch?.code || 'N/A'}
                        </td>
                        <td className="py-4 px-6 font-bold text-neutral-600">
                          {app.admissionType || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-neutral-500 font-medium">
                          {app.cetNumber || app.dcetNumber || 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(app.applicationStatus)}
                        </td>
                        <td className="py-4 px-6 text-neutral-400 font-medium">
                          {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => navigate(`/principal/admissions/review/${app.id}`)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                          >
                            <Eye size={14} />
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ═══ PAGINATION ═══ */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <span className="text-neutral-500 font-medium">
                  Page {data.page} of {data.totalPages} ({data.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={data.page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-xl disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={data.page >= data.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-xl disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PrincipalAdmissionQueuePage;
