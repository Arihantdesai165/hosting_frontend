import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAcademicYear } from '../../../../../utils/date.util';
import {
    User,
    GraduationCap,
    HelpCircle,
    Users,
    Upload,
    FileText as FileDigit,
    Send,
    Loader2,
    Activity,
    LifeBuoy,
    Calendar,
    FileText,
    CreditCard,
    Download,
    CheckCircle,
    PlayCircle,
    Lock,
    ArrowRight,
    Sparkles,
    Eye,
    Clock,
    Search,
    ShieldCheck,
    XCircle,
    AlertTriangle,
    Award,
    RefreshCw
} from 'lucide-react';
import api from '../../../../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import useApplicationStatus from '../../hooks/useApplicationStatus';
import StatusBadge from '../../components/StatusBadge';
import ActivityTimeline from '../../components/ActivityTimeline';
import Skeleton, { CardSkeleton } from '../../components/Skeleton';

const StudentDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [sysConfig, setSysConfig] = useState(null);
    const {
        stepStatus,
        loading,
        getStepState,
        isStepAccessible,
        refetch
    } = useApplicationStatus();

    useEffect(() => {
        api.get('/system/config')
            .then(res => {
                if (res.data?.success && res.data?.data) {
                    setSysConfig(res.data.data);
                }
            })
            .catch(() => {});
    }, []);

    if (loading) {
        return (
            <div className="space-y-10 pb-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2 w-1/2">
                        <Skeleton width="40%" height="28px" />
                        <Skeleton width="80%" height="16px" className="mt-2" />
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-w-[300px] flex gap-5 items-center">
                        <div className="flex-grow space-y-2">
                            <Skeleton width="50%" height="10px" />
                            <Skeleton width="100%" height="10px" className="mt-1" />
                        </div>
                        <Skeleton width="48px" height="48px" circle />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(7)].map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    const completedCount = stepStatus?.completedCount || 0;
    const totalSteps = stepStatus?.totalSteps || 7;
    const progressPercent = stepStatus?.progressPercent || 0;
    const applicationStatus = stepStatus?.applicationStatus;
    const isSubmitted = applicationStatus && applicationStatus !== 'DRAFT' && applicationStatus !== 'CORRECTION_REQUIRED';
    const timeline = stepStatus?.timeline || {};

    const closingDateIso = sysConfig?.admissionClosingDate;
    const isClosed = false; // Force false to keep admissions open for tomorrow's testing

    const computeFeeStatusText = (status, data) => {
        if (data?.applicationFeeStatus) return data.applicationFeeStatus;
        if (status === 'CANCELLED') return 'Refund Completed';
        if (status === 'CANCELLATION_REQUESTED') return 'Refund Initiated';
        if (status === 'FEE_VERIFIED' || status === 'ENROLLED' || status === 'USN_ASSIGNED' || data?.feesVerified) return 'Paid';
        if (status === 'FEE_RECEIPT_UPLOADED' || data?.admissionFeeReceiptUrl) return 'Payment Verification Pending';
        if (data?.admissionType === 'MANAGEMENT') return 'Not Applicable';
        return 'Pending Payment';
    };

    const feeStatusText = computeFeeStatusText(applicationStatus, stepStatus);

    // ═══════ SUBMITTED STATUS DASHBOARD ═══════
    if (isSubmitted) {
        return <SubmittedDashboard
            stepStatus={stepStatus}
            applicationStatus={applicationStatus}
            timeline={timeline}
            navigate={navigate}
            refetch={refetch}
            closingDateIso={closingDateIso}
            feeStatusText={feeStatusText}
            isClosed={isClosed}
        />;
    }

    // ═══════ FORM STEPS DASHBOARD ═══════
    const steps = [
        {
            id: 1, key: 'admission', title: "Admission Details",
            subtitle: "Select admission type and preferred branch.",
            icon: GraduationCap, targetStep: 1,
        },
        {
            id: 2, key: 'personalDetails', title: "Personal Details",
            subtitle: "Basic contact info and personal identification.",
            icon: User, targetStep: 2,
        },
        {
            id: 3, key: 'parentDetails', title: "Parent Details",
            subtitle: "Parent/Guardian identification and occupation.",
            icon: Users, targetStep: 3,
        },
        {
            id: 4, key: 'addressDetails', title: "Address Details",
            subtitle: "Permanent and correspondence addresses.",
            icon: HelpCircle, targetStep: 4,
        },
        {
            id: 5, key: 'academicDetails', title: "Academic Details",
            subtitle: "High school records and standardized test scores.",
            icon: GraduationCap, targetStep: 5,
        },
        {
            id: 6, key: 'documents', title: "Document Upload",
            subtitle: "Digital copies of certificates and ID proof.",
            icon: Upload, targetStep: 6,
        },
        {
            id: 7, key: 'review', title: "Review & Submit",
            subtitle: "Verify all information before final submission.",
            icon: Send, targetStep: 7,
        }
    ];

    const handleStepClick = (step) => {
        const state = getStepState(step.id);

        if (state === 'LOCKED') {
            toast.error("Complete the previous steps first to unlock this step.");
            return;
        }

        localStorage.setItem('admission_form_step', step.targetStep.toString());
        navigate(`/admission/application?step=${step.targetStep}`);
    };

    return (
        <div className="animate-fade-in space-y-6 sm:space-y-10 pb-8 sm:pb-16">
            {applicationStatus === 'CORRECTION_REQUIRED' && (
                <div className="bg-rose-50 border-2 border-rose-350 p-6 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-4 animate-fade-in shadow-md shadow-rose-250/10 no-print">
                    <div className="flex items-start gap-4">
                        <div className="size-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="space-y-1.5">
                            <h2 className="text-lg font-black text-rose-950 uppercase tracking-wide">🔴 Action Required: Correction Needed</h2>
                            <p className="text-xs text-rose-800 leading-relaxed font-semibold">
                                Your application has been returned by the administrator for correction. Please correct the highlighted sections in red and resubmit.
                            </p>
                            {stepStatus?.adminRemarks && (
                                <div className="mt-2 bg-white rounded-lg p-3.5 border border-rose-100/80 shadow-sm">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Administrative Remarks:</span>
                                    <p className="text-xs font-semibold text-slate-755 whitespace-pre-wrap leading-normal">{stepStatus.adminRemarks}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Welcome & Overall Progress */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Application Dashboard</h1>
                    <p className="text-slate-500 max-w-xl">Complete the following steps to submit your application for the {stepStatus?.academicYear || getAcademicYear()} Academic Year.</p>
                </div>

                {/* Progress Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-w-[300px]">
                    <div className="flex items-center gap-5">
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Overall Progress</span>
                                <span className="text-xs font-bold text-slate-900">{completedCount}/{totalSteps} steps</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${progressPercent}%`,
                                        background: progressPercent === 100
                                            ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                                            : 'linear-gradient(90deg, #1241a1, #3b82f6)'
                                    }}
                                ></div>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                                {progressPercent === 100 ? '🎉 All steps completed!' : `${progressPercent}% completed`}
                            </p>
                        </div>
                        <div className={`size-12 flex items-center justify-center rounded-full transition-all duration-500 ${
                            progressPercent === 100
                                ? 'bg-green-100 text-green-600'
                                : 'bg-primary-600/10 text-primary-600'
                        }`}>
                            {progressPercent === 100 ? <CheckCircle size={24} /> : <Activity size={24} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {steps.map((step, index) => {
                    const state = getStepState(step.id);
                    const isCompleted = state === 'COMPLETED';
                    const isActive = state === 'ACTIVE';
                    const isLocked = state === 'LOCKED';
                    const isCorrectionRequired = state === 'CORRECTION_REQUIRED';

                    return (
                        <div
                            key={step.id}
                            onClick={() => handleStepClick(step)}
                            className={`
                                step-card group relative flex flex-col bg-white rounded-xl p-4 sm:p-6 transition-all duration-500
                                ${isCorrectionRequired
                                    ? 'border-2 border-red-500 shadow-lg shadow-red-500/10'
                                    : isActive
                                    ? 'border-2 border-primary-600 shadow-lg shadow-primary-600/10 -translate-y-1 step-active-glow'
                                    : 'border-2 border-slate-100'}
                                ${isCompleted
                                    ? 'border-green-400 shadow-lg shadow-green-500/5'
                                    : ''}
                                ${isLocked
                                    ? 'opacity-50 cursor-not-allowed bg-slate-50/80 border-slate-200 grayscale-[20%]'
                                    : 'cursor-pointer hover:-translate-y-1.5 hover:shadow-xl'}
                            `}
                            style={{ animationDelay: `${index * 60}ms` }}
                        >


                            {isCompleted && (
                                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-xl">
                                    <div className="absolute top-2 -right-3 bg-green-500 text-white text-[8px] font-bold px-5 py-0.5 rotate-45 shadow-sm">
                                        ✓ DONE
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-5">
                                <div className={`
                                    size-12 rounded-xl flex items-center justify-center transition-all duration-500
                                    ${isCompleted ? 'bg-green-100 text-green-600 shadow-sm' : ''}
                                    ${isCorrectionRequired ? 'bg-red-100 text-red-600 shadow-sm' : ''}
                                    ${isActive ? 'bg-primary-600/10 text-primary-600 shadow-sm' : ''}
                                    ${isLocked ? 'bg-slate-100 text-slate-300' : ''}
                                `}>
                                    {step.icon && <step.icon size={24} />}
                                </div>

                                <div className={`
                                    text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 transition-all duration-500
                                    ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                                    ${isCorrectionRequired ? 'bg-red-100 text-red-700 border border-red-200' : ''}
                                    ${isActive ? 'bg-primary-50 text-primary-700' : ''}
                                    ${isLocked ? 'bg-slate-100 text-slate-400' : ''}
                                `}>
                                    {isCompleted ? (
                                        <><CheckCircle size={12} /> Completed</>
                                    ) : isCorrectionRequired ? (
                                        <><AlertTriangle size={12} /> Correction Required</>
                                    ) : isActive ? (
                                        <><PlayCircle size={12} /> In Progress</>
                                    ) : (
                                        <><Lock size={12} /> Locked</>
                                    )}
                                </div>
                            </div>

                            <h3 className={`text-lg font-bold mb-1 transition-colors duration-300 ${isLocked ? 'text-slate-300' : 'text-slate-900'}`}>
                                {step.id}. {step.title}
                            </h3>
                            <p className={`text-sm mb-6 leading-relaxed transition-colors duration-300 ${isLocked ? 'text-slate-300' : 'text-slate-500'}`}>
                                {step.subtitle}
                            </p>

                            <div className="mt-auto">
                                {isLocked ? (
                                    <div className="flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-slate-300">
                                        <Lock size={12} />
                                        <span>Complete previous step to unlock</span>
                                    </div>
                                ) : (
                                    <button className={`
                                        w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-sm transition-all duration-300 min-h-[48px]
                                        ${isCompleted
                                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg'
                                            : isCorrectionRequired
                                            ? 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-md shadow-red-600/20 hover:shadow-lg cursor-pointer rounded-[10px]'
                                            : 'bg-primary-600 text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 hover:shadow-lg rounded-lg'
                                        }
                                    `}>
                                        {isCompleted ? (
                                            <>
                                                View
                                                <ArrowRight size={16} />
                                            </>
                                        ) : isCorrectionRequired ? (
                                            '✏️ Edit & Correct'
                                        ) : (
                                            <>
                                                Continue Application
                                                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Help Card */}
                <div className="group relative flex flex-col bg-primary-600/5 rounded-xl border border-primary-600/20 p-4 sm:p-6">
                    <div className="size-12 rounded-xl bg-primary-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-primary-600/20">
                        <LifeBuoy size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Need Help?</h3>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">Our admission officers are here to assist you with the process.</p>
                    <button 
                        onClick={() => navigate('/admission/support')}
                        className="mt-auto py-2.5 px-4 w-full sm:w-auto min-h-[48px] sm:min-h-[38px] rounded-lg border border-primary-600 text-primary-600 font-semibold text-sm hover:bg-primary-600 hover:text-white transition-all duration-300 flex items-center justify-center"
                    >
                        Contact Support
                    </button>
                </div>
            </div>

            {/* Dynamic Footer */}
            <DashboardFooterInfo closingDateIso={closingDateIso} feeStatusText={feeStatusText} isClosed={isClosed} />
        </div>
    );
};

// ═══════════════════════════════════════════════
//  DYNAMIC DASHBOARD FOOTER INFO COMPONENT
// ═══════════════════════════════════════════════
const DashboardFooterInfo = ({ closingDateIso, feeStatusText, isClosed }) => {
    const handleHandbookDownload = () => {
        window.open(`${import.meta.env.VITE_API_URL || ''}/public/handbook`, '_blank');
    };

    const formattedClosing = () => {
        if (isClosed) {
            return (
                <span className="text-rose-600 font-black flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full bg-rose-600 animate-pulse" />
                    Admissions Closed
                </span>
            );
        }
        if (!closingDateIso) return '31 Aug 2026 • 11:59 PM';
        const d = new Date(closingDateIso);
        if (isNaN(d.getTime())) return '31 Aug 2026 • 11:59 PM';
        const formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${formattedDate} • ${formattedTime}`;
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            {/* 1. ADMISSION STATUS (Forced Open) */}
            <div className="flex items-center gap-4 group">
                <div className="p-3 rounded-full group-hover:scale-110 transition-transform bg-emerald-100 text-emerald-600">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Status
                    </p>
                    <p className="text-base font-bold text-emerald-600 flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                        🟢 Admissions Open
                    </p>
                </div>
            </div>

            {/* 2. ADMISSION HANDBOOK */}
            <div className="flex items-center gap-4 group">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admission Handbook</p>
                    <button
                        type="button"
                        onClick={handleHandbookDownload}
                        className="text-base font-bold text-primary-600 hover:underline flex items-center gap-1.5 text-left cursor-pointer"
                    >
                        Download Handbook <Download size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════
//  SUBMITTED STATUS DASHBOARD (Inner Component)
// ═══════════════════════════════════════════════

const SubmittedDashboard = ({ stepStatus, applicationStatus, timeline, navigate, refetch, closingDateIso, feeStatusText, isClosed }) => {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelRemarks, setCancelRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload a PDF, JPG, or PNG file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds 5MB limit.');
            return;
        }

        setSelectedFile(file);
    };

    const handleUploadReceipt = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        setUploadProgress(20);

        try {
            const formData = new FormData();
            formData.append('admissionFeeReceipt', selectedFile);

            setUploadProgress(60);
            const res = await api.post('/student/upload-fee-receipt', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setUploadProgress(100);
            if (res.data.success) {
                toast.success('Fee receipt uploaded successfully! Admin has been notified.');
                setSelectedFile(null);
                if (refetch) refetch();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to upload fee receipt.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleCancelSubmit = async () => {
        if (!cancelReason) return;
        setIsSubmitting(true);
        try {
            const res = await api.post('/student/cancellation-request', { reason: cancelReason, remarks: cancelRemarks });
            if (res.data.success) {
                toast.success('Admission cancellation request submitted successfully');
                setShowCancelModal(false);
                setCancelReason('');
                setCancelRemarks('');
                if (refetch) refetch();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to submit cancellation request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusMeta = (status) => {
        switch (status) {
            case 'SUBMITTED':
                return { label: 'Application Submitted', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Your application is being reviewed by the admissions team.' };
            case 'RESUBMITTED':
                return { label: 'Corrections Resubmitted', icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Corrections Submitted - Waiting for Admin Verification.' };
            case 'UNDER_REVIEW':
                return { label: 'Under Review', icon: Search, color: 'text-amber-600', bg: 'bg-amber-100', desc: 'An administrator is currently reviewing your application.' };
            case 'DOCUMENT_VERIFIED':
                return { label: 'Documents Verified', icon: ShieldCheck, color: 'text-teal-600', bg: 'bg-teal-100', desc: 'Your documents have been verified.' };
            case 'APPROVED':
                return { label: 'Admission Approved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', desc: 'Your application has been approved! Awaiting final confirmation and USN allocation.' };
            case 'ADMISSION_CONFIRMED':
            case 'ENROLLED':
            case 'USN_ASSIGNED':
                return { label: '🎉 Admission Confirmed', icon: Award, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Congratulations! Your admission has been officially confirmed by the Principal of Jain College of Engineering & Research.' };
            case 'REJECTED':
                return { label: 'Application Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', desc: 'Your application has been permanently rejected by the Admissions Committee / Principal.' };
            case 'CANCELLATION_REQUESTED':
                return { label: 'Cancellation Requested', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', desc: 'Your request for admission cancellation is under review.' };
            case 'CANCELLED':
                return { label: 'Admission Cancelled', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', desc: 'Your admission has been cancelled.' };
            default:
                return { label: 'Processing', icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100', desc: 'Your application is being processed.' };
        }
    };

    const meta = getStatusMeta(applicationStatus);
    const StatusIcon = meta.icon;
    const isApproved = applicationStatus === 'ADMISSION_CONFIRMED' || applicationStatus === 'APPROVED' || applicationStatus === 'ENROLLED' || applicationStatus === 'USN_ASSIGNED';
    const isRejected = applicationStatus === 'REJECTED';
    const isCancelled = applicationStatus === 'CANCELLED';

    return (
        <div className="animate-fade-in space-y-8 pb-16 max-w-4xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Application Status</h1>
                <p className="text-slate-500">Track the progress of your admission application in real-time.</p>
            </div>

            {/* Status Hero Card */}
            <div className={`relative overflow-hidden p-8 rounded-2xl border-2 ${
                isRejected || isCancelled ? 'border-red-200 bg-red-50' :
                isApproved ? 'border-emerald-200 bg-emerald-50' :
                'border-slate-200 bg-white'
            }`}>
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className={`size-20 rounded-2xl ${meta.bg} ${meta.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <StatusIcon size={40} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                            <h2 className={`text-2xl font-black ${meta.color} tracking-tight`}>{meta.label}</h2>
                            <StatusBadge status={applicationStatus} />
                        </div>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-lg">{meta.desc}</p>
                        <p className="text-xs text-slate-400">
                            Admission Number: <span className="font-bold text-slate-700">{stepStatus?.applicationNumber || stepStatus?.studentId}</span>
                        </p>
                    </div>
                </div>

                {/* College ID for approved */}
                {isApproved && stepStatus?.tempCollegeId && (
                    <div className="mt-6 bg-emerald-100 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Your College ID</p>
                            <p className="text-3xl font-black text-emerald-700 font-mono tracking-wider mt-1">{stepStatus.tempCollegeId}</p>
                        </div>
                        <CheckCircle size={36} className="text-emerald-400" />
                    </div>
                )}
            </div>



            {/* Correction / Rejection Reason */}
            {isRejected && (stepStatus?.rejectionReason || stepStatus?.adminRemarks) && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle size={20} className="text-red-600" />
                        <h3 className="text-sm font-bold text-red-900">Correction / Rejection Reason</h3>
                    </div>
                    <div className="bg-white rounded-xl border border-red-100 p-4">
                        <p className="text-sm text-red-800 leading-relaxed font-medium italic whitespace-pre-line">
                            {(() => {
                                const isOther = stepStatus.rejectionReasonCode === 'OTHER' || stepStatus.rejectionReason === 'Other' || stepStatus.rejectionReason === 'OTHER';
                                if (isOther) {
                                    return stepStatus.adminRemarks || stepStatus.rejectionReason || 'Other';
                                }
                                return stepStatus.rejectionReason || stepStatus.adminRemarks || '';
                            })()}
                        </p>
                    </div>
                </div>
            )}

            {/* Timeline + Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Timeline */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-400 border-b border-slate-100 pb-4 mb-5">
                        <Award size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Application Progress</span>
                    </div>
                    <ActivityTimeline timeline={timeline} />
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-2 space-y-4">
                    {isCancelled ? (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4 text-slate-900">
                            <div className="flex items-center gap-3 border-b border-red-100 pb-3">
                                <XCircle className="text-red-650" size={20} />
                                <h3 className="text-sm font-bold text-red-950 uppercase tracking-wide">Cancellation Details</h3>
                            </div>
                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Cancellation Date</p>
                                    <p className="font-bold text-red-800 mt-1">
                                        {stepStatus?.cancellationApprovedAt 
                                            ? new Date(stepStatus.cancellationApprovedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                            : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Reason</p>
                                    <p className="font-bold text-red-800 mt-1">{stepStatus?.cancellationReason || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Cancelled By</p>
                                    <p className="font-bold text-red-800 mt-1">Administrator</p>
                                </div>
                                {stepStatus?.cancellationRemarks && (
                                    <div>
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Student Remarks</p>
                                        <p className="font-bold text-red-800 mt-1 italic">"{stepStatus.cancellationRemarks}"</p>
                                    </div>
                                )}
                                {stepStatus?.cancellationAdminRemarks && (
                                    <div>
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Admin Remarks</p>
                                        <p className="font-bold text-red-800 mt-1 italic">"{stepStatus.cancellationAdminRemarks}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/admission/application')}
                                className="w-full bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg hover:border-primary-200 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                    <Eye size={22} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 text-sm">View Application</p>
                                    <p className="text-xs text-slate-400">Review your submitted details</p>
                                </div>
                                <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors" />
                            </button>

                            {applicationStatus === 'ENROLLED' && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="w-full bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg hover:border-red-300 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-650 group-hover:text-white transition-colors">
                                        <XCircle size={22} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-red-900 text-sm">Request Admission Cancellation</p>
                                        <p className="text-xs text-red-500">Submit a request to cancel your admission</p>
                                    </div>
                                    <ArrowRight size={16} className="ml-auto text-red-300 group-hover:text-red-600 transition-colors" />
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => navigate('/admission/support')}
                                className="w-full bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg hover:border-primary-200 transition-all group text-left cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                    <LifeBuoy size={22} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 text-sm">Need Help?</p>
                                    <p className="text-xs text-slate-400">Contact admissions office</p>
                                </div>
                                <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Dynamic Footer */}
            <DashboardFooterInfo closingDateIso={closingDateIso} feeStatusText={feeStatusText} isClosed={isClosed} />

            {/* Cancellation Request Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-6 shadow-2xl animate-fade-in">
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900">Request Admission Cancellation</h3>
                            <p className="text-xs text-slate-500">Please provide the reason for cancelling your admission. This request will be reviewed by the administration.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reason for Cancellation <span className="text-red-500">*</span></label>
                                <select
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
                                >
                                    <option value="">Select a reason</option>
                                    <option value="Joined Another College">Joined Another College</option>
                                    <option value="Financial Reasons">Financial Reasons</option>
                                    <option value="Personal Reasons">Personal Reasons</option>
                                    <option value="Wrong Course Selected">Wrong Course Selected</option>
                                    <option value="Relocation">Relocation</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Remarks / Additional Details</label>
                                <textarea
                                    value={cancelRemarks}
                                    onChange={(e) => setCancelRemarks(e.target.value)}
                                    rows={4}
                                    placeholder="Provide any additional comments here..."
                                    className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                    setCancelRemarks('');
                                }}
                                disabled={isSubmitting}
                                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCancelSubmit}
                                disabled={isSubmitting || !cancelReason}
                                className="px-4 py-2 bg-red-650 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-red-600/10 flex items-center gap-1.5"
                            >
                                {isSubmitting ? (
                                    <>Submitting...</>
                                ) : (
                                    <>Submit Request</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
