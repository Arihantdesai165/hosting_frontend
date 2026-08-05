import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, Eye, CheckCircle2, Clock, XCircle, FileText, 
  RefreshCw, Download, User, Phone, MapPin, Calendar, BookOpen, Loader2, ArrowRight, ShieldCheck, Mail, ClipboardList, ShieldAlert, Award, Edit, GraduationCap, X, Briefcase, FileSignature, CheckSquare, Trash2, Ban, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAcademicYear } from '../../../utils/date.util';
import API from '../../../services/api';
import { buildFileUrl } from '../../../utils/file.utils';
import admissionService, { AdmissionApplication } from '../../../services/admission.service';
import { downloadAdmissionPDF } from '../../admission/src/utils/pdfGenerator';
import { generateStudentReport, ExportFilterMetadata } from '../../../utils/studentExportGenerator';

const STATUS_COLOR_MAP: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/40',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/40',
  APPROVED: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-450 dark:border-indigo-900/40',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/40',
  ENROLLED: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/40',
  CANCELLATION_REQUESTED: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/40',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/40',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Verified (Admin)',
  REJECTED: 'Rejected',
  ENROLLED: 'Enrolled',
  CANCELLATION_REQUESTED: 'Cancellation Requested',
  CANCELLED: 'Admission Cancelled',
};

const getPhotoUrl = (path: string | null) => {
  return buildFileUrl(path);
};

interface StudentsDashboardPageProps {
  readOnly?: boolean;
}

export const StudentsDashboardPage: React.FC<StudentsDashboardPageProps> = ({ readOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<AdmissionApplication[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    resubmitted: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    enrolled: 0
  });

  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [academicYear, setAcademicYear] = useState('ALL');
  const [branchId, setBranchId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [admissionType, setAdmissionType] = useState('ALL');
  const [qualification, setQualification] = useState('ALL');
  const [gender, setGender] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [district, setDistrict] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Modal / Detail States
  const [selectedStudent, setSelectedStudent] = useState<AdmissionApplication | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelDirectModalOpen, setCancelDirectModalOpen] = useState(false);
  const [cancelDirectStep, setCancelDirectStep] = useState<1 | 2>(1);
  const [cancelDirectReason, setCancelDirectReason] = useState('');
  const [cancelDirectRemarks, setCancelDirectRemarks] = useState('');
  const [cancelDirectSubmitting, setCancelDirectSubmitting] = useState(false);

  const handleOpenCancelModal = (e: React.MouseEvent, app: AdmissionApplication) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Cancel Admission clicked", app);
    setSelectedStudent(app);
    setCancelDirectReason('');
    setCancelDirectRemarks('');
    setCancelDirectStep(1);
    setCancelDirectModalOpen(true);
  };

  const handleDirectCancelSubmit = async () => {
    if (!selectedStudent || !cancelDirectReason) return;
    setCancelDirectSubmitting(true);
    try {
      await admissionService.directCancel(selectedStudent.id, cancelDirectReason, cancelDirectRemarks);
      toast.success('Admission cancelled successfully.');
      setCancelDirectModalOpen(false);
      setCancelDirectReason('');
      setCancelDirectRemarks('');
      setCancelDirectStep(1);
      if (viewModalOpen) setViewModalOpen(false);
      handleRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to cancel admission');
    } finally {
      setCancelDirectSubmitting(false);
    }
  };
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    applicationStatus: '',
    adminRemarks: '',
  });

  // Export form state
  const [exportForm, setExportForm] = useState({
    academicYear: getAcademicYear(),
    branchId: 'ALL',
    status: 'ALL',
    admissionType: 'ALL',
    qualification: 'ALL',
    exportType: 'summary' as 'summary' | 'complete',
    format: 'excel' as 'excel' | 'csv' | 'pdf'
  });

  const fetchStatsAndBranches = async () => {
    try {
      const [statsData, branchData] = await Promise.all([
        admissionService.getStats(),
        admissionService.getBranches()
      ]);
      if (statsData) setStats(statsData as any);
      if (branchData) setBranches(branchData);
    } catch (e) {
      console.error('Failed to load stats/branches', e);
    }
  };

  const fetchStudentsList = async () => {
    setLoading(true);
    try {
      const res = await admissionService.listApplications({
        page,
        limit: 10,
        status: status === 'ALL' ? undefined : status,
        branchId: branchId === 'ALL' ? undefined : branchId,
        admissionType: admissionType === 'ALL' ? undefined : admissionType,
        qualification: qualification === 'ALL' ? undefined : qualification,
        gender: gender === 'ALL' ? undefined : gender,
        category: category === 'ALL' ? undefined : category,
        district: district.trim() || undefined,
        academicYear: academicYear === 'ALL' ? undefined : academicYear,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined,
        sortBy,
        sortOrder
      });

      setStudents(res.applications);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndBranches();
  }, []);

  useEffect(() => {
    fetchStudentsList();
  }, [
    page, status, branchId, admissionType, qualification, gender, category, 
    district, startDate, endDate, sortBy, sortOrder, search
  ]);

  const handleRefresh = () => {
    fetchStatsAndBranches();
    fetchStudentsList();
  };

  const [viewModalLoading, setViewModalLoading] = useState(false);

  const handleViewStudent = async (id: string) => {
    try {
      setSelectedStudent(null);
      setViewModalLoading(true);
      setViewModalOpen(true);
      const data = await admissionService.getApplication(id);
      setSelectedStudent(data);
    } catch (e) {
      toast.error('Failed to load student details');
      setViewModalOpen(false);
    } finally {
      setViewModalLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedStudent(null);
  };

  const handleDownloadPDF = async (id: string) => {
    await downloadAdmissionPDF(API, toast, id);
  };

  const handleEditClick = (app: AdmissionApplication) => {
    setEditForm({
      id: app.id,
      firstName: app.user?.firstName || '',
      lastName: app.user?.lastName || '',
      phone: app.user?.phone || '',
      email: app.user?.email || '',
      applicationStatus: app.applicationStatus,
      adminRemarks: app.adminRemarks || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await API.put(`/admin/admissions/${editForm.id}/status`, {
        status: editForm.applicationStatus,
        remarks: editForm.adminRemarks
      });
      // Optionally update user details if backend supports, but we focus on status/remarks
      toast.success('Student application updated successfully');
      setEditModalOpen(false);
      handleRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update student application');
    }
  };

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportForm.academicYear) {
      toast.error('Academic Year is required for export');
      return;
    }

    setExportLoading(true);
    try {
      const isComplete = exportForm.exportType === 'complete';

      const res = await admissionService.listApplications({
        page: 1,
        limit: 100000,
        status: exportForm.status === 'ALL' ? (status === 'ALL' ? undefined : status) : exportForm.status,
        branchId: exportForm.branchId === 'ALL' ? (branchId === 'ALL' ? undefined : branchId) : exportForm.branchId,
        admissionType: exportForm.admissionType === 'ALL' ? (admissionType === 'ALL' ? undefined : admissionType) : exportForm.admissionType,
        qualification: exportForm.qualification === 'ALL' ? (qualification === 'ALL' ? undefined : qualification) : exportForm.qualification,
        gender: gender === 'ALL' ? undefined : gender,
        category: category === 'ALL' ? undefined : category,
        district: district.trim() || undefined,
        academicYear: exportForm.academicYear === 'ALL' ? (academicYear === 'ALL' ? undefined : academicYear) : exportForm.academicYear,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
        includeFullDetails: isComplete,
      });

      const matchedRows = res.applications;

      if (!matchedRows || matchedRows.length === 0) {
        toast.warning('No matching students found for the selected export criteria.');
        setExportLoading(false);
        return;
      }

      const branchObj = branches.find(b => b.id === exportForm.branchId);
      const branchCode = exportForm.branchId === 'ALL' ? 'ALL' : (branchObj?.code || 'BRANCH');
      const branchName = exportForm.branchId === 'ALL' ? 'All Branches' : (branchObj?.name || 'Branch');
      const statusLabel = exportForm.status === 'ALL' ? 'All Statuses' : exportForm.status;

      const filterMeta: ExportFilterMetadata = {
        academicYear: exportForm.academicYear,
        branchName,
        branchCode,
        statusLabel,
        admissionType: exportForm.admissionType,
        qualification: exportForm.qualification,
        gender,
        category,
        district,
        startDate,
        endDate,
        search,
      };

      generateStudentReport(matchedRows, exportForm.exportType, exportForm.format, filterMeta);

      toast.success(`Successfully exported ${matchedRows.length} student record(s) as ${exportForm.format.toUpperCase()}`);
      setExportModalOpen(false);
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error(err.response?.data?.error || 'Failed to generate student export report.');
    } finally {
      setExportLoading(false);
    }
  };

  const getTimelineBadge = (title: string, date: string | null) => {
    if (!date) return null;
    return (
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className="size-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center border border-violet-200 dark:border-violet-800 shrink-0">
            <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="w-0.5 h-12 bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="space-y-1 pt-1">
          <p className="text-xs font-bold text-neutral-800 dark:text-white">{title}</p>
          <p className="text-[10px] font-semibold text-neutral-400">{new Date(date).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const summaryCards = [
    { title: 'Total Students', count: stats.total, color: 'border-neutral-500', statusVal: 'ALL' },
    { title: 'Pending Review', count: stats.submitted, color: 'border-blue-500', statusVal: 'SUBMITTED' },
    { title: 'Resubmitted', count: stats.resubmitted, color: 'border-purple-500', statusVal: 'RESUBMITTED' },
    { title: 'Verified', count: stats.approved, color: 'border-indigo-500', statusVal: 'APPROVED' },
    { title: 'Approved', count: stats.enrolled, color: 'border-emerald-500', statusVal: 'APPROVED' },
    { title: 'Rejected', count: stats.rejected, color: 'border-rose-500', statusVal: 'REJECTED' },
    { title: 'Admission Confirmed', count: stats.enrolled, color: 'border-emerald-600', statusVal: 'ENROLLED' },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">Student Management</h2>
          <p className="text-sm font-semibold text-neutral-500">Search, filter, view profile, download PDF, and export student database.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button 
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2.5 bg-violet-600 text-white hover:bg-violet-700 transition-colors rounded-xl shadow-md flex items-center gap-2 text-xs font-bold"
          >
            <Download size={14} /> Export Students
          </button>
          <button onClick={handleRefresh} className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {summaryCards.map((card) => {
          const isActive = status === card.statusVal;
          return (
            <button
              key={card.title}
              onClick={() => {
                setStatus(card.statusVal);
                setPage(1);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 shadow-sm relative overflow-hidden flex flex-col justify-between h-24 ${
                isActive 
                  ? 'bg-neutral-900 border-neutral-950 dark:bg-white dark:border-white text-white dark:text-neutral-900 scale-[1.01]' 
                  : 'bg-white border-neutral-200 hover:border-neutral-300 dark:bg-neutral-900 dark:border-neutral-800'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-[10px] font-black uppercase tracking-wider leading-tight opacity-75">{card.title}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${card.color.replace('border-', 'bg-')}`} />
              </div>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-xl font-black leading-none">{card.count}</span>
                <span className="text-[9px] font-bold opacity-60">students</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters glass panel */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200/60 dark:border-neutral-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Universal Search */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, app no, phone, email, Aadhaar, USN..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Academic Year */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Year:</span>
            <select 
              value={academicYear}
              onChange={(e) => { setAcademicYear(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="ALL">All Years</option>
              {Array.from({ length: 5 }).map((_, i) => {
                const y = new Date().getFullYear() + i;
                const opt = `${y}-${y + 1}`;
                return <option key={opt} value={opt}>{opt}</option>;
              })}
            </select>
          </div>

          {/* Department */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Branch:</span>
            <select 
              value={branchId}
              onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="ALL">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.code}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Status:</span>
            <select 
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Verified (Admin)</option>
              <option value="REJECTED">Rejected</option>
              <option value="ENROLLED">Enrolled</option>
            </select>
          </div>
        </div>

        {/* Filters Second Row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          
          {/* Admission Type */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Type:</span>
            <select 
              value={admissionType}
              onChange={(e) => { setAdmissionType(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="KCET">KCET</option>
              <option value="DCET">DCET</option>
              <option value="MANAGEMENT">MANAGEMENT</option>
            </select>
          </div>

          {/* Qualification */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Qual:</span>
            <select 
              value={qualification}
              onChange={(e) => { setQualification(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="ALL">All Qualifications</option>
              <option value="PUC">PUC / 12th</option>
              <option value="DIPLOMA">Diploma</option>
            </select>
          </div>

          {/* Gender */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Gender:</span>
            <select 
              value={gender}
              onChange={(e) => { setGender(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="ALL">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Category:</span>
            <select 
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="GM">GM</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>

          {/* District Input */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">District:</span>
            <input 
              type="text" 
              placeholder="e.g. Belagavi" 
              value={district}
              onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none w-32"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Submitted Dates:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-2 py-1.5 text-xs font-semibold outline-none"
            />
            <span className="text-xs text-neutral-400">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-2 py-1.5 text-xs font-semibold outline-none"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 font-extrabold">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); }}
              className="bg-neutral-50 dark:bg-neutral-805 border border-neutral-200 dark:border-neutral-700/60 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="date">Date Submitted</option>
              <option value="rank">App Number</option>
              <option value="name">Student Name</option>
              <option value="updatedAt">Last Updated</option>
            </select>
            <button 
              onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              className="p-2 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-805 rounded-xl text-xs font-bold"
            >
              {sortOrder}
            </button>
          </div>

        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-violet-600" size={32} />
            <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Loading student records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <ClipboardList className="mx-auto text-neutral-300 dark:text-neutral-700" size={48} />
            <h3 className="text-base font-extrabold text-neutral-800 dark:text-white">No Student Records Found</h3>
            <p className="text-xs font-semibold text-neutral-500 max-w-md mx-auto">
              There are no student applications matching the filters. Try adjusting your filter parameters or search keyword.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-400 bg-neutral-50/50 dark:bg-neutral-800/20">
                  <th className="py-4.5 px-6 w-16">Photo</th>
                  <th className="py-4.5 px-6">App Number</th>
                  <th className="py-4.5 px-6">Student Name</th>
                  <th className="py-4.5 px-6">Branch</th>
                  <th className="py-4.5 px-6">Type</th>
                  <th className="py-4.5 px-6">Qual</th>
                  <th className="py-4.5 px-6">Mobile Number</th>
                  <th className="py-4.5 px-6">Status</th>
                  <th className="py-4.5 px-6">Submitted Date</th>
                  <th className="py-4.5 px-6">Last Updated</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40 text-xs font-semibold">
                {students.map((app) => {
                  const pd = app.studentpersonaldetails;
                  const docs = app.studentdocuments;
                  const photo = docs?.photoUrl || app.user?.profileImage;

                  return (
                    <tr key={app.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-800/10 transition-colors">
                      <td className="py-4 px-6">
                        <div className="size-10 rounded-full border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          {photo ? (
                            <img src={getPhotoUrl(photo)} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-neutral-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                        {app.applicationNumber}
                      </td>
                      <td className="py-4 px-6 font-bold text-neutral-900 dark:text-white">
                        {app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-neutral-600 dark:text-neutral-400">
                        {app.branch?.code || 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-bold">
                        {app.admissionType || 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-bold text-neutral-500">
                        {app.qualification || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-neutral-500">
                        {pd?.phone || app.user?.phone || 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${STATUS_COLOR_MAP[app.applicationStatus] || STATUS_COLOR_MAP.DRAFT}`}>
                          {STATUS_LABEL_MAP[app.applicationStatus] || app.applicationStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-neutral-400">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-neutral-400">
                        {new Date(app.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleViewStudent(app.id)}
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
                            title="View Profile"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => handleDownloadPDF(app.id)}
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                          {!readOnly && (
                            <button 
                              onClick={() => handleEditClick(app)}
                              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          {!readOnly && (app.applicationStatus === 'ENROLLED' || app.applicationStatus === 'APPROVED') && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenCancelModal(e, app)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Admission"
                            >
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && students.length > 0 && (
          <div className="p-4 border-t border-neutral-150 dark:border-neutral-800/40 flex items-center justify-between text-xs font-bold text-neutral-500">
            <span>Showing page {page} of {totalPages} ({totalCount} total students)</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 rounded-xl"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="p-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 rounded-xl"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 space-y-5 animate-in fade-in duration-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold uppercase tracking-wider text-neutral-900 dark:text-white">Export Student Database</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                <X size={18} className="text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleExportSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Academic Year <span className="text-rose-500">*</span></label>
                <select 
                  value={exportForm.academicYear}
                  onChange={(e) => setExportForm(prev => ({ ...prev, academicYear: e.target.value }))}
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const y = new Date().getFullYear() + i;
                    const opt = `${y}-${y + 1}`;
                    return <option key={opt} value={opt}>{opt}</option>;
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Branch</label>
                <select 
                  value={exportForm.branchId}
                  onChange={(e) => setExportForm(prev => ({ ...prev, branchId: e.target.value }))}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="ALL">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</label>
                  <select 
                    value={exportForm.status}
                    onChange={(e) => setExportForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Verified (Admin)</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ENROLLED">Enrolled</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Admission Type</label>
                  <select 
                    value={exportForm.admissionType}
                    onChange={(e) => setExportForm(prev => ({ ...prev, admissionType: e.target.value }))}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="ALL">All Types</option>
                    <option value="KCET">KCET</option>
                    <option value="DCET">DCET</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Export Type</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setExportForm(prev => ({ ...prev, exportType: 'summary' }))}
                    className={`py-2 px-3 text-xs font-bold border rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 ${exportForm.exportType === 'summary' ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-750 text-neutral-700 dark:text-neutral-350 hover:bg-neutral-100'}`}
                  >
                    <span>Summary Report</span>
                    <span className="text-[9px] opacity-75 font-semibold">Compact 15 columns</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportForm(prev => ({ ...prev, exportType: 'complete' }))}
                    className={`py-2 px-3 text-xs font-bold border rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 ${exportForm.exportType === 'complete' ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-750 text-neutral-700 dark:text-neutral-350 hover:bg-neutral-100'}`}
                  >
                    <span>Complete Report</span>
                    <span className="text-[9px] opacity-75 font-semibold">Full 360° All Fields</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Export Format</label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: 'Excel (.xlsx)', value: 'excel' as const },
                    { label: 'CSV', value: 'csv' as const },
                    { label: 'PDF', value: 'pdf' as const },
                  ].map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setExportForm(prev => ({ ...prev, format: f.value }))}
                      className={`py-2 px-3 text-xs font-bold border rounded-xl transition-all ${exportForm.format === f.value ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-750 text-neutral-700 dark:text-neutral-350 hover:bg-neutral-100'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={exportLoading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 transition-colors text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Exporting Database...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Start Export Download
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold uppercase tracking-wider text-neutral-900 dark:text-white">Modify Student Application</h3>
              <button onClick={() => setEditModalOpen(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                <X size={18} className="text-neutral-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">First Name</label>
                  <input 
                    type="text" 
                    value={editForm.firstName}
                    disabled
                    className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-not-allowed opacity-75"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Last Name</label>
                  <input 
                    type="text" 
                    value={editForm.lastName}
                    disabled
                    className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-not-allowed opacity-75"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email Address</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  disabled
                  className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-not-allowed opacity-75"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Application Status</label>
                <select 
                  value={editForm.applicationStatus}
                  onChange={(e) => setEditForm(prev => ({ ...prev, applicationStatus: e.target.value }))}
                  className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Verified (Admin)</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ENROLLED">Enrolled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Remarks / Internal notes</label>
                <textarea 
                  rows={3}
                  value={editForm.adminRemarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, adminRemarks: e.target.value }))}
                  placeholder="Enter remarks for verification status change..."
                  className="w-full bg-neutral-50 dark:bg-neutral-855 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <button 
                onClick={handleSaveEdit}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 transition-colors text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
              >
                Save Status Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-[94vw] h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-200 overflow-hidden">
            
            {viewModalLoading || !selectedStudent ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Loading Student Profile...</p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-neutral-155 dark:border-neutral-800 p-6 shrink-0 bg-neutral-50/50 dark:bg-neutral-800/10">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                      {selectedStudent.studentdocuments?.photoUrl ? (
                        <img src={getPhotoUrl(selectedStudent.studentdocuments.photoUrl)} alt="photo" className="w-full h-full object-cover" />
                      ) : (
                        <User size={28} className="text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-wide">
                          {selectedStudent.user ? `${selectedStudent.user.firstName || ''} ${selectedStudent.user.lastName || ''}`.trim() : 'Student Profile'}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${STATUS_COLOR_MAP[selectedStudent.applicationStatus] || STATUS_COLOR_MAP.DRAFT}`}>
                          {STATUS_LABEL_MAP[selectedStudent.applicationStatus] || selectedStudent.applicationStatus}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-neutral-500 mt-1">
                        <span>Admission No: <strong className="text-neutral-700 dark:text-neutral-300">{selectedStudent.applicationNumber}</strong></span>
                        <span className="hidden sm:inline">•</span>
                        <span>Branch: <strong className="text-neutral-700 dark:text-neutral-300">{selectedStudent.branch?.name || 'N/A'}</strong></span>
                        <span className="hidden sm:inline">•</span>
                        <span>Type: <strong className="text-neutral-700 dark:text-neutral-300">{selectedStudent.admissionType || 'N/A'}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedStudent.applicationStatus === 'ENROLLED' && (
                      <button 
                        type="button"
                        onClick={(e) => handleOpenCancelModal(e, selectedStudent)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-md"
                      >
                        <Ban size={14} /> Cancel Admission
                      </button>
                    )}
                    <button 
                      onClick={() => handleDownloadPDF(selectedStudent.id)}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-md"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                    <button 
                      onClick={handleCloseViewModal} 
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-205 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

            {/* Modal Body: Scrollable Internally */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-slate-50/30 dark:bg-neutral-900/30">
              
              {/* Profile Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                
                {/* Columns 1 & 2: Main Info Sections */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Personal & Admission Details Card */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-5 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <User size={16} className="text-violet-500" /> Personal Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Gender</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Date of Birth</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.dateOfBirth || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Category</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Caste</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.caste || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Religion</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.religion || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Nationality</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.nationality || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Studied In Karnataka</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.studiedInKarnataka ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Area Type</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.areaType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Aadhaar Number</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.aadhaar || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Parents / Guardian Card */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-5 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <BookOpen size={16} className="text-violet-500" /> Parent / Guardian Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Father's Name</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentparentdetails?.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Father's Occupation</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentparentdetails?.fatherOccupation || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Father's Phone</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentparentdetails?.fatherPhone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Father's Email</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentparentdetails?.fatherEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Annual Family Income</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                          {selectedStudent.studentparentdetails?.fatherAnnualIncome ? `₹${Number(selectedStudent.studentparentdetails.fatherAnnualIncome).toLocaleString('en-IN')}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Mother's Name</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentparentdetails?.motherName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Mother's Occupation</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentparentdetails?.motherOccupation || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Mother's Phone</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentparentdetails?.motherPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details Card */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-5 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <Phone size={16} className="text-violet-500" /> Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                        <Mail className="text-violet-500 shrink-0" size={16} />
                        <div>
                          <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Candidate Email</p>
                          <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.user?.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                        <Phone className="text-violet-500 shrink-0" size={16} />
                        <div>
                          <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Candidate Mobile</p>
                          <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.user?.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Addresses Card */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-5 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <MapPin size={16} className="text-violet-500" /> Address Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                      <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl space-y-2">
                        <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider">Current Residence</p>
                        <p className="font-semibold text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {selectedStudent.studentaddress?.currentAddressLine1 || 'N/A'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/40 text-[11px] font-bold text-neutral-500">
                          <span>City: <strong className="text-neutral-800 dark:text-neutral-200">{selectedStudent.studentaddress?.currentCity || 'N/A'}</strong></span>
                          <span>State: <strong className="text-neutral-800 dark:text-neutral-200">{selectedStudent.studentaddress?.currentState || 'N/A'}</strong></span>
                          <span className="col-span-2">Pincode: <strong className="text-neutral-800 dark:text-neutral-200">{selectedStudent.studentaddress?.currentPincode || 'N/A'}</strong></span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl space-y-2">
                        <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider">Permanent Residence</p>
                        <p className="font-semibold text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {selectedStudent.studentaddress?.permanentAddressLine1 || 'N/A'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/40 text-[11px] font-bold text-neutral-500">
                          <span>City: <strong className="text-neutral-800 dark:text-neutral-200">{selectedStudent.studentaddress?.permanentCity || 'N/A'}</strong></span>
                          <span>State: <strong className="text-neutral-800 dark:text-neutral-200">{selectedStudent.studentaddress?.permanentState || 'N/A'}</strong></span>
                          <span className="col-span-2">Pincode: <strong className="text-neutral-800 dark:text-neutral-200">{selectedStudent.studentaddress?.permanentPincode || 'N/A'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Qualifications Card */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-5 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <GraduationCap size={16} className="text-violet-500" /> Academic Qualifications
                    </h4>
                    
                    <div className="space-y-4">
                      {/* SSLC / 10th */}
                      <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center border-b border-neutral-200/40 pb-2">
                          <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider">SSLC / 10th Details</p>
                          <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-md text-[9px] font-black uppercase">SSLC</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase">School Name</p>
                            <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.tenthSchool || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase">Board</p>
                            <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.tenthBoard || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase">Passing Year</p>
                            <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.tenthPassingYear || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase">Reg Number</p>
                            <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.tenthRegisterNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase">Marks Obtained</p>
                            <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.tenthMarksObtained || 'N/A'} / {selectedStudent.studentacademicdetails?.tenthMaxMarks || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase">Percentage</p>
                            <p className="font-extrabold text-violet-600 dark:text-violet-400">{selectedStudent.studentacademicdetails?.tenthPercentage ? `${selectedStudent.studentacademicdetails.tenthPercentage}%` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase">Attempts</p>
                            <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.tenthAttempts || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* 12th / PUC or Diploma */}
                      {selectedStudent.qualification === 'PUC' ? (
                        <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center border-b border-neutral-200/40 pb-2">
                            <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider">PUC / 12th Details</p>
                            <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-md text-[9px] font-black uppercase">PUC / 12TH</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="col-span-2">
                              <p className="text-[9px] font-black text-neutral-400 uppercase">College Name</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.twelfthSchool || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Board</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.twelfthBoard || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Passing Year</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.twelfthPassingYear || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Reg Number</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.twelfthRegisterNumber || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Stream</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.twelfthStream || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Percentage</p>
                              <p className="font-extrabold text-violet-600 dark:text-violet-400">{selectedStudent.studentacademicdetails?.twelfthPercentage ? `${selectedStudent.studentacademicdetails.twelfthPercentage}%` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Attempts</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.twelfthAttempts || 'N/A'}</p>
                            </div>
                          </div>
                          {/* Subject Marks Breakup */}
                          <div className="pt-2 border-t border-neutral-200/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Physics Marks</p>
                              <p className="font-bold text-neutral-700 dark:text-neutral-300">{selectedStudent.studentacademicdetails?.physicsMarks || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Mathematics Marks</p>
                              <p className="font-bold text-neutral-700 dark:text-neutral-300">{selectedStudent.studentacademicdetails?.mathsMarks || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Chemistry Marks</p>
                              <p className="font-bold text-neutral-700 dark:text-neutral-300">{selectedStudent.studentacademicdetails?.chemistryMarks || 'N/A'}</p>
                            </div>
                            {selectedStudent.studentacademicdetails?.optionalSubject && (
                              <div>
                                <p className="text-[9px] font-black text-neutral-400 uppercase">{selectedStudent.studentacademicdetails.optionalSubject} Marks</p>
                                <p className="font-bold text-neutral-700 dark:text-neutral-300">{selectedStudent.studentacademicdetails?.optionalMarks || 'N/A'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center border-b border-neutral-200/40 pb-2">
                            <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider">Diploma Details</p>
                            <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-md text-[9px] font-black uppercase">DIPLOMA</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="col-span-2">
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Institution / University</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.diplomaUniversity || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Passing Year</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.diplomaYear || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Reg Number</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.diplomaRegisterNumber || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Final Obtained Marks</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.diplomaFinalYearObtained || 'N/A'} / {selectedStudent.studentacademicdetails?.diplomaFinalYearMaxMarks || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Percentage</p>
                              <p className="font-extrabold text-violet-600 dark:text-violet-400">{selectedStudent.studentacademicdetails?.diplomaPercentage ? `${selectedStudent.studentacademicdetails.diplomaPercentage}%` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Attempts</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.diplomaAttempts || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Entrance Exams */}
                      {(selectedStudent.cetNumber || selectedStudent.dcetNumber) && (
                        <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center border-b border-neutral-200/40 pb-2">
                            <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider">Entrance Exam Details</p>
                            <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-md text-[9px] font-black uppercase">
                              {selectedStudent.admissionType} Exam
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Exam Reg Number</p>
                              <p className="font-bold text-neutral-850 dark:text-neutral-200">
                                {selectedStudent.cetNumber || selectedStudent.dcetNumber || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Score</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.cetScore || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Rank</p>
                              <p className="font-extrabold text-violet-600 dark:text-violet-400">#{selectedStudent.studentacademicdetails?.cetRank || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-neutral-400 uppercase">Exam Year</p>
                              <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedStudent.studentacademicdetails?.cetYear || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gap Details */}
                      {selectedStudent.studentacademicdetails?.hasGap && (
                        <div className="p-4 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 rounded-2xl text-xs space-y-1">
                          <p className="text-[10px] font-black text-amber-600 dark:text-amber-450 uppercase tracking-wider">Academic Gap Details</p>
                          <p className="font-semibold text-neutral-700 dark:text-neutral-350">{selectedStudent.studentacademicdetails.gapReason}</p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Admission Details Card */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-5 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <Award size={16} className="text-violet-500" /> Admission Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Branch</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.branch?.name || 'N/A'} ({selectedStudent.branch?.code || 'N/A'})</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Academic Year</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.academicYear || getAcademicYear()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Admission Type</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.admissionType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Category</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Religion</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.religion || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Nationality</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.studentpersonaldetails?.nationality || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-5 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <FileText size={16} className="text-violet-500" /> Uploaded Documents
                    </h4>
                    
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
                      {[
                        { label: 'Aadhaar copy', key: 'aadhaarUrl', field: 'aadhaar' },
                        { label: '10th / SSLC Marks Card', key: 'tenthMarksheetUrl', field: 'tenthMarksheet' },
                        { label: '12th / PUC Marks Card', key: 'twelfthMarksheetUrl', field: 'twelfthMarksheet' },
                        { label: 'Diploma 5th Sem Marks Card', key: 'diplomaSemester5MarksheetUrl', field: 'diplomaSemester5Marksheet' },
                        { label: 'Diploma 6th Sem Marks Card', key: 'diplomaSemester6MarksheetUrl', field: 'diplomaSemester6Marksheet' },
                        { label: 'Caste Certificate / Income Cert', key: 'casteCertificateUrl', field: 'casteCertificate' },
                        { label: 'Domicile / Study Certificate', key: 'domicileCertificateUrl', field: 'domicileCertificate' },
                        { label: 'Academic Gap Certificate', key: 'gapCertificateUrl', field: 'gapCertificate' },
                      ].map((doc) => {
                        const path = selectedStudent.studentdocuments?.[doc.key as keyof typeof selectedStudent.studentdocuments];
                        if (!path) return null;

                        const docUrl = `${API.defaults.baseURL || '/api'}/admin/admissions/${selectedStudent.id}/documents/${doc.field}`;

                        return (
                          <div key={doc.key} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-500 shrink-0">
                                <FileText size={16} />
                              </div>
                              <div>
                                <p className="font-bold text-neutral-800 dark:text-neutral-200">{doc.label}</p>
                                <span className="text-[10px] font-black uppercase text-emerald-500">Uploaded</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <a 
                                href={docUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                              >
                                <Eye size={12} /> View
                              </a>
                              <a 
                                href={`${docUrl}`}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/20 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                              >
                                <Download size={12} /> Download
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Column 3: Status, Remarks & Timeline sidebars */}
                <div className="space-y-6">
                  
                  {/* Verification Status Card */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-4 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-violet-500" /> Verification Status
                    </h4>
                    
                    <div className="space-y-3.5 pt-1 text-xs">
                      <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-150/40 dark:border-neutral-800/80">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className={selectedStudent.documentsVerified ? "text-emerald-500" : "text-neutral-300"} />
                          <span className="font-bold">Documents Verified</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${selectedStudent.documentsVerified ? "bg-emerald-150 text-emerald-850 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-neutral-100 text-neutral-450 dark:bg-neutral-800 dark:text-neutral-400"}`}>
                          {selectedStudent.documentsVerified ? "Verified" : "Pending"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-150/40 dark:border-neutral-800/80">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className={selectedStudent.feesVerified ? "text-emerald-500" : "text-neutral-300"} />
                          <span className="font-bold">Fees Payment Verified</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${selectedStudent.feesVerified ? "bg-emerald-150 text-emerald-850 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-neutral-100 text-neutral-450 dark:bg-neutral-800 dark:text-neutral-400"}`}>
                          {selectedStudent.feesVerified ? "Verified" : "Pending"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-150/40 dark:border-neutral-800/80">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className={selectedStudent.eligibilityVerified ? "text-emerald-500" : "text-neutral-300"} />
                          <span className="font-bold">Eligibility Criteria Verified</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${selectedStudent.eligibilityVerified ? "bg-emerald-150 text-emerald-850 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-neutral-100 text-neutral-450 dark:bg-neutral-800 dark:text-neutral-400"}`}>
                          {selectedStudent.eligibilityVerified ? "Verified" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks logs */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-4 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <ClipboardList size={16} className="text-violet-500" /> Administrative Remarks
                    </h4>
                    
                    <div className="space-y-4 pt-1 text-xs">
                      <div>
                        <p className="text-[9px] font-black uppercase text-violet-500 tracking-wider">Officer Remarks</p>
                        {selectedStudent.adminRemarks ? (
                          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-150/40 dark:border-neutral-800/80 rounded-xl mt-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                            {selectedStudent.adminRemarks}
                          </div>
                        ) : (
                          <p className="italic text-neutral-400 mt-1">No remarks recorded by office.</p>
                        )}
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase text-violet-500 tracking-wider">Principal Remarks</p>
                        {selectedStudent.approvalRemarks ? (
                          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-150/40 dark:border-neutral-800/80 rounded-xl mt-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                            {selectedStudent.approvalRemarks}
                          </div>
                        ) : (
                          <p className="italic text-neutral-400 mt-1">No remarks recorded by Principal.</p>
                        )}
                      </div>

                      {selectedStudent.rejectionReason && (
                        <div>
                          <p className="text-[9px] font-black uppercase text-rose-500 tracking-wider">Rejection Reason</p>
                          <div className="p-3 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-200/40 dark:border-rose-900/30 rounded-xl mt-1.5 font-semibold text-rose-700 dark:text-rose-355">
                            {selectedStudent.rejectionReason}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Application Timeline Card */}
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5.5 space-y-4 shadow-sm text-neutral-900 dark:text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white border-l-4 border-violet-500 pl-3 flex items-center gap-2">
                      <Clock size={16} className="text-violet-500" /> Application Timeline
                    </h4>
                    
                    <div className="space-y-0.5 pl-1.5 border-l-2 border-neutral-200 dark:border-neutral-800">
                      {getTimelineBadge('Application Created', selectedStudent.createdAt)}
                      {getTimelineBadge('Submitted Under Review', selectedStudent.submittedAt)}
                      {getTimelineBadge('Verified / Approved by Officer', selectedStudent.verifiedAt)}
                      {getTimelineBadge('Admission Finalized (Enrolled)', selectedStudent.applicationStatus === 'ENROLLED' ? selectedStudent.updatedAt : null)}
                    </div>
                  </div>

                  {/* Cancellation Information Card */}
                  {(selectedStudent.applicationStatus === 'CANCELLED' || selectedStudent.applicationStatus === 'CANCELLATION_REQUESTED') && (
                    <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/60 dark:border-rose-900/40 rounded-3xl p-5.5 space-y-4 shadow-sm text-neutral-900 dark:text-white">
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 border-l-4 border-rose-500 pl-3 flex items-center gap-2">
                        <Ban size={16} className="text-rose-500" /> Cancellation Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Status</p>
                          <p className="font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                            {selectedStudent.applicationStatus === 'CANCELLED' ? 'Admission Cancelled' : 'Cancellation Pending'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Cancellation Reason</p>
                          <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.cancellationReason || 'N/A'}</p>
                        </div>
                        {selectedStudent.cancellationRequestedAt && (
                          <div>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Requested Date</p>
                            <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                              {new Date(selectedStudent.cancellationRequestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                        {selectedStudent.cancellationApprovedAt && (
                          <div>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Cancelled Date</p>
                            <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                              {new Date(selectedStudent.cancellationApprovedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedStudent.cancellationRemarks && (
                        <div className="text-xs">
                          <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Student Remarks</p>
                          <div className="p-3 bg-white dark:bg-neutral-950 border border-rose-200/40 dark:border-rose-900/30 rounded-xl mt-1.5 font-semibold text-neutral-700 dark:text-neutral-300 italic">
                            "{selectedStudent.cancellationRemarks}"
                          </div>
                        </div>
                      )}
                      {selectedStudent.cancellationAdminRemarks && (
                        <div className="text-xs">
                          <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Administrator Remarks</p>
                          <div className="p-3 bg-white dark:bg-neutral-950 border border-rose-200/40 dark:border-rose-900/30 rounded-xl mt-1.5 font-semibold text-neutral-700 dark:text-neutral-300 italic">
                            "{selectedStudent.cancellationAdminRemarks}"
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  )}

      {/* Direct Cancel Admission Modal (Two-Step Workflow) */}
      {cancelDirectModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
            
            {cancelDirectStep === 1 ? (
              <>
                {/* Modal Title */}
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <h3 className="text-base font-black text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                    <Ban className="text-rose-600" size={20} /> Cancel Admission
                  </h3>
                  <button 
                    onClick={() => {
                      setCancelDirectModalOpen(false);
                      setCancelDirectReason('');
                      setCancelDirectRemarks('');
                      setCancelDirectStep(1);
                    }}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Display Student Details */}
                <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Student Name</p>
                    <p className="font-extrabold text-neutral-900 dark:text-white mt-0.5">
                      {selectedStudent.user ? `${selectedStudent.user.firstName || ''} ${selectedStudent.user.lastName || ''}`.trim() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Admission Number</p>
                    <p className="font-extrabold text-neutral-900 dark:text-white mt-0.5">{selectedStudent.applicationNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Branch</p>
                    <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.branch?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Admission Type</p>
                    <p className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedStudent.admissionType || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Current Status</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40">
                      Admission Confirmed
                    </span>
                  </div>
                </div>

                {/* Reason & Remarks Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">
                      Reason <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={cancelDirectReason}
                      onChange={(e) => setCancelDirectReason(e.target.value)}
                      className="w-full text-xs font-semibold bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-neutral-950 dark:text-white transition-colors"
                    >
                      <option value="">Select a reason</option>
                      <option value="Student Joined Another College">Student Joined Another College</option>
                      <option value="Student Did Not Report">Student Did Not Report</option>
                      <option value="Fee Not Paid">Fee Not Paid</option>
                      <option value="Documents Not Submitted">Documents Not Submitted</option>
                      <option value="Duplicate Admission">Duplicate Admission</option>
                      <option value="Requested Offline">Requested Offline</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">
                      Remarks
                    </label>
                    <textarea
                      value={cancelDirectRemarks}
                      onChange={(e) => setCancelDirectRemarks(e.target.value)}
                      rows={3}
                      placeholder="Optional administrative notes..."
                      className="w-full text-xs font-semibold p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-neutral-950 dark:text-white transition-all resize-none"
                    />
                  </div>

                  {/* Information Box */}
                  <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-4 space-y-2 text-xs">
                    <p className="font-extrabold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      This action will ONLY change the student's admission status to: <strong>Admission Cancelled</strong>
                    </p>
                    <p className="font-bold text-amber-800 dark:text-amber-350 text-[11px]">The following WILL NOT be deleted:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-300">
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> Student Profile</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> Personal Details</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> Academic Details</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> Uploaded Documents</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> Admission History</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> Timeline</span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setCancelDirectModalOpen(false);
                      setCancelDirectReason('');
                      setCancelDirectRemarks('');
                      setCancelDirectStep(1);
                    }}
                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-350 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!cancelDirectReason}
                    onClick={() => setCancelDirectStep(2)}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-rose-600/10 flex items-center gap-1.5"
                  >
                    Proceed <ArrowRight size={14} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Step 2: Final Confirmation Modal */}
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <h3 className="text-base font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle size={20} className="text-rose-600" /> Final Confirmation
                  </h3>
                  <button 
                    onClick={() => setCancelDirectStep(1)}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  <p className="text-sm font-extrabold text-neutral-900 dark:text-white">
                    Are you sure you want to cancel this student's admission?
                  </p>

                  <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-xl p-4 space-y-2.5">
                    <div>
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Student</p>
                      <p className="font-extrabold text-neutral-900 dark:text-white text-xs mt-0.5">
                        {selectedStudent.applicationNumber} — {selectedStudent.user ? `${selectedStudent.user.firstName || ''} ${selectedStudent.user.lastName || ''}`.trim() : 'N/A'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-100 dark:border-rose-900/30">
                      <div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Current Status</p>
                        <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">Admission Confirmed</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">New Status</p>
                        <p className="font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">Admission Cancelled</p>
                      </div>
                    </div>

                    <p className="text-[11px] font-bold text-rose-700 dark:text-rose-350 italic pt-1">
                      ℹ This action does NOT delete the student.
                    </p>
                  </div>
                </div>

                {/* Step 2 Buttons */}
                <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    disabled={cancelDirectSubmitting}
                    onClick={() => setCancelDirectStep(1)}
                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-350 transition-colors disabled:opacity-50"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    disabled={cancelDirectSubmitting}
                    onClick={handleDirectCancelSubmit}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-rose-600/10 flex items-center gap-1.5"
                  >
                    {cancelDirectSubmitting ? 'Cancelling...' : 'Yes, Cancel Admission'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsDashboardPage;
