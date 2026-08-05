import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    HelpCircle, 
    ExternalLink, 
    ChevronLeft, 
    ChevronRight,
    Loader2, 
    GraduationCap,
    Lock,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import api from '../../../../../services/api';
import { buildFileUrl } from '../../../../../utils/file.utils';
import toast from 'react-hot-toast';
import StepIndicator from '../../components/StepIndicator';
import useApplicationStatus from '../../hooks/useApplicationStatus';
import { getAcademicYear } from '../../../../../utils/date.util';
import { downloadAdmissionPDF } from '../../utils/pdfGenerator';
import Step1Admission from './form-steps/Step1Admission';
import Step2Personal from './form-steps/Step2Personal';
import Step3Parent from './form-steps/Step3Parent';
import Step4Address from './form-steps/Step4Address';
import Step5Academic from './form-steps/Step5Academic';
import Step6Documents from './form-steps/Step6Documents';
import Step7Review from './form-steps/Step7Review';
import SubmittedView from './components/SubmittedView';
import LoadingContainer from '../../components/LoadingContainer';
import { FormSkeleton } from '../../components/Skeleton';

const STEPS = [
    { id: 1, label: 'Admission' },
    { id: 2, label: 'Personal' },
    { id: 3, label: 'Parent' },
    { id: 4, label: 'Address' },
    { id: 5, label: 'Academic' },
    { id: 6, label: 'Documents' },
    { id: 7, label: 'Review' },
];

const STEP_FIELDS_MAP = {
    1: ['admissionType', 'branchId', 'aadhaar', 'cetNumber', 'dcetNumber', 'qualification'],
    2: ['firstName', 'middleName', 'lastName', 'caste', 'dateOfBirth', 'gender', 'category', 'religion', 'nationality', 'studiedInKarnataka', 'areaType'],
    3: ['fatherName', 'motherName', 'parentMobile', 'fatherPhone', 'parentEmail', 'fatherEmail', 'occupation', 'fatherOccupation', 'motherOccupation', 'motherPhone', 'annualIncome', 'fatherAnnualIncome'],
    4: ['currentAddressLine1', 'currentCity', 'currentState', 'currentPincode', 'permanentAddressLine1', 'permanentCity', 'permanentState', 'permanentPincode', 'Address', 'City', 'Taluk', 'DistrictId', 'Pincode', 'sameAsCurrent', 'permanentAddress', 'permanentCity', 'permanentTaluk', 'permanentDistrictId', 'permanentPincode'],
    5: ['tenthSchool', 'tenthBoard', 'tenthPassingYear', 'tenthRegisterNumber', 'tenthMarksObtained', 'tenthMaxMarks', 'tenthPercentage', 'tenthAttempts', 'tenthSubjectMarks', 'sslcSchool', 'sslcBoard', 'sslcYear', 'sslcRegisterNumber', 'sslcMarksObtained', 'sslcMaxMarks', 'sslcPercentage', 'sslcAttempts', 'sslcSubjectMarks', 'twelfthSchool', 'twelfthBoard', 'twelfthPassingYear', 'twelfthRegisterNumber', 'twelfthStream', 'physicsMarks', 'mathsMarks', 'chemistryMarks', 'optionalSubject', 'optionalMarks', 'twelfthMaxMarks', 'twelfthAggregate', 'twelfthPercentage', 'twelfthAttempts', 'pucSchool', 'pucBoard', 'pucYear', 'pucRegisterNumber', 'pucStream', 'pucMaxMarks', 'pucAggregate', 'pucPercentage', 'pucAttempts', 'diplomaUniversity', 'diplomaYear', 'diplomaRegisterNumber', 'diplomaFinalYearMaxMarks', 'diplomaFinalYearObtained', 'diplomaPercentage', 'diplomaAttempts', 'cetScore', 'cetRank', 'cetYear', 'hasGap', 'gapReason'],
    6: ['photoUrl', 'signatureUrl', 'tenthMarksheetUrl', 'twelfthMarksheetUrl', 'diplomaSemester5MarksheetUrl', 'diplomaSemester6MarksheetUrl', 'cetScoreCardUrl', 'aadhaarUrl', 'casteCertificateUrl', 'domicileCertificateUrl', 'gapCertificateUrl']
};

const getInitialDraftData = () => {
    const merged = {};
    const stepKeys = ['details', 'personal', 'parent', 'address', 'academic', 'documents'];
    for (const key of stepKeys) {
        const draft = localStorage.getItem(`admission_draft_${key}`);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (key !== 'documents') {
                    delete parsed.photoUrl;
                    delete parsed.photo;
                }
                Object.assign(merged, parsed);
            } catch (e) {}
        }
    }
    // Support backward compatibility
    const oldDraft = localStorage.getItem('admission_form_draft');
    if (oldDraft) {
        try {
            const parsed = JSON.parse(oldDraft);
            delete parsed.photoUrl;
            delete parsed.photo;
            Object.assign(merged, parsed);
        } catch (e) {}
    }
    return merged;
};

const AdmissionForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isStepInitialized, setIsStepInitialized] = useState(false);
    const [formData, setFormData] = useState(() => getInitialDraftData());
    const [formLoading, setFormLoading] = useState(true);
    const [stepTransition, setStepTransition] = useState(false);
    const [fullDetails, setFullDetails] = useState(null);
    const [admissionsClosed, setAdmissionsClosed] = useState(false);
    const isNavigating = useRef(false); // Prevents step-reset effect from overriding handleNext
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdmissionStatus = async () => {
            try {
                const res = await api.get('/system/config');
                if (res.data?.success && res.data?.data?.admissionOpen === false) {
                    setAdmissionsClosed(false); // Force false to keep admissions open for testing
                }
            } catch (err) {
                console.warn('Could not check system admission status in AdmissionForm:', err);
            }
        };
        checkAdmissionStatus();
    }, []);

    const {
        stepStatus,
        loading: statusLoading,
        getStepState,
        isStepAccessible,
        refetch: refetchStatus,
    } = useApplicationStatus();

    // Re-fetch form data from API and merge fresh URL fields into formData
    const refreshFormData = async () => {
        try {
            const res = await api.get('/student/admission/step/documents');
            if (res.data.success && res.data.data) {
                const docs = res.data.data;
                // Only update URL fields so we don't overwrite user-typed draft data
                const urlFields = Object.fromEntries(
                    Object.entries(docs).filter(([k]) => k.toLowerCase().includes('url'))
                );
                setFormData(prev => ({ ...prev, ...urlFields }));
            }
        } catch (e) {
            console.error('Failed to refresh form data after upload:', e);
        }
    };

    const syncApplicationState = async () => {
        try {
            const res = await api.get('/application/full-details');
            if (res.data.success && res.data.data) {
                const details = res.data.data;
                setFullDetails(details);
                
                // Flatten the nested details to merge into formData
                const flatData = {
                    id: details.id,
                    applicationNumber: details.applicationNumber,
                    admissionType: details.admissionType,
                    branchId: details.branchId,
                    qualification: details.qualification,
                    aadhaar: details.aadhaar,
                    cetNumber: details.cetNumber,
                    dcetNumber: details.dcetNumber,
                    applicationStatus: details.applicationStatus,
                    ...(details.studentpersonaldetails || {}),
                    ...(details.studentparentdetails || {}),
                    ...(details.studentaddress || {}),
                    ...(details.studentacademicdetails || {}),
                    ...(details.studentdocuments || {})
                };
                
                // Apply legacy mappings
                if (details.studentacademicdetails) {
                    const acad = details.studentacademicdetails;
                    flatData.sslcSchool = acad.tenthSchool;
                    flatData.sslcBoard = acad.tenthBoard;
                    flatData.sslcYear = acad.tenthPassingYear;
                    flatData.sslcRegisterNumber = acad.tenthRegisterNumber;
                    flatData.sslcMarksObtained = acad.tenthMarksObtained;
                    flatData.sslcMaxMarks = acad.tenthMaxMarks;
                    flatData.sslcPercentage = acad.tenthPercentage;
                    flatData.sslcAttempts = acad.tenthAttempts;
                    flatData.sslcSubjectMarks = acad.tenthSubjectMarks;

                    flatData.pucSchool = acad.twelfthSchool;
                    flatData.pucBoard = acad.twelfthBoard;
                    flatData.pucYear = acad.twelfthPassingYear;
                    flatData.pucRegisterNumber = acad.twelfthRegisterNumber;
                    flatData.pucStream = acad.twelfthStream;
                    flatData.pucMaxMarks = acad.twelfthMaxMarks;
                    flatData.pucAggregate = acad.twelfthAggregate;
                    flatData.pucPercentage = acad.twelfthPercentage;
                    flatData.pucAttempts = acad.twelfthAttempts;
                }

                setFormData(prev => ({ ...prev, ...flatData }));
            }
        } catch (e) {
            console.error("Failed to sync application state:", e);
        }
    };

    // Lazy load data for the active form step
    const fetchStepData = async (stepNumber) => {
        const stepNameMap = {
            1: 'admission',
            2: 'personal',
            3: 'parent',
            4: 'address',
            5: 'academic',
            6: 'documents'
        };

        const stepName = stepNameMap[stepNumber];
        if (!stepName) return;

        setFormLoading(true);
        try {
            const res = await api.get(`/student/admission/step/${stepName}`);
            if (res.data.success && res.data.data) {
                const stepData = res.data.data;
                
                if (stepNumber === 5 && stepData.tenthSubjectMarks) {
                    if (typeof stepData.tenthSubjectMarks === 'string') {
                        try {
                            stepData.sslcSubjectMarks = JSON.parse(stepData.tenthSubjectMarks);
                        } catch (e) {}
                    } else {
                        stepData.sslcSubjectMarks = stepData.tenthSubjectMarks;
                    }
                }

                if (stepNumber === 2 && stepData.dateOfBirth) {
                    try {
                        const dateObj = new Date(stepData.dateOfBirth);
                        if (!isNaN(dateObj.getTime())) {
                            const d = String(dateObj.getDate()).padStart(2, '0');
                            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const y = dateObj.getFullYear();
                            stepData.dateOfBirth = `${d}/${m}/${y}`;
                        }
                    } catch (e) {}
                }

                setFormData(prev => ({ ...prev, ...stepData }));
            }
        } catch (error) {
            console.error(`Failed to fetch step ${stepNumber} data:`, error);
        } finally {
            setFormLoading(false);
        }
    };

    // Fetch full details if submitted (dashboard view)
    useEffect(() => {
        const fetchFullDetailsData = async () => {
            try {
                if (stepStatus?.applicationStatus && stepStatus.applicationStatus !== 'DRAFT') {
                    const detailRes = await api.get('/application/full-details');
                    if (detailRes.data.success) {
                        setFullDetails(detailRes.data.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch full details:", error);
            }
        };

        if (!statusLoading) {
            fetchFullDetailsData();
        }
    }, [statusLoading, stepStatus?.applicationStatus]);

    // Force global sync on initial load/mount
    useEffect(() => {
        if (!statusLoading && stepStatus) {
            syncApplicationState();
        }
    }, [statusLoading]);

    // Fetch step-specific data lazily on step transition
    useEffect(() => {
        const isEditable = !statusLoading && stepStatus && 
            (stepStatus.applicationStatus === 'DRAFT' || stepStatus.applicationStatus === 'REJECTED' || stepStatus.applicationStatus === 'CORRECTION_REQUIRED');

        if (isEditable && currentStep >= 1 && currentStep <= 6) {
            fetchStepData(currentStep);
        }
    }, [currentStep, statusLoading, stepStatus?.applicationStatus]);

    // Set initial step based on status or saved step
    useEffect(() => {
        const isEditable = !statusLoading && stepStatus && 
            (stepStatus.applicationStatus === 'DRAFT' || stepStatus.applicationStatus === 'REJECTED' || stepStatus.applicationStatus === 'CORRECTION_REQUIRED');

        if (isEditable && !isStepInitialized) {
            const searchParams = new URLSearchParams(window.location.search);
            const queryStep = searchParams.get('step');
            const savedStep = queryStep || localStorage.getItem('admission_form_step');
            
            let initialStep = 1;
            if (savedStep && parseInt(savedStep) >= 1) {
                const target = parseInt(savedStep);
                if (isStepAccessible(target)) {
                    initialStep = target;
                } else {
                    initialStep = stepStatus.activeStepIndex || 1;
                }
            } else if (stepStatus.applicationStatus === 'CORRECTION_REQUIRED') {
                const keyMap = { 1: 'admission', 2: 'personal', 3: 'parent', 4: 'address', 5: 'academic', 6: 'documents' };
                const requested = stepStatus.correctionRequestedSections || [];
                initialStep = [1, 2, 3, 4, 5, 6].find(i => requested.includes(keyMap[i])) || 1;
            } else if (formData.id || stepStatus.activeStepIndex) {
                initialStep = stepStatus.activeStepIndex || 2;
            }
            
            setCurrentStep(initialStep);
            setIsStepInitialized(true);
        }
    }, [statusLoading, stepStatus, formData.id, isStepInitialized, isStepAccessible]);

    // Save current step draft to localStorage
    useEffect(() => {
        const isEditable = !formLoading && stepStatus && 
            (stepStatus.applicationStatus === 'DRAFT' || stepStatus.applicationStatus === 'REJECTED' || stepStatus.applicationStatus === 'CORRECTION_REQUIRED');

        if (isEditable) {
            const stepFields = STEP_FIELDS_MAP[currentStep];
            if (stepFields) {
                const stepDraft = {};
                for (const field of stepFields) {
                    if (formData[field] !== undefined) {
                        stepDraft[field] = formData[field];
                    }
                }
                const keyMap = { 1: 'details', 2: 'personal', 3: 'parent', 4: 'address', 5: 'academic', 6: 'documents' };
                const currentKey = keyMap[currentStep];
                if (currentKey) {
                    localStorage.setItem(`admission_draft_${currentKey}`, JSON.stringify(stepDraft));
                }
            }
            localStorage.setItem('admission_form_step', currentStep.toString());
        }
    }, [formData, currentStep, formLoading, stepStatus]);

    // Clear drafts if the application is submitted/approved/enrolled
    useEffect(() => {
        if (stepStatus?.applicationStatus && 
            stepStatus.applicationStatus !== 'DRAFT' && 
            stepStatus.applicationStatus !== 'REJECTED' && 
            stepStatus.applicationStatus !== 'CORRECTION_REQUIRED') {
            const stepKeys = ['details', 'personal', 'parent', 'address', 'academic', 'documents'];
            for (const key of stepKeys) {
                localStorage.removeItem(`admission_draft_${key}`);
            }
            localStorage.removeItem('admission_form_step');
            localStorage.removeItem('admission_form_draft');
        }
    }, [stepStatus?.applicationStatus]);

    const handleNext = async () => {
        if (currentStep >= 7) return;
        isNavigating.current = true;
        setStepTransition(true);

        // Clear draft for successfully saved step
        const keyMap = { 1: 'details', 2: 'personal', 3: 'parent', 4: 'address', 5: 'academic', 6: 'documents' };
        const currentKey = keyMap[currentStep];
        if (currentKey) {
            localStorage.removeItem(`admission_draft_${currentKey}`);
        }

        // Calculate next step
        let nextStep = currentStep + 1;
        if (stepStatus?.applicationStatus === 'CORRECTION_REQUIRED') {
            const requested = stepStatus.correctionRequestedSections || [];
            const keyMapSteps = { 1: 'admission', 2: 'personal', 3: 'parent', 4: 'address', 5: 'academic', 6: 'documents' };
            const correctionSteps = [1, 2, 3, 4, 5, 6].filter(i => requested.includes(keyMapSteps[i]));
            const nextCorrection = correctionSteps.find(i => i > currentStep);
            nextStep = nextCorrection !== undefined ? nextCorrection : 7;
        }

        // Update localStorage immediately so the step-reset effect reads the correct step
        localStorage.setItem('admission_form_step', nextStep.toString());
        await refetchStatus();

        if (currentStep === 1) {
            await syncApplicationState();
        }

        setTimeout(() => {
            setCurrentStep(nextStep);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setStepTransition(false);
            // Release the navigation lock after the step has settled
            setTimeout(() => { isNavigating.current = false; }, 500);
        }, 300);
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setStepTransition(true);
            setTimeout(() => {
                let prevStep = currentStep - 1;
                if (stepStatus?.applicationStatus === 'CORRECTION_REQUIRED') {
                    const requested = stepStatus.correctionRequestedSections || [];
                    const keyMapSteps = { 1: 'admission', 2: 'personal', 3: 'parent', 4: 'address', 5: 'academic', 6: 'documents' };
                    const correctionSteps = [1, 2, 3, 4, 5, 6].filter(i => requested.includes(keyMapSteps[i]));
                    const prevCorrection = [...correctionSteps].reverse().find(i => i < currentStep);
                    prevStep = prevCorrection !== undefined ? prevCorrection : 1;
                }
                setCurrentStep(prevStep);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setStepTransition(false);
            }, 200);
        }
    };

    const updateFormData = (newData) => {
        const processed = { ...newData };
        for (const key in processed) {
            const val = processed[key];
            if (typeof val === 'string') {
                const lowerKey = key.toLowerCase();
                if (
                    lowerKey.includes('email') ||
                    lowerKey.includes('url') ||
                    lowerKey.endsWith('id') ||
                    lowerKey.includes('studied') ||
                    lowerKey.includes('same') ||
                    lowerKey.includes('dob') ||
                    lowerKey.includes('dateofbirth')
                ) {
                    if (lowerKey.includes('email')) {
                        processed[key] = val.toLowerCase();
                    }
                } else {
                    processed[key] = val.toUpperCase();
                }
            }
        }
        setFormData((prev) => ({ ...prev, ...processed }));
    };

    const handleDownloadPDF = async () => {
        console.log("DOWNLOAD BUTTON CLICKED (AdmissionForm)");
        await downloadAdmissionPDF(api, toast);
    };


    const getIsStepReadOnly = (stepIndex) => {
        if (!stepStatus) return true;
        const status = stepStatus.applicationStatus;
        if (status === 'CORRECTION_REQUIRED') {
            const keyMap = { 1: 'admission', 2: 'personal', 3: 'parent', 4: 'address', 5: 'academic', 6: 'documents' };
            const stepKey = keyMap[stepIndex];
            const correctionRequested = stepStatus.correctionRequestedSections || [];
            return !correctionRequested.includes(stepKey);
        }
        return status !== 'DRAFT' && status !== 'REJECTED';
    };

    const renderStep = () => {
        const stepProps = {
            onNext: handleNext,
            onPrev: handlePrev,
            data: formData,
            updateData: updateFormData,
            applicationStatus: stepStatus?.applicationStatus,
        };

        switch (currentStep) {
            case 1: return <Step1Admission {...stepProps} readOnly={getIsStepReadOnly(1)} />;
            case 2: return <Step2Personal {...stepProps} readOnly={getIsStepReadOnly(2)} />;
            case 3: return <Step3Parent {...stepProps} readOnly={getIsStepReadOnly(3)} />;
            case 4: return <Step4Address {...stepProps} readOnly={getIsStepReadOnly(4)} />;
            case 5: return <Step5Academic {...stepProps} readOnly={getIsStepReadOnly(5)} />;
            case 6: return <Step6Documents onNext={handleNext} onPrev={handlePrev} data={formData} onUploadSuccess={refreshFormData} applicationStatus={stepStatus?.applicationStatus} readOnly={getIsStepReadOnly(6)} />;
            case 7: return <Step7Review data={formData} onPrev={handlePrev} applicationStatus={stepStatus?.applicationStatus} />;
            default: return null;
        }
    };

    const handleTopNextClick = () => {
        const btn = document.getElementById('bottom-submit-btn');
        if (btn) {
            btn.click();
        }
    };

    const applicationStatus = stepStatus?.applicationStatus;
    const isSubmitted = applicationStatus && 
        applicationStatus !== 'DRAFT' && 
        applicationStatus !== 'CORRECTION_REQUIRED';

    if (statusLoading || (isSubmitted && !fullDetails)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 animate-fade-in bg-slate-50">
                <div className="relative">
                    <div className="size-16 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin"></div>
                    <GraduationCap className="absolute inset-0 m-auto text-primary-600" size={24} />
                </div>
                <p className="text-slate-500 font-bold tracking-tight">Verifying entrance credentials...</p>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="animate-fade-in pb-12">
                <SubmittedView 
                    statusData={stepStatus} 
                    fullDetails={fullDetails} 
                    onDownloadPDF={handleDownloadPDF} 
                />
            </div>
        );
    }

    if (admissionsClosed && !fullDetails?.id && !stepStatus?.studentId && !stepStatus?.applicationNumber) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Lock size={26} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-amber-900">Admissions Closed</h3>
                        <p className="text-xs sm:text-sm text-amber-800 leading-relaxed font-medium">
                            Admissions are currently closed. Please contact the college office for further information.
                        </p>
                    </div>
                    <div className="pt-3 border-t border-amber-200/80">
                        <button onClick={() => navigate('/admission/dashboard')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const loading = formLoading || statusLoading;
    const completedCount = stepStatus?.completedCount || 0;
    const totalSteps = stepStatus?.totalSteps || 7;
    const progressPercent = stepStatus?.progressPercent || 0;

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fade-in pb-8 sm:pb-12 px-3 sm:px-0 w-full max-w-full box-border">
            {stepStatus?.applicationStatus === 'REJECTED' && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 sm:p-5 rounded-r-xl shadow-sm space-y-2 no-print">
                    <h3 className="text-xs sm:text-sm font-bold text-rose-900 uppercase tracking-wide">⚠️ Action Required: Application Returned for Correction</h3>
                    {(() => {
                        const isOther = stepStatus.rejectionReasonCode === 'OTHER' || stepStatus.rejectionReason === 'Other' || stepStatus.rejectionReason === 'OTHER';
                        if (isOther) {
                            return (
                                <p className="text-xs font-bold text-rose-800 whitespace-pre-line">
                                    <strong>Reason for Rejection:</strong> {stepStatus.adminRemarks || stepStatus.rejectionReason || 'Other'}
                                </p>
                            );
                        }
                        return (
                            <>
                                {stepStatus?.rejectionReason && (
                                    <p className="text-xs font-bold text-rose-800">
                                        <strong>Reason for Rejection:</strong> {stepStatus.rejectionReason}
                                    </p>
                                )}
                                {stepStatus?.adminRemarks && (
                                    <p className="text-xs font-medium text-rose-700 whitespace-pre-line">
                                        <strong>Correction Requests:</strong> {stepStatus.adminRemarks}
                                    </p>
                                )}
                            </>
                        );
                    })()}
                    <p className="text-[11px] text-rose-600 leading-tight">
                        Please navigate through the form steps below, modify the incorrect or missing details, and resubmit the application.
                    </p>
                </div>
            )}

            {/* Form Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white border border-slate-200 rounded-2xl sm:rounded-lg p-4 sm:p-5 no-print">
                <div className="space-y-1">
                    <h1 className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
                        <GraduationCap className="text-primary-600 shrink-0" size={22} />
                        Admission Form
                    </h1>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-semibold">Admission Session {formData?.academicYear || getAcademicYear()}</span>
                    </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-6 w-full sm:w-auto">
                    <button
                        onClick={() => navigate('/admission/dashboard')}
                        className="btn-secondary flex-1 sm:flex-none text-xs sm:text-sm flex items-center justify-center gap-1.5 py-2 px-3 min-h-[48px] sm:min-h-[38px] font-bold"
                    >
                        <ChevronLeft size={16} />
                        <span className="sm:hidden">Back</span>
                        <span className="hidden sm:inline">Back to Portal</span>
                    </button>
                    <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0 px-1">
                        <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                            <span className="sm:hidden">Progress</span>
                            <span className="hidden sm:inline">Admission Progress</span>
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 justify-center w-full mt-0.5">
                            <div className="w-10 sm:w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden shrink-0">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${progressPercent}%`,
                                        background: progressPercent === 100
                                            ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                                             : 'linear-gradient(90deg, #1241a1, #3b82f6)'
                                    }}
                                ></div>
                            </div>
                            <p className="text-[10px] sm:text-sm font-bold text-primary-700">{completedCount}/{totalSteps}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleTopNextClick}
                        disabled={loading}
                        className="btn-primary flex-1 sm:flex-none text-xs sm:text-sm flex items-center justify-center gap-1 py-2 px-3 sm:px-4 min-h-[48px] sm:min-h-[38px] font-bold shadow-md shadow-primary-600/10 whitespace-nowrap"
                    >
                        {currentStep === 7 ? (
                            stepStatus?.applicationStatus === 'CORRECTION_REQUIRED' ? (
                                <>
                                    <span className="sm:hidden">Submit</span>
                                    <span className="hidden sm:inline">Submit Corrections</span>
                                </>
                            ) : (
                                <>
                                    <span className="sm:hidden">Submit</span>
                                    <span className="hidden sm:inline">Final Submit</span>
                                </>
                            )
                        ) : (
                            <>Next <ChevronRight size={16} /></>
                        )}
                    </button>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="no-print overflow-x-auto">
                <StepIndicator steps={STEPS} currentStep={currentStep} getStepState={getStepState} />
            </div>

            {/* Step Status Bar */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs no-print">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                    <span className="text-slate-500 font-medium text-[11px] sm:text-xs">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary-600 step-pulse"></div>
                    <span className="text-slate-500 font-medium text-[11px] sm:text-xs">In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-200"></div>
                    <span className="text-slate-500 font-medium text-[11px] sm:text-xs">Locked</span>
                </div>
            </div>

            {/* Form Content Card */}
            <div className="bg-white rounded-2xl sm:rounded-lg border border-slate-200 min-h-[350px] relative print-no-border max-w-full box-border overflow-hidden">
                <div className={`h-1 w-full rounded-t-lg transition-colors duration-500 no-print ${
                    getStepState(currentStep) === 'COMPLETED' ? 'bg-green-500' : 'bg-primary-600'
                }`}></div>

                <div className={`p-4 sm:p-6 lg:p-8 transition-all duration-300 ${stepTransition ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                    <LoadingContainer
                        isLoading={loading}
                        skeleton={<FormSkeleton fields={6} />}
                        hintText="Preparing admission details..."
                    >
                        {/* Section-level correction status alert */}
                        {applicationStatus === 'CORRECTION_REQUIRED' && (
                            getIsStepReadOnly(currentStep) ? (
                                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl shadow-sm mb-6 flex gap-3 items-start animate-fade-in no-print">
                                    <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide">✅ Section Verified</h4>
                                        <p className="text-xs text-emerald-800 leading-normal mt-1 font-medium">
                                            This section has been verified by the administrator and is locked for editing.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-sm mb-6 flex gap-3 items-start animate-fade-in no-print">
                                    <div className="p-1 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-rose-950 uppercase tracking-wide">🔴 Correction Required</h4>
                                        <p className="text-xs text-rose-800 leading-normal mt-1 font-medium whitespace-pre-line">
                                            {stepStatus?.adminRemarks || 'Please review and update this section.'}
                                        </p>
                                    </div>
                                </div>
                            )
                        )}
                        {renderStep()}
                    </LoadingContainer>
                </div>
            </div>

            {/* Help Section (Displayed ONLY on Step 1 and Final Review Step 7) */}
            {(currentStep === 1 || currentStep === 7) && (
                <div className="bg-slate-50 rounded-2xl sm:rounded-lg p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 border border-slate-200 no-print">
                    <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
                        <div className="w-10 h-10 rounded-lg bg-white text-primary-600 border border-slate-200 flex items-center justify-center shrink-0">
                            <HelpCircle size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-800 mb-0.5">Need help?</h4>
                            <p className="text-xs sm:text-sm text-slate-500">Our admissions team is ready to guide you through the process.</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                <span className="font-medium text-slate-700">📞 099448693987</span>
                                <span className="mx-2 text-slate-300">|</span>
                                <span className="font-medium text-slate-700">✉️ principal@jcer.in</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={() => navigate('/admission/support')}
                        className="btn-secondary text-xs sm:text-sm flex items-center gap-2 py-2 px-4 whitespace-nowrap min-h-[38px]"
                    >
                        Contact Support
                        <ExternalLink size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdmissionForm;
