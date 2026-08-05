import React, { useState, useEffect, useRef } from 'react';
import api from '../../../../../../services/api';
import {
    Loader2,
    CheckCircle,
    ChevronLeft,
    ShieldCheck,
    User,
    Users,
    MapPin,
    GraduationCap,
    Edit3,
    FileText,
    Download,
    AlertCircle,
    ArrowRight,
    Camera,
    Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { downloadAdmissionPDF } from '../../../utils/pdfGenerator';

const Step7Review = ({ onPrev, readOnly = false, details: externalDetails = null, applicationStatus }) => {
    const [loading, setLoading] = useState(!externalDetails);
    const [submitting, setSubmitting] = useState(false);
    const [details, setDetails] = useState(externalDetails);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();
    const printFrameRef = useRef();

    useEffect(() => {
        if (externalDetails) {
            setDetails(externalDetails);
            setLoading(false);
            return;
        }

        const fetchDetails = async () => {
            try {
                const res = await api.get('/application/full-details');
                if (res.data.success) {
                    setDetails(res.data.data);
                }
            } catch (error) {
                toast.error("Failed to load application details for review.", { id: 'fetch-details-error' });
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, []);

    const handleSubmit = async () => {
        if (!isConfirmed) {
            toast.error("Please confirm your details before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/student/submit');
            if (res.data.success) {
                toast.success('Application Submitted Successfully!');
                setIsSubmitted(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadPDF = async () => {
        await downloadAdmissionPDF(api, toast);
    };

    const handleEdit = (stepNumber) => {
        let target = stepNumber;
        if (applicationStatus === 'CORRECTION_REQUIRED' && details?.correctionRequestedSections) {
            const keyMap = { 1: 'admission', 2: 'personal', 3: 'parent', 4: 'address', 5: 'academic', 6: 'documents' };
            const requested = details.correctionRequestedSections || [];
            const firstCorrection = [1, 2, 3, 4, 5, 6].find(i => requested.includes(keyMap[i])) || 1;
            target = firstCorrection;
        }
        localStorage.setItem('admission_form_step', target.toString());
        setTimeout(() => window.location.reload(), 50);
    };

    const getPhotoUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const base = api.defaults.baseURL || '/api';
        return `${base.replace('/api', '')}${path}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 size={40} className="animate-spin text-primary-600" />
                <p className="text-slate-500 font-medium">Preparing application review...</p>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="space-y-8 animate-fade-in py-8 text-center max-w-2xl mx-auto">
                <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/10">
                    <CheckCircle size={40} />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-slate-900">Application Submitted!</h2>
                    <p className="text-slate-500">Your application (ID: <span className="font-bold text-slate-800">{details.applicationNumber || details.id}</span>) has been successfully recorded and is now under review.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 space-y-6 mt-10">
                    <div className="flex flex-col sm:flex-row items-center justify-around gap-8 text-left">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Admission Number</p>
                            <p className="text-lg font-bold text-slate-900">{details.applicationNumber || details.id}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date Submitted</p>
                            <p className="text-lg font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                            <p className="text-lg font-bold text-green-600 flex items-center gap-1.5">
                                <ShieldCheck size={20} /> SUBMITTED
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex-1 bg-primary-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-[0.98]"
                        >
                            <Download size={20} />
                            Download PDF
                        </button>
                        <button
                            onClick={() => navigate('/admission/dashboard')}
                            className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                        >
                            <ArrowRight size={20} />
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                <p className="text-sm text-slate-400">
                    A confirmation email has been sent to your registered email address.
                </p>
            </div>
        );
    }

    const pd = details?.studentpersonaldetails || {};
    const par = details?.studentparentdetails || {};
    const addr = details?.studentaddress || {};
    const acad = details?.studentacademicdetails || {};
    const docs = details?.studentdocuments || {};
    const branch = details?.branch || {};
    const user = details?.user || {};
    const q = (details?.qualification || '').toUpperCase();
    const showPUC = q === 'PUC' || (!q && details?.admissionType === 'KCET');
    const showDiploma = q === 'DIPLOMA' || (!q && details?.admissionType === 'DCET');
    const applicantName = pd.firstName
        ? `${pd.firstName} ${pd.lastName || ''}`.trim()
        : `${user.firstName || ''} ${user.lastName || ''}`.trim();

    const ReviewSection = ({ icon: Icon, title, step, children }) => {
        const isStepReadOnly = () => {
            if (applicationStatus === 'CORRECTION_REQUIRED' && details?.correctionRequestedSections) {
                const keyMap = { 1: 'admission', 2: 'personal', 3: 'parent', 4: 'address', 5: 'academic', 6: 'documents' };
                const stepKey = keyMap[step];
                const correctionRequested = details.correctionRequestedSections || [];
                return !correctionRequested.includes(stepKey);
            }
            return false;
        };
        const readOnlySection = readOnly || isStepReadOnly();

        return (
            <div className="review-card group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all duration-300">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm text-primary-600 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                            <Icon size={18} />
                        </div>
                        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
                    </div>
                    {!readOnlySection && (
                        <button
                            onClick={() => handleEdit(step)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                        >
                            <Edit3 size={14} />
                            Edit
                        </button>
                    )}
                </div>
            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                    {children}
                </div>
            </div>
        </div>
        );
    };

    const DataItem = ({ label, value, highlight = false }) => (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`text-sm font-semibold break-words transition-colors duration-300 ${highlight ? 'text-primary-700 font-bold' : 'text-slate-700'}`}>
                {value || <span className="text-slate-300 font-medium italic">Not provided</span>}
            </p>
        </div>
    );

    return (
        <>
            {/* Screen Layout */}
            <div className="space-y-6 sm:space-y-8 animate-fade-in w-full max-w-full box-border overflow-hidden">
                <div className="bg-gradient-to-br from-slate-900 to-primary-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
                        <div className="space-y-2 sm:space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                <ShieldCheck size={12} className="text-blue-300" />
                                Application Review Phase
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Verify Your Information</h2>
                            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                                Please conduct a final review of all entered details. Your application will be locked for editing once submitted.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-5 bg-white/5 backdrop-blur-sm p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10">
                            <div className="relative group shrink-0">
                                <div className="size-16 sm:size-20 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:border-primary-400 shadow-xl">
                                    {docs.photoUrl ? (
                                        <img
                                            src={getPhotoUrl(docs.photoUrl)}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={28} className="text-white/40" />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-primary-500 text-white p-1 sm:p-1.5 rounded-full shadow-lg">
                                    <Camera size={10} />
                                </div>
                            </div>
                            <div className="text-left md:text-right min-w-0">
                                <p className="text-base sm:text-xl font-bold leading-tight uppercase tracking-tight truncate">
                                    {applicantName || 'Guest Applicant'}
                                </p>
                                <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1">
                                    App ID: <span className="text-primary-300 font-bold tracking-wider">{details.applicationNumber || details.id}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {details?.applicationStatus === 'REJECTED' && (details?.rejectionReason || details?.adminRemarks) && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertCircle size={20} className="text-red-600 shrink-0" />
                            <h3 className="text-sm font-bold text-red-900">Correction / Rejection Reason</h3>
                        </div>
                        <div className="bg-white rounded-xl border border-red-100 p-4">
                            <p className="text-sm text-red-800 leading-relaxed font-medium italic whitespace-pre-line">
                                {(() => {
                                    const isOther = details.rejectionReasonCode === 'OTHER' || details.rejectionReason === 'Other' || details.rejectionReason === 'OTHER';
                                    if (isOther) {
                                        return details.adminRemarks || details.rejectionReason || 'Other';
                                    }
                                    return details.rejectionReason || details.adminRemarks || '';
                                })()}
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4 sm:space-y-6">
                    <ReviewSection icon={GraduationCap} title="Choice of Course" step={1}>
                        <DataItem label="Admission Type" value={details.admissionType} highlight={true} />
                        <DataItem label="Preferred Branch" value={details.branch?.name} highlight={true} />
                        <DataItem label="Qualification" value={details.qualification === 'DIPLOMA' ? 'Diploma' : 'PUC / 12th Standard'} highlight={true} />
                        {details.cetNumber && <DataItem label="CET/Rank No." value={details.cetNumber} />}
                        {details.dcetNumber && <DataItem label="DCET/Rank No." value={details.dcetNumber} />}
                    </ReviewSection>

                    <ReviewSection icon={User} title="Personal Details" step={2}>
                        <DataItem label="First Name" value={pd.firstName} />
                        <DataItem label="Middle Name" value={pd.middleName} />
                        <DataItem label="Last Name" value={pd.lastName} />
                        <DataItem label="Caste" value={pd.caste} />
                        <DataItem label="Date of Birth" value={pd.dateOfBirth ? new Date(pd.dateOfBirth.split('/').reverse().join('-')).toLocaleDateString() : null} />
                        <DataItem label="Gender" value={pd.gender} />
                        <DataItem label="Category" value={pd.category} />
                        <DataItem label="Religion" value={pd.religion} />
                        <DataItem label="Nationality" value={pd.nationality} />
                        <DataItem label="Studied in Karnataka" value={pd.studiedInKarnataka === true ? 'Yes' : 'No'}/>
                        <DataItem label="Area Type" value={pd.areaType} />
                    </ReviewSection>

                    <ReviewSection icon={Users} title="Parent Details" step={3}>
                        <DataItem label="Father's Name" value={par.fatherName} />
                        <DataItem label="Father's Occupation" value={par.fatherOccupation} />
                        <DataItem label="Father's Mobile" value={par.fatherPhone} />
                        <DataItem label="Father's Email" value={par.fatherEmail || 'N/A'} />
                        <DataItem label="Father's Annual Income" value={par.fatherAnnualIncome ? `₹${Number(par.fatherAnnualIncome).toLocaleString()}` : null} />
                        <DataItem label="Mother's Name" value={par.motherName} />
                        <DataItem label="Mother's Occupation" value={par.motherOccupation} />
                        <DataItem label="Mother's Mobile" value={par.motherPhone} />
                    </ReviewSection>

                    <ReviewSection icon={MapPin} title="Address Details" step={4}>
                        <div className="col-span-full border-b border-slate-50 pb-2 mb-2">
                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Current Address</p>
                        </div>
                        <DataItem label="Address" value={addr.currentAddressLine1} />
                        <DataItem label="City" value={addr.currentCity} />
                        <DataItem label="State / Pincode" value={addr ? `${addr.currentState || ''} - ${addr.currentPincode || ''}` : null} />

                        <div className="col-span-full border-b border-slate-50 pb-2 mb-2 mt-4">
                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Permanent Address</p>
                        </div>
                        <DataItem label="Address" value={addr.permanentAddressLine1} />
                        <DataItem label="City" value={addr.permanentCity} />
                        <DataItem label="State / Pincode" value={addr ? `${addr.permanentState || ''} - ${addr.permanentPincode || ''}` : null} />
                    </ReviewSection>

                    <ReviewSection icon={GraduationCap} title="Academic Record" step={5}>
                        <div className="col-span-full border-b border-slate-50 pb-2 mb-2">
                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">SSLC / 10th Standard</p>
                        </div>
                        <DataItem label="School Name" value={acad.tenthSchool} />
                        <DataItem label="Board" value={acad.tenthBoard} />
                        <DataItem label="Year" value={acad.tenthPassingYear} />
                        <DataItem label="Percentage" value={acad.tenthPercentage ? `${acad.tenthPercentage}%` : null} />

                        {showPUC && (
                            <>
                                <div className="col-span-full border-b border-slate-50 pb-2 mb-2 mt-4">
                                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">PUC / 12th Standard</p>
                                </div>
                                <DataItem label="School Name" value={acad.twelfthSchool} />
                                <DataItem label="Stream" value={acad.twelfthStream} />
                                <DataItem label="Board" value={acad.twelfthBoard} />
                                <DataItem label="Year" value={acad.twelfthPassingYear} />
                                <DataItem label="Percentage" value={acad.twelfthPercentage ? `${acad.twelfthPercentage}%` : null} />
                            </>
                        )}
                        {showDiploma && (
                            <>
                                <div className="col-span-full border-b border-slate-50 pb-2 mb-2 mt-4">
                                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Diploma (Lateral Entry)</p>
                                </div>
                                <DataItem label="University Name" value={acad.diplomaUniversity} />
                                <DataItem label="Year" value={acad.diplomaYear} />
                                <DataItem label="Percentage" value={acad.diplomaPercentage ? `${acad.diplomaPercentage}%` : null} />
                            </>
                        )}
                    </ReviewSection>

                    <ReviewSection icon={FileText} title="Attached Documents" step={6}>
                        <DataItem label="Photo" value={docs.photoUrl ? '✅ Uploaded' : '❌ Missing'} />
                        <DataItem label="Signature" value={docs.signatureUrl ? '✅ Uploaded' : '❌ Missing'} />
                        <DataItem label="10th Marksheet" value={docs.tenthMarksheetUrl ? '✅ Uploaded' : '❌ Missing'} />
                        {details.qualification === 'DIPLOMA' ? (
                            <>
                                <DataItem label="Diploma 5th Sem Marksheet" value={docs.diplomaSemester5MarksheetUrl ? '✅ Uploaded' : '❌ Missing'} />
                                <DataItem label="Diploma 6th Sem Marksheet" value={docs.diplomaSemester6MarksheetUrl ? '✅ Uploaded' : '❌ Missing'} />
                            </>
                        ) : (
                            <DataItem label="PUC / 12th Marksheet" value={docs.twelfthMarksheetUrl ? '✅ Uploaded' : '❌ Missing'} />
                        )}
                        <DataItem label="Fees Paid Receipt" value={docs.feesPaidReceiptUrl ? '✅ Uploaded' : '❌ Missing'} />
                        <DataItem label="Domicile/Study Certificate" value={docs.domicileCertificateUrl ? '✅ Uploaded' : '❌ Missing'} />
                    </ReviewSection>
                </div>

                {!readOnly && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-xl mt-6 sm:mt-12 mb-8 max-w-full box-border">
                        <div className="bg-amber-50 p-4 sm:p-6 flex items-start gap-3 sm:gap-4 border-b border-amber-100">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <h4 className="text-sm font-bold text-amber-900">Final Declaration</h4>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    I hereby declare that the information provided above is true and accurate to the best of my knowledge.
                                    I understand that any misleading information may lead to the cancellation of my admission application.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 w-full max-w-full box-border">
                            <label className="flex items-start sm:items-center gap-3 sm:gap-4 cursor-pointer p-3.5 sm:p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
                                <div className="relative flex items-center mt-0.5 sm:mt-0">
                                    <input
                                        type="checkbox"
                                        checked={isConfirmed}
                                        onChange={(e) => setIsConfirmed(e.target.checked)}
                                        className="peer size-5 sm:size-6 rounded-lg border-2 border-slate-300 text-primary-600 focus:ring-primary-600/20 transition-all checked:bg-primary-600 appearance-none"
                                    />
                                    <CheckCircle size={14} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-slate-700 select-none leading-tight">
                                    I have reviewed all the details and confirm they are correct.
                                </span>
                            </label>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-slate-100 w-full max-w-full box-border">
                                <button
                                    type="button"
                                    onClick={() => handleEdit(1)}
                                    className="btn-secondary w-full sm:flex-1 h-12 sm:h-14 px-4 sm:px-6 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl"
                                >
                                    <ChevronLeft size={18} />
                                    Discard & Edit
                                </button>

                                 <button
                                    type="button"
                                    id="bottom-submit-btn"
                                    onClick={handleSubmit}
                                    disabled={submitting || !isConfirmed}
                                    className={`
                                        w-full sm:flex-1 h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl text-xs sm:text-sm max-w-full box-border
                                        ${!isConfirmed ? 'bg-slate-200 text-slate-400 cursor-not-allowed grayscale shadow-none' : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] shadow-primary-600/30'}
                                    `}
                                >
                                    {submitting ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck size={18} />
                                            {applicationStatus === 'CORRECTION_REQUIRED' ? 'Submit Corrections' : 'Finalize & Submit'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Step7Review;