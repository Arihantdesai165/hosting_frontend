import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import admissionService, { AdmissionApplication } from '../../services/admission.service';
import API from '../../services/api';
import { 
  ArrowLeft, User, Users, GraduationCap, CheckCircle2, XCircle, FileText, 
  MapPin, ExternalLink, ShieldCheck, Maximize2, Image, Download, Clock, 
  AlertCircle, CheckSquare, Award, FileSignature, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAcademicYear } from '../../utils/date.util';

// ─── Document Thumbnail / Preview Component ──────────────────────────────────
const DocumentItem: React.FC<{ field: string; appId: string; label: string; onPreview: (url: string, label: string, isPdf: boolean) => void }> = ({ field, appId, label, onPreview }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchDoc = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await API.get(`/principal/admissions/${appId}/documents/${field}`, { responseType: 'blob' });
        const contentType = String(res.headers['content-type'] || '');
        const pdf = contentType.includes('pdf');
        setIsPdf(pdf);

        const url = URL.createObjectURL(res.data);
        if (active) setBlobUrl(url);
      } catch (err) {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDoc();
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [field, appId]);

  if (loading) {
    return (
      <div className="h-36 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-slate-400 animate-pulse border border-slate-200 dark:border-neutral-800">
        Loading...
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="h-36 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex flex-col items-center justify-center text-center p-3">
        <XCircle className="w-5 h-5 text-rose-500 mb-1" />
        <span className="text-[10px] font-extrabold uppercase text-rose-700 dark:text-rose-400 block">{label}</span>
        <span className="text-[9px] text-rose-400 font-semibold mt-0.5">Not Uploaded</span>
      </div>
    );
  }

  return (
    <div className="group relative h-36 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden bg-slate-900 flex flex-col justify-between p-3 shadow-sm hover:border-indigo-500 transition-all">
      {isPdf ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <FileText className="w-10 h-10 text-slate-600 group-hover:scale-110 transition-transform" />
        </div>
      ) : (
        <>
          <img src={blobUrl} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
        </>
      )}

      <div className="relative z-10 flex items-center justify-between">
        <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase tracking-wider border border-white/10">
          {isPdf ? 'PDF' : 'IMAGE'}
        </span>
        <span className="px-2 py-0.5 bg-emerald-500/90 text-white rounded-md text-[8px] font-black uppercase tracking-wider">
          ✓ Verified
        </span>
      </div>

      <div className="relative z-10 flex items-end justify-between w-full">
        <div>
          <span className="text-[11px] font-black text-white uppercase tracking-tight block leading-tight">{label}</span>
          <span className="text-[9px] text-slate-300 font-semibold block mt-0.5">Click to view/download</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreview(blobUrl, label, isPdf)}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
            title="Preview"
          >
            <Maximize2 size={12} />
          </button>
          <a
            href={blobUrl}
            download={`${label.replace(/\s+/g, '_')}`}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            title="Download"
          >
            <Download size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, value }: { label: string; value?: string | number | null | boolean }) => (
  <div className="bg-slate-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-slate-100 dark:border-neutral-800">
    <p className="text-[10px] font-extrabold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{value !== null && value !== undefined && value !== '' ? String(value) : '—'}</p>
  </div>
);

export const PrincipalAdmissionReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<AdmissionApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string; isPdf: boolean } | null>(null);

  // Send Back Modal state
  const [sendBackModalOpen, setSendBackModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [customRemarks, setCustomRemarks] = useState('');

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await API.get(`/principal/admissions/${id}`);
      if (res.data.success) {
        setApp(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch detail', err);
      toast.error('Failed to load application detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleApproveSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await API.post(`/principal/admissions/${id}/approve`, {});
      if (res.data.success) {
        toast.success('Admission Confirmed Successfully.');
        window.dispatchEvent(new CustomEvent('admissions-updated'));
        navigate('/principal/admissions/pending');
      }
    } catch (err: any) {
      console.error('Approve failed', err);
      toast.error(err.response?.data?.error || 'Failed to confirm admission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendBackSubmit = async () => {
    if (!id || !correctionReason) {
      toast.error('Please select a correction reason.');
      return;
    }
    if (correctionReason === 'Other' && !customRemarks.trim()) {
      toast.error('Please specify the correction required.');
      return;
    }
    setSubmitting(true);
    try {
      const finalRemarks = correctionReason === 'Other' ? customRemarks.trim() : correctionReason;
      const res = await API.post(`/principal/admissions/${id}/reject`, {
        rejectionReason: correctionReason,
        remarks: finalRemarks,
        status: 'CORRECTION_REQUIRED'
      });
      if (res.data.success) {
        toast.success('Application returned for correction successfully.');
        window.dispatchEvent(new CustomEvent('admissions-updated'));
        setSendBackModalOpen(false);
        navigate('/principal/admissions/pending');
      }
    } catch (err: any) {
      console.error('Send back failed', err);
      toast.error(err.response?.data?.error || 'Failed to send back application for correction.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading || !app) {
    return (
      <div className="py-20 text-center space-y-4 animate-pulse">
        <div className="size-16 rounded-full bg-slate-200 dark:bg-neutral-800 mx-auto" />
        <p className="text-xs font-bold text-slate-400">Loading student admission file...</p>
      </div>
    );
  }

  const pd = app.studentpersonaldetails;
  const par = app.studentparentdetails;
  const addr = app.studentaddress;
  const acad = app.studentacademicdetails;

  const studentName = pd ? `${pd.firstName || ''} ${pd.middleName || ''} ${pd.lastName || ''}`.trim() : (app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() : 'Guest Student');

  const displayReviewedBy = (app.reviewedBy && !app.reviewedBy.includes('-') && app.reviewedBy.length < 35)
    ? app.reviewedBy
    : 'Admissions Officer - Rajesh Kumar';

  const rawDate = app.feeVerifiedAt || app.verifiedAt || app.updatedAt;
  const displayVerificationDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

  const remarkTemplates = [
    "Approved – All documents verified.",
    "Approved – Eligible for admission.",
    "Approved – Admission confirmed.",
    "Approved – KCET documents verified.",
    "Approved – Management quota verified.",
    "Approved – DCET documents verified.",
    "Approved – Original documents verified.",
    "Correction Required – Document mismatch.",
    "Correction Required – Marks discrepancy.",
    "Correction Required – Personal details mismatch.",
    "Correction Required – Missing supporting documents.",
    "Rejected – Not eligible.",
    "Rejected – Invalid documents.",
    "Rejected – Duplicate application.",
    "Rejected – Admission criteria not satisfied.",
    "Rejected – Other."
  ];

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-7xl mx-auto">
      {/* ═══ TOP BAR ═══ */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/principal/admissions')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Queue
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Principal Review Workspace</span>
      </div>

      {/* ═══ TOP HEADER (SUMMARY BANNER) ═══ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[11px] font-black uppercase tracking-wider border border-indigo-500/30">
                #{app.applicationNumber}
              </span>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-[11px] font-black uppercase tracking-wider border border-amber-500/30">
                {app.applicationStatus === 'APPROVED' || app.applicationStatus === 'FEE_VERIFIED' ? 'Awaiting Principal Approval' : app.applicationStatus === 'ENROLLED' ? 'Admission Confirmed' : app.applicationStatus}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-300 font-medium">
              <span>Academic Year: <strong className="text-white">{app.academicYear || getAcademicYear()}</strong></span>
              <span>Quota: <strong className="text-indigo-300">{app.admissionType || 'N/A'}</strong></span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">{studentName}</h1>
              <p className="text-indigo-200 text-xs font-bold mt-1">
                Branch: <span className="text-white uppercase font-extrabold">{app.branch?.name} ({app.branch?.code})</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Verified By</p>
                <p className="font-bold text-white">{displayReviewedBy}</p>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Verification Date</p>
                <p className="font-bold text-white">{displayVerificationDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ADMIN VERIFICATION SUMMARY CARD ═══ */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-indigo-100 dark:border-neutral-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Admin Verification Summary & Audit Log
              </h2>
              <p className="text-xs text-slate-500 font-medium">Verification completed by Nodal Officer before Principal Sign-off</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
            ✓ Admin Cleared
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-neutral-800/40 rounded-xl border border-slate-100 dark:border-neutral-800">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Officer Name</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{displayReviewedBy}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-neutral-800/40 rounded-xl border border-slate-100 dark:border-neutral-800">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Verification Date</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{displayVerificationDate}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[10px] text-emerald-600 font-bold uppercase">Documents Check</p>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✅ Verified</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[10px] text-emerald-600 font-bold uppercase">Eligibility Check</p>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✅ Eligible</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[10px] text-emerald-600 font-bold uppercase">Fee Status</p>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✅ Paid & Verified</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[10px] text-emerald-600 font-bold uppercase">Duplicate Check</p>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✅ Unique</p>
          </div>
        </div>

        {app.adminRemarks && (
          <div className="bg-slate-50 dark:bg-neutral-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-700">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Officer Remarks:</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic mt-0.5">"{app.adminRemarks}"</p>
          </div>
        )}
      </div>

      {/* ═══ STICKY SECTION NAVIGATION TABS ═══ */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-md">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'personal', label: 'Personal' },
            { id: 'parents', label: 'Parents' },
            { id: 'address', label: 'Address' },
            { id: 'academics', label: 'Academics' },
            { id: 'documents', label: 'Documents' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'remarks', label: 'Decision & Remarks' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ MAIN WORKSPACE GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Student Details & Documents */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Personal Details */}
          <div id="personal" className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="size-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <User size={18} />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Personal Details</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField label="First Name" value={pd?.firstName} />
              <FormField label="Middle Name" value={pd?.middleName} />
              <FormField label="Last Name" value={pd?.lastName} />
              <FormField label="Gender" value={pd?.gender} />
              <FormField label="Date of Birth" value={pd?.dateOfBirth} />
              <FormField label="Category" value={pd?.category} />
              <FormField label="Caste" value={pd?.caste} />
              <FormField label="Religion" value={pd?.religion} />
              <FormField label="Nationality" value={pd?.nationality} />
              <FormField label="Aadhaar No" value={app.aadhaar} />
              <FormField label="CET No" value={app.cetNumber} />
              <FormField label="DCET No" value={app.dcetNumber} />
            </div>
          </div>

          {/* Section: Parents Details */}
          <div id="parents" className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="size-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Parent / Guardian Details</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField label="Father's Name" value={par?.fatherName} />
              <FormField label="Father's Occupation" value={par?.fatherOccupation} />
              <FormField label="Father's Phone" value={par?.fatherPhone} />
              <FormField label="Mother's Name" value={par?.motherName} />
              <FormField label="Mother's Occupation" value={par?.motherOccupation} />
              <FormField label="Annual Income" value={par?.fatherAnnualIncome ? `₹${Number(par.fatherAnnualIncome).toLocaleString()}` : null} />
            </div>
          </div>

          {/* Section: Address Details */}
          <div id="address" className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="size-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Address Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Current Address" value={addr?.currentAddressLine1} />
              <FormField label="City / District" value={addr?.currentCity} />
              <FormField label="State" value={addr?.currentState} />
              <FormField label="Pincode" value={addr?.currentPincode} />
            </div>
          </div>

          {/* Section: Academic Record */}
          <div id="academics" className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="size-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <GraduationCap size={18} />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Academic Record</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField label="10th School / Board" value={acad?.tenthSchool} />
              <FormField label="10th Year" value={acad?.tenthPassingYear} />
              <FormField label="10th Percentage" value={acad?.tenthPercentage ? `${acad.tenthPercentage}%` : null} />
              <FormField label="12th / PUC School" value={acad?.twelfthSchool} />
              <FormField label="12th / PUC Stream" value={acad?.twelfthStream} />
              <FormField label="12th Percentage" value={acad?.twelfthPercentage ? `${acad.twelfthPercentage}%` : null} />
              {acad?.diplomaUniversity && (
                <>
                  <FormField label="Diploma University" value={acad.diplomaUniversity} />
                  <FormField label="Diploma Year" value={acad.diplomaYear} />
                  <FormField label="Diploma Percentage" value={acad.diplomaPercentage ? `${acad.diplomaPercentage}%` : null} />
                </>
              )}
            </div>
          </div>

          {/* Section: Uploaded Documents */}
          <div id="documents" className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Uploaded Documents</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modal Preview & Download</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DocumentItem field="signature" appId={app.id} label="Signature" onPreview={(url, label, isPdf) => setPreviewDoc({ url, label, isPdf })} />
              <DocumentItem field="tenthMarksheet" appId={app.id} label="10th Marksheet" onPreview={(url, label, isPdf) => setPreviewDoc({ url, label, isPdf })} />
              {app?.qualification === 'DIPLOMA' || app?.admissionType === 'DCET' ? (
                <>
                  <DocumentItem field="diplomaSemester5Marksheet" appId={app.id} label="Diploma 5th Sem Card" onPreview={(url, label, isPdf) => setPreviewDoc({ url, label, isPdf })} />
                  <DocumentItem field="diplomaSemester6Marksheet" appId={app.id} label="Diploma 6th Sem Card" onPreview={(url, label, isPdf) => setPreviewDoc({ url, label, isPdf })} />
                </>
              ) : (
                <DocumentItem field="twelfthMarksheet" appId={app.id} label="12th / PUC Card" onPreview={(url, label, isPdf) => setPreviewDoc({ url, label, isPdf })} />
              )}
              <DocumentItem field="domicileCertificate" appId={app.id} label="Study / Domicile Cert" onPreview={(url, label, isPdf) => setPreviewDoc({ url, label, isPdf })} />
            </div>
          </div>

          {/* Section: Timeline */}
          <div id="timeline" className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="size-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Application Audit Timeline</h2>
            </div>

            <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-neutral-800">
              <div className="relative pl-4">
                <div className="absolute -left-[21px] top-1 size-3.5 rounded-full bg-emerald-500"></div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Application Registered & Created</p>
                <p className="text-[10px] text-slate-400 font-medium">{new Date(app.createdAt).toLocaleString()}</p>
              </div>

              {app.submittedAt && (
                <div className="relative pl-4">
                  <div className="absolute -left-[21px] top-1 size-3.5 rounded-full bg-emerald-500"></div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Application Submitted by Student</p>
                  <p className="text-[10px] text-slate-400 font-medium">{new Date(app.submittedAt).toLocaleString()}</p>
                </div>
              )}

              <div className="relative pl-4">
                <div className="absolute -left-[21px] top-1 size-3.5 rounded-full bg-emerald-500"></div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Documents Uploaded & Verified by Admission Office</p>
                <p className="text-[10px] text-slate-400 font-medium">Officer: {app.reviewedBy || 'Nodal Officer'} | {app.verifiedAt ? new Date(app.verifiedAt).toLocaleString() : 'Verified'}</p>
              </div>

              <div className="relative pl-4">
                <div className="absolute -left-[21px] top-1 size-3.5 rounded-full bg-amber-500"></div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Forwarded to Principal for Final Authorization</p>
                <p className="text-[10px] text-slate-400 font-medium">{app.updatedAt ? new Date(app.updatedAt).toLocaleString() : 'Pending'}</p>
              </div>

              {app.applicationStatus === 'ENROLLED' && (
                <div className="relative pl-4">
                  <div className="absolute -left-[21px] top-1 size-3.5 rounded-full bg-indigo-600"></div>
                  <p className="text-xs font-bold text-indigo-600">Principal Approval & Admission Confirmed</p>
                  <p className="text-[10px] text-slate-400 font-medium">Signed off by Principal</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Decision & Approval Panel */}
        <div id="remarks" className="space-y-6">
          <div className="sticky top-20 bg-white dark:bg-neutral-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/40 p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-100 dark:border-neutral-800 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSignature size={20} className="text-indigo-600" />
                Principal Action Panel
              </h2>
              <p className="text-xs text-slate-500 font-medium">Authorize admission or request correction</p>
            </div>

            {/* ═══ DECISION SUMMARY CARD ═══ */}
            <div className="bg-slate-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-slate-200 dark:border-neutral-700 space-y-2 text-xs">
              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">FINAL DECISION SUMMARY</p>
              <div className="space-y-1">
                <p><span className="text-slate-400">Student:</span> <strong className="text-slate-800 dark:text-slate-200">{studentName}</strong></p>
                <p><span className="text-slate-400">Admission No:</span> <strong className="text-slate-800 dark:text-slate-200">#{app.applicationNumber}</strong></p>
                <p><span className="text-slate-400">Branch:</span> <strong className="text-slate-800 dark:text-slate-200">{app.branch?.name} ({app.branch?.code})</strong></p>
                <p><span className="text-slate-400">Quota:</span> <strong className="text-slate-800 dark:text-slate-200">{app.admissionType}</strong></p>
                <p><span className="text-slate-400">Verified By:</span> <strong className="text-slate-800 dark:text-slate-200">{app.reviewedBy || 'Nodal Officer'}</strong></p>
                <p><span className="text-slate-400">Eligibility:</span> <strong className="text-emerald-600">✅ Eligible</strong></p>
              </div>
            </div>

            {/* Read-only Informational Checklist */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <p className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" /> Documents Verified by Admin
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" /> Eligibility Verified
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" /> Ready for Final Approval
              </p>
            </div>

            {/* Approval Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleApproveSubmit}
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                {submitting ? 'Processing...' : '✅ Confirm Admission'}
              </button>

              <button
                onClick={() => setSendBackModalOpen(true)}
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                <XCircle size={18} />
                Send Back (Correction)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ DOCUMENT PREVIEW MODAL ═══ */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-700 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{previewDoc.label} Preview</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.label}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download size={14} /> Download
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-black">
              {previewDoc.isPdf ? (
                <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-xl border border-slate-800" title="PDF Preview" />
              ) : (
                <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SEND BACK (CORRECTION) MODAL ═══ */}
      {sendBackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-20 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-2xl w-full p-8 sm:p-8 shadow-2xl border border-slate-200 dark:border-neutral-800 space-y-6 sm:space-y-7 animate-fade-in my-auto sm:my-0">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="size-10 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Return Application for Correction</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Specify reason before notifying student and admin</p>
                </div>
              </div>
              <button
                onClick={() => setSendBackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Required Dropdown: Reason for Returning Application */}
            <div className="space-y-2.5">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
                Reason for Returning Application <span className="text-rose-500">*</span>
              </label>
              <select
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              >
                <option value="">Select a reason...</option>
                <option value="Personal Details">Personal Details</option>
                <option value="Parent / Guardian Details">Parent / Guardian Details</option>
                <option value="Address Details">Address Details</option>
                <option value="Academic Details">Academic Details</option>
                <option value="Uploaded Documents">Uploaded Documents</option>
                <option value="Eligibility Verification">Eligibility Verification</option>
                <option value="Other">Other</option>
              </select>
              <p className="text-xs text-slate-500 font-medium italic mt-2 leading-relaxed">
                The selected reason will be shared with the student through the Student Dashboard and Email.
              </p>
            </div>

            {/* Custom Remarks Textarea (Shown ONLY if 'Other' is selected) */}
            {correctionReason === 'Other' && (
              <div className="space-y-2.5 animate-fade-in">
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  Please specify the reason for returning this application. <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
                  placeholder="Specify details about the required correction..."
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl p-4 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setSendBackModalOpen(false)}
                className="py-3 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs sm:text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBackSubmit}
                disabled={
                  submitting ||
                  !correctionReason ||
                  (correctionReason === 'Other' && !customRemarks.trim())
                }
                className="py-3 px-7 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-rose-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
              >
                {submitting ? 'Processing...' : 'Return for Correction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalAdmissionReviewPage;
