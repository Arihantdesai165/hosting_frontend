import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../../services/api';
import {
    ChevronLeft, Loader2, CheckCircle2, XCircle, Clock, User,
    Users, MapPin, GraduationCap, FileText, Phone, Mail,
    AlertCircle, ThumbsUp, ThumbsDown, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
    REGISTERED: 'bg-slate-100 text-slate-700 border-slate-200',
    SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
    UNDER_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    ENROLLED: 'bg-purple-100 text-purple-700 border-purple-200',
};

const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
            <Icon size={18} className="text-primary-600" />
            <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const Field = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value || <span className="text-slate-300 italic">Not provided</span>}</p>
    </div>
);

const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const fetchApplication = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/admissions/${id}`);
            if (res.data.success) {
                setApplication(res.data.data);
                setRemarks(res.data.data.adminRemarks || '');
            }
        } catch (err) {
            toast.error('Failed to load application');
            navigate('/admin/students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchApplication(); }, [id]);

    const updateStatus = async (status) => {
        if (status === 'REJECTED' && !remarks.trim()) {
            toast.error('Please provide rejection remarks before rejecting.');
            return;
        }
        setUpdating(true);
        try {
            const res = await api.put(`/admin/admissions/${id}/status`, { status, remarks });
            if (res.data.success) {
                toast.success(`Application ${status.toLowerCase()} successfully!`);
                fetchApplication();
                setShowRejectDialog(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 size={36} className="animate-spin text-primary-600" />
            </div>
        );
    }

    if (!application) return null;

    const pd = application.studentpersonaldetails;
    const par = application.studentparentdetails;
    const addr = application.studentaddress;
    const acad = application.studentacademicdetails;
    const docs = application.studentdocuments;
    const status = application.applicationStatus;

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/students')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition">
                    <ChevronLeft size={18} /> Back to List
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src={application.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                            alt="avatar"
                            className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                {application.user?.firstName} {application.user?.lastName}
                            </h1>
                            <p className="text-slate-500 text-sm">{application.user?.email}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                    {application.applicationNumber}
                                </span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[status]}`}>
                                    {status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {(status === 'SUBMITTED' || status === 'UNDER_REVIEW') && (
                        <div className="flex flex-col sm:flex-row gap-2">
                            {status === 'SUBMITTED' && (
                                <button
                                    onClick={() => updateStatus('UNDER_REVIEW')}
                                    disabled={updating}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-lg text-sm transition"
                                >
                                    <Eye size={16} /> Mark Under Review
                                </button>
                            )}
                            <button
                                onClick={() => updateStatus('APPROVED')}
                                disabled={updating}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition"
                            >
                                <ThumbsUp size={16} /> Approve
                            </button>
                            <button
                                onClick={() => setShowRejectDialog(true)}
                                disabled={updating}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition"
                            >
                                <ThumbsDown size={16} /> Reject
                            </button>
                        </div>
                    )}
                    {(status === 'APPROVED' || status === 'ENROLLED') && (
                        <span className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                            <CheckCircle2 size={18} /> Enrolled
                        </span>
                    )}
                    {status === 'REJECTED' && (
                        <span className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                            <XCircle size={18} /> Rejected
                        </span>
                    )}
                </div>

                {application.adminRemarks && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Admin Remarks</p>
                        <p className="text-sm text-amber-800">{application.adminRemarks}</p>
                    </div>
                )}
            </div>

            {/* Reject Dialog */}
            {showRejectDialog && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <AlertCircle size={18} /> Rejection Remarks Required
                    </h3>
                    <textarea
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Explain reason for rejection (will be shown to student)..."
                        className="w-full px-4 py-3 bg-white border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
                    />
                    <div className="flex gap-3 mt-3">
                        <button
                            onClick={() => updateStatus('REJECTED')}
                            disabled={updating || !remarks.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition"
                        >
                            {updating ? <Loader2 size={15} className="animate-spin" /> : <ThumbsDown size={15} />}
                            Confirm Reject
                        </button>
                        <button onClick={() => setShowRejectDialog(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Application Details */}
            <Section title="Admission Details" icon={GraduationCap}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    <Field label="Admission Type" value={application.admissionType} />
                    <Field label="Branch" value={application.branch ? `${application.branch.name} (${application.branch.code})` : null} />
                    <Field label="Aadhaar" value={application.aadhaar ? `XXXX XXXX ${application.aadhaar.slice(-4)}` : null} />
                    {application.cetNumber && <Field label="CET Number" value={application.cetNumber} />}
                    {application.dcetNumber && <Field label="DCET Number" value={application.dcetNumber} />}
                    <Field label="Submitted On" value={application.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-IN') : null} />
                </div>
            </Section>

            {pd && (
                <Section title="Personal Details" icon={User}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                        <Field label="Full Name" value={`${pd.firstName} ${pd.middleName || ''} ${pd.lastName}`} />
                        <Field label="Date of Birth" value={pd.dateOfBirth} />
                        <Field label="Gender" value={pd.gender} />
                        <Field label="Category" value={pd.category} />
                        <Field label="Religion" value={pd.religion} />
                        <Field label="Nationality" value={pd.nationality} />
                        <Field label="Phone" value={pd.phone} />
                        <Field label="Email" value={pd.email} />
                    </div>
                </Section>
            )}

            {par && (
                <Section title="Parent / Guardian Details" icon={Users}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                        <Field label="Father's Name" value={par.fatherName} />
                        <Field label="Father's Phone" value={par.fatherPhone} />
                        <Field label="Father's Occupation" value={par.fatherOccupation} />
                        <Field label="Annual Income" value={par.fatherAnnualIncome ? `₹${parseInt(par.fatherAnnualIncome).toLocaleString('en-IN')}` : null} />
                        <Field label="Mother's Name" value={par.motherName} />
                        <Field label="Mother's Phone" value={par.motherPhone} />
                    </div>
                </Section>
            )}

            {addr && (
                <Section title="Address" icon={MapPin}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Current Address</p>
                            <p className="text-sm text-slate-700">
                                {[addr.currentAddressLine1, addr.currentAddressLine2, addr.currentCity, addr.currentState, addr.currentPincode]
                                    .filter(Boolean).join(', ')}
                            </p>
                        </div>
                        {!addr.sameAsCurrent && (
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Permanent Address</p>
                                <p className="text-sm text-slate-700">
                                    {[addr.permanentAddressLine1, addr.permanentCity, addr.permanentState, addr.permanentPincode]
                                        .filter(Boolean).join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                </Section>
            )}

            {acad && (
                <Section title="Academic History" icon={GraduationCap}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                        <Field label="10th School" value={acad.tenthSchool} />
                        <Field label="10th Board" value={acad.tenthBoard} />
                        <Field label="10th Percentage" value={acad.tenthPercentage ? `${acad.tenthPercentage}%` : null} />
                        <Field label="12th School" value={acad.twelfthSchool} />
                        <Field label="12th Board" value={acad.twelfthBoard} />
                        <Field label="12th Percentage" value={acad.twelfthPercentage ? `${acad.twelfthPercentage}%` : null} />
                        <Field label="CET Score" value={acad.cetScore} />
                        <Field label="CET Rank" value={acad.cetRank} />
                        <Field label="Gap Year" value={acad.hasGap ? `Yes – ${acad.gapReason}` : 'No'} />
                    </div>
                </Section>
            )}

            {docs && (
                <Section title="Documents" icon={FileText}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                            { key: 'photoUrl', label: 'Passport Photo' },
                            { key: 'signatureUrl', label: 'Signature' },
                            { key: 'tenthMarksheetUrl', label: '10th Marksheet' },
                            { key: 'twelfthMarksheetUrl', label: '12th Marksheet' },
                            { key: 'diplomaSemester5MarksheetUrl', label: 'Diploma 5th Sem Marksheet' },
                            { key: 'diplomaSemester6MarksheetUrl', label: 'Diploma 6th Sem Marksheet' },
                            { key: 'cetScoreCardUrl', label: 'CET Score Card' },
                            { key: 'aadhaarUrl', label: 'Aadhaar Card' },
                            { key: 'casteCertificateUrl', label: 'Caste Certificate' },
                            { key: 'domicileCertificateUrl', label: 'Domicile Certificate' },
                            { key: 'gapCertificateUrl', label: 'Gap Certificate' },
                        ].map(({ key, label }) => (
                            docs[key] ? (
                                <a
                                    key={key}
                                    href={`${(import.meta.env.VITE_API_URL || '/api').replace('/api', '')}${docs[key]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition"
                                >
                                    <FileText size={15} />
                                    {label}
                                </a>
                            ) : (
                                <div key={key} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-400">
                                    <FileText size={15} />
                                    {label} <span className="text-xs">(not uploaded)</span>
                                </div>
                            )
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

export default StudentDetail;
