import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    Clock,
    XCircle,
    FileText,
    Download,
    Eye,
    ArrowLeft,
    ShieldCheck,
    Calendar,
    Tag,
    GraduationCap,
    HelpCircle,
    ExternalLink,
    Search,
    AlertTriangle,
    Award
} from 'lucide-react';
import Step7Review from '../form-steps/Step7Review';
import ActivityTimeline from '../../../components/ActivityTimeline';
import StatusBadge from '../../../components/StatusBadge';

const SubmittedView = ({ statusData, fullDetails, onDownloadPDF }) => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('DASHBOARD');

    const getStatusConfig = (status) => {
        switch (status) {
            case 'SUBMITTED':
                return {
                    label: 'Application Submitted',
                    desc: 'Your application has been received and is waiting to be reviewed by the admissions team.',
                    icon: Clock,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    gradient: 'from-blue-600 to-indigo-600',
                    badgeBg: 'bg-blue-100 text-blue-700'
                };
            case 'UNDER_REVIEW':
                return {
                    label: 'Under Review',
                    desc: 'An admission officer is currently reviewing your application and verifying your details.',
                    icon: Search,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    gradient: 'from-amber-500 to-orange-500',
                    badgeBg: 'bg-amber-100 text-amber-700'
                };
            case 'DOCUMENT_VERIFIED':
                return {
                    label: 'Documents Verified',
                    desc: 'Your documents have been verified successfully. Your application is now awaiting final approval.',
                    icon: ShieldCheck,
                    color: 'text-teal-600',
                    bg: 'bg-teal-50',
                    border: 'border-teal-200',
                    gradient: 'from-teal-500 to-cyan-500',
                    badgeBg: 'bg-teal-100 text-teal-700'
                };
            case 'APPROVED':
            case 'ADMISSION_CONFIRMED':
                return {
                    label: 'Admission Confirmed',
                    desc: 'Congratulations! Your admission has been approved. Your College ID has been generated.',
                    icon: CheckCircle,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    gradient: 'from-emerald-500 to-green-500',
                    badgeBg: 'bg-emerald-100 text-emerald-700'
                };
            case 'REJECTED':
                return {
                    label: 'Application Rejected',
                    desc: 'Unfortunately, your application has not been approved. Please see the rejection reason below.',
                    icon: XCircle,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    gradient: 'from-red-500 to-rose-500',
                    badgeBg: 'bg-red-100 text-red-700'
                };
            case 'ENROLLED':
            case 'USN_ASSIGNED':
                return {
                    label: 'Admission Confirmed! 🎉 Congratulations',
                    desc: 'Your admission has been confirmed. Welcome to Jain College of Engineering & Research! Please carry a copy of your application when visiting the college.',
                    icon: Award,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50',
                    border: 'border-purple-200',
                    gradient: 'from-purple-600 to-indigo-600',
                    badgeBg: 'bg-purple-100 text-purple-700'
                };
            default:
                return {
                    label: 'Application Submitted',
                    desc: 'Your application is being processed.',
                    icon: Clock,
                    color: 'text-slate-600',
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    gradient: 'from-slate-500 to-slate-600',
                    badgeBg: 'bg-slate-100 text-slate-700'
                };
        }
    };

    const applicationStatus = statusData?.applicationStatus;
    const config = getStatusConfig(applicationStatus);
    const StatusIcon = config.icon;
    const timeline = statusData?.timeline || {};
    const isApproved = applicationStatus === 'ADMISSION_CONFIRMED' || applicationStatus === 'APPROVED' || applicationStatus === 'ENROLLED' || applicationStatus === 'USN_ASSIGNED';
    const isRejected = applicationStatus === 'REJECTED';

    if (viewMode === 'REVIEW') {
        return (
            <div className="space-y-6 animate-fade-in pb-12">
                <button
                    onClick={() => setViewMode('DASHBOARD')}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold transition-all"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <Step7Review readOnly={true} details={fullDetails} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8 animate-fade-in w-full max-w-full box-border px-3 sm:px-0">
            {/* ═══ TOP ACTIONS BAR ═══ */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'REVIEW' ? 'DASHBOARD' : 'DASHBOARD')}
                    className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 hover:text-primary-600 font-bold transition-all py-1"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onDownloadPDF}
                        className="btn-download-pdf px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-primary-700"
                    >
                        <Download size={14} />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* ═══ STATUS BANNER ═══ */}
            <div className={`relative overflow-hidden p-4 sm:p-8 rounded-2xl border-2 ${config.border} ${config.bg}`}>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className={`size-12 sm:size-16 rounded-2xl flex items-center justify-center shadow-lg ${config.bg} border-2 ${config.border} ${config.color} shrink-0`}>
                            <StatusIcon size={24} className="sm:hidden" />
                            <StatusIcon size={32} className="hidden sm:block" />
                        </div>
                        <div className="space-y-1 min-w-0">
                            <h2 className={`text-lg sm:text-2xl font-black ${config.color} tracking-tight leading-snug`}>
                                {config.label}
                            </h2>
                            <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed max-w-lg">
                                {config.desc}
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <StatusBadge status={applicationStatus} />
                    </div>
                </div>
            </div>

            {/* ═══ INFO GRID ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Tracking Info */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3 text-slate-400">
                        <Tag size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tracking Info</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Application ID</p>
                            <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight">#{statusData?.applicationNumber || statusData?.studentId}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Date Submitted</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                <Calendar size={14} className="text-slate-300 shrink-0" />
                                {timeline.submittedAt
                                    ? new Date(timeline.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Course Selection */}
                <div className="md:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3 text-slate-400">
                        <GraduationCap size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Selected Program</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Admission Type</p>
                            <p className="text-sm sm:text-lg font-black text-primary-900 uppercase">
                                {fullDetails?.admissionType || 'Regular'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Selected Branch</p>
                            <p className="text-sm sm:text-lg font-black text-primary-900 uppercase break-words">
                                {fullDetails?.branch?.name || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* College ID (if approved or assigned USN) */}
                    {(isApproved || applicationStatus === 'USN_ASSIGNED') && statusData?.tempCollegeId && (
                        <div className="bg-emerald-50 p-3.5 sm:p-4 rounded-xl border border-emerald-200 flex items-center justify-between mt-2">
                            <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">College ID</p>
                                <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-wider">{statusData.tempCollegeId}</p>
                            </div>
                            <CheckCircle size={24} className="text-emerald-500 shrink-0" />
                        </div>
                    )}

                    {/* VTU USN (major success milestone) */}
                    {statusData?.vtuUsn && (
                        <div className="bg-purple-50 p-3.5 sm:p-4 rounded-xl border border-purple-200 flex items-center justify-between mt-3">
                            <div>
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">VTU USN</p>
                                <p className="text-xl sm:text-2xl font-black text-purple-700 font-mono tracking-wider">{statusData.vtuUsn}</p>
                            </div>
                            <Award size={24} className="text-purple-500 shrink-0" />
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ REJECTION REASON (if rejected) ═══ */}
            {isRejected && (statusData?.rejectionReason || statusData?.adminRemarks) && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-sm font-bold text-red-900">Correction / Rejection Reason</h3>
                            <p className="text-[11px] text-red-500">From Admissions Office</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-red-100 p-3.5">
                        <p className="text-xs sm:text-sm text-red-800 leading-relaxed font-medium italic whitespace-pre-line">
                            {(() => {
                                const isOther = statusData.rejectionReasonCode === 'OTHER' || statusData.rejectionReason === 'Other' || statusData.rejectionReason === 'OTHER';
                                if (isOther) {
                                    return statusData.adminRemarks || statusData.rejectionReason || 'Other';
                                }
                                return statusData.rejectionReason || statusData.adminRemarks || '';
                            })()}
                        </p>
                    </div>
                    <p className="text-[11px] text-red-500 font-medium">
                        Please contact the admissions office for further guidance or clarification.
                    </p>
                </div>
            )}

            {/* ═══ ACTIVITY TIMELINE ═══ */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 text-slate-400 border-b border-slate-100 pb-3 sm:pb-4">
                    <Award size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Application Progress</span>
                </div>
                <ActivityTimeline timeline={timeline} />
            </div>

            {/* ═══ CARRY APPLICATION NOTICE (shown on admission confirmed) ═══ */}
            {isApproved && (
                <div className="flex items-start gap-3 sm:gap-4 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="space-y-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-amber-900 tracking-tight">📋 Important: Carry Your Application Copy</h4>
                        <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">
                            Please carry a printed copy of this admission application when you visit the college for document verification and enrollment formalities.
                        </p>
                    </div>
                </div>
            )}

            {/* ═══ QUICK ACTIONS ═══ */}
            <div className={`bg-gradient-to-br ${config.gradient} p-5 sm:p-10 rounded-2xl sm:rounded-[2rem] text-white shadow-2xl relative overflow-hidden group border border-white/5`}>
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -ml-32 -mb-24"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                    <div className="space-y-2 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/80">
                            <ShieldCheck size= {12} />
                            Secured Application
                        </div>
                        <h3 className="text-xl sm:text-3xl font-black tracking-tight leading-none">
                            {isApproved ? 'Welcome Aboard!' : isRejected ? 'What\'s Next?' : 'Next Steps'}
                        </h3>
                        <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-sm font-medium">
                            {isApproved
                                ? 'Download your confirmed admission application as a PDF and carry it when visiting the college.'
                                : isRejected
                                    ? 'Contact the admissions office for clarification or guidance on reapplication.'
                                    : 'Your application is being processed. Keep a copy of your acknowledgment for verification.'
                            }
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => setViewMode('REVIEW')}
                            className="w-full sm:w-auto h-12 sm:h-14 px-6 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all"
                        >
                            <Eye size={18} />
                            View Application
                        </button>
                        {(isApproved || !isRejected) && (
                            <button
                                type="button"
                                onClick={onDownloadPDF}
                                className="btn-download-pdf w-full sm:w-auto h-12 sm:h-14 px-6 bg-white text-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-2xl transition-all"
                            >
                                <Download size={18} />
                                {isApproved ? 'Download Confirmed Admission' : 'Download PDF'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ HELP CARD ═══ */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
                    <div className="size-10 sm:size-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary-600 shadow-inner shrink-0">
                        <HelpCircle size={20} />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Application Support</h4>
                        <p className="text-xs text-slate-500 font-medium">Contact the nodal office for any discrepancies.</p>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={() => navigate('/admission/support')}
                    className="h-10 sm:h-12 px-5 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap transition-all w-full sm:w-auto justify-center"
                >
                    Contact Admissions
                    <ExternalLink size={14} />
                </button>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="text-center pt-6 pb-4 border-t border-slate-200 text-xs text-slate-400">
                © {new Date().getFullYear()} University Admission Cell. All rights reserved.
            </div>
        </div>
    );
};

export default SubmittedView;
