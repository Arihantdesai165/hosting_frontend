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
        const toastId = toast.loading('Preparing your admission letter…');
        try {
            const res = await api.get('/application/full-details');
            if (!res.data.success) throw new Error('Failed to load latest details');
            const details = res.data.data;

            const docs = details?.studentdocuments || details?.documents || {};
            const branch = details?.branch || {};
            const user = details?.user || {};
            const par = details?.studentparentdetails || {};
            const addr = details?.studentaddress || {};
            const acad = details?.studentacademicdetails || {};
            const absoluteLogoUrl = new URL('/logo.png', window.location.origin).href;

            const getDocUrl = (path) => {
                return buildFileUrl(path);
            };

            const photoUrl = docs.photoUrl ? getDocUrl(docs.photoUrl) : '';
            const signatureUrl = docs.signatureUrl ? getDocUrl(docs.signatureUrl) : '';
            const logoUrl = absoluteLogoUrl;

            // Trace data flow logs (Step 3)
            console.log("application", details);
            console.log("application.documents", details?.studentdocuments || details?.documents);
            console.log("photo", photoUrl);
            console.log("signature", signatureUrl);
            console.log("logo", logoUrl);
            console.log("photoUrl", photoUrl);
            console.log("signatureUrl", signatureUrl);
            console.log("logoUrl", logoUrl);

            console.log("Original:", docs.photoUrl);
            console.log("Resolved:", buildFileUrl(docs.photoUrl));

            const isImageUrl = (url) => {
                if (!url) return false;
                const cleanUrl = url.split('?')[0].toLowerCase();
                return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif');
            };

            const documentList = [
                { label: '10th / SSLC Marks Card', url: docs.tenthMarksheetUrl ? getDocUrl(docs.tenthMarksheetUrl) : '' },
                { label: '12th / PUC Marks Card', url: docs.twelfthMarksheetUrl ? getDocUrl(docs.twelfthMarksheetUrl) : '' },
                { label: 'Diploma 5th Sem Marks Card', url: docs.diplomaSemester5MarksheetUrl ? getDocUrl(docs.diplomaSemester5MarksheetUrl) : '' },
                { label: 'Diploma 6th Sem Marks Card', url: docs.diplomaSemester6MarksheetUrl ? getDocUrl(docs.diplomaSemester6MarksheetUrl) : '' },
                { label: 'CET Score Card', url: docs.cetScoreCardUrl ? getDocUrl(docs.cetScoreCardUrl) : '' },
                { label: 'Aadhaar Card', url: docs.aadhaarUrl ? getDocUrl(docs.aadhaarUrl) : '' },
                { label: 'Caste Certificate', url: docs.casteCertificateUrl ? getDocUrl(docs.casteCertificateUrl) : '' },
                { label: 'Domicile Certificate', url: docs.domicileCertificateUrl ? getDocUrl(docs.domicileCertificateUrl) : '' },
                { label: 'Gap Certificate', url: docs.gapCertificateUrl ? getDocUrl(docs.gapCertificateUrl) : '' },
                { label: 'Fees Paid Receipt', url: docs.feesPaidReceiptUrl ? getDocUrl(docs.feesPaidReceiptUrl) : '' },
                { label: 'Admission Fee Receipt', url: docs.admissionFeeReceiptUrl ? getDocUrl(docs.admissionFeeReceiptUrl) : '' }
            ];

            const imageDocs = documentList.filter(d => d.url && isImageUrl(d.url));

            const preloadImage = (url) => {
                return new Promise((resolve) => {
                    if (!url) {
                        resolve(false);
                        return;
                    }
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = url;
                });
            };

            let logoLoaded = false;
            let photoLoaded = false;
            let signatureLoaded = false;
            const loadedImageDocs = {};

            const preloads = [
                preloadImage(logoUrl).then(res => logoLoaded = res),
                preloadImage(photoUrl).then(res => photoLoaded = res),
                preloadImage(signatureUrl).then(res => signatureLoaded = res)
            ];

            imageDocs.forEach(d => {
                preloads.push(preloadImage(d.url).then(res => {
                    loadedImageDocs[d.label] = { url: d.url, loaded: res };
                    return res;
                }));
            });

            await Promise.all(preloads);

            const q = (details?.qualification || '').toUpperCase();
            const showPUC = q === 'PUC' || (!q && details?.admissionType === 'KCET');
            const showDiploma = q === 'DIPLOMA' || (!q && details?.admissionType === 'DCET');
            const applicantName = pd.firstName ? `${pd.firstName} ${pd.lastName || ''}`.trim() : `${user.firstName || ''} ${user.lastName || ''}`.trim();

            const getPdfStatusText = (det) => {
                const status = det?.applicationStatus;
                if (status === 'ENROLLED') return 'ADMISSION CONFIRMED';
                if (status === 'APPROVED') return 'ADMISSION APPROVED';
                if (det?.documentsVerified) return 'DOCUMENTS VERIFIED';
                if (status === 'UNDER_REVIEW') return 'UNDER REVIEW';
                if (status === 'SUBMITTED') {
                    if (det?.resubmittedAt) return 'APPLICATION RESUBMITTED';
                    return 'APPLICATION SUBMITTED';
                }
                if (status === 'REJECTED') return 'APPLICATION REJECTED';
                return 'APPLICATION DRAFT';
            };
            const pdfStatus = getPdfStatusText(details);


            const printHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title></title>
                    <style>
                        @page { size: A4 portrait; margin: 6mm 10mm; }
                        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        html, body { height: auto !important; overflow: visible !important; }
                        body { font-family: 'Times New Roman', Times, serif; background: white; margin: 0; padding: 0; color: #000; }
                        .application-form { width: 100%; max-width: 190mm; margin: 0 auto; padding: 0px; background: white; box-sizing: border-box; height: auto !important; overflow: visible !important; }
                        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 400px; opacity: 0.05; pointer-events: none; z-index: 0; }
                        .watermark img { width: 100%; height: 100%; object-fit: contain; }
                        .header { border-bottom: 3px solid #1a3c6e; padding-bottom: 6px; margin-bottom: 8px; }
                        .header-top { display: grid; grid-template-columns: 80px 1fr 80px; align-items: center; width: 100%; }
                        .logo-box { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
                        .logo-box img { width: 100%; height: 100%; object-fit: contain; }
                        .header-text { flex: 1; text-align: center; padding: 0 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                        .header-text h1 { font-size: 12.5pt; font-weight: bold; color: #1a3c6e; white-space: nowrap; text-align: center; }
                        .header-text h2 { font-size: 10pt; font-weight: bold; color: #1a3c6e; border: 1.5px solid #1a3c6e; display: inline-block; padding: 1px 10px; margin: 2px 0; text-align: center; }
                        .header-text p { font-size: 9pt; color: #333; margin: 1px 0 0; text-align: center; }
                        .photo-box { flex-shrink: 0; width: 80px; height: 100px; border: 2px solid #1a3c6e; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #fafafa; }
                        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
                        .photo-placeholder { font-size: 10px; color: #999; text-align: center; }
                        .header-bottom { display: flex; justify-content: space-between; margin-top: 6px; padding: 3px 8px; background: #f5f7fa; border: 1px solid #dde1e8; font-size: 9pt; }
                        .status-confirmed { background: #dcfce7; border: 2px solid #16a34a; padding: 4px 8px; margin: 4px 0 6px; text-align: center; font-size: 11pt; font-weight: bold; color: #15803d; letter-spacing: 0.5px; }
                        .notice-box { background: #fffbeb; border: 1.5px solid #d97706; padding: 4px 10px; margin-bottom: 8px; font-size: 8.5pt; color: #92400e; }
                        .body { margin: 4px 0 8px; }
                        .section { margin-bottom: 6px; break-inside: avoid; page-break-inside: avoid; }
                        .section-title { background: #000; color: white; padding: 2px 8px; font-size: 9.5pt; font-weight: bold; letter-spacing: 0.5px; }
                        .section-content { border: 1px solid #dde1e8; border-top: none; }
                        .section-content table { width: 100%; border-collapse: collapse; }
                        .section-content td { padding: 2px 6px; border-bottom: 1px dotted #e0e4eb; font-size: 8.5pt; }
                        .section-content tr:last-child td { border-bottom: none; }
                        .label { width: 160px; font-weight: 600; color: #333; }
                        .value { font-weight: 500; color: #000; }
                        .subheader { background: #f5f7fa; font-weight: bold; color: #1a3c6e; padding: 1.5px 6px !important; font-size: 8.5pt; }
                        .declaration { margin: 6px 0 4px; border: 1.5px solid #1a3c6e; padding: 4px 10px; background: #f8faff; break-inside: avoid; page-break-inside: avoid; }
                        .declaration-title { font-size: 9.5pt; font-weight: bold; color: #1a3c6e; text-align: center; margin-bottom: 1px; }
                        .declaration-text { font-size: 8pt; line-height: 1.35; text-align: justify; }
                        .signature { display: flex; justify-content: space-between; margin: 10px 0 3px; padding: 0 10px; break-inside: avoid; page-break-inside: avoid; }
                        .signature-item { text-align: center; width: 200px; }
                        .signature-line { border-top: 1px solid black; height: 12px; margin-bottom: 1px; }
                        .signature-img { height: 24px; object-fit: contain; display: block; margin: 0 auto 1px; }
                        .signature-label { font-size: 8pt; color: #333; font-weight: 600; }
                        .footer { margin-top: 5px; border-top: 2px solid #1a3c6e; padding-top: 4px; text-align: center; break-inside: avoid; page-break-inside: avoid; }
                        .footer p { font-size: 8pt; color: #555; margin: 1px 0; }
                        @media print {
                            html, body, .application-form {
                                height: auto !important;
                                overflow: visible !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="watermark">${logoLoaded ? `<img src="${logoUrl}" alt="" crossOrigin="anonymous" />` : ''}</div>
                    <div class="application-form">
                        <div class="header">
                            <div class="header-top">
                                <div class="logo-box">${logoLoaded ? `<img src="${logoUrl}" alt="JCER Logo" crossOrigin="anonymous" />` : `<span style="font-size:8px;">Logo Not Loaded</span>`}</div>
                                <div class="header-text">
                                    <h1>JAIN COLLEGE OF ENGINEERING AND RESEARCH</h1>
                                    <p style="font-size:8px;color:#475569;">(Approved by AICTE, New Delhi, Affiliated to VTU Belagavi &amp; Recognized by Govt. of Karnataka)</p>
                                    <h2>ADMISSION APPLICATION FORM</h2>
                                    <p>Academic Session ${details?.academicYear || formData?.academicYear || getAcademicYear()}</p>
                                </div>
                                <div class="photo-box">
                                    ${photoUrl ? (photoLoaded ? `<img src="${photoUrl}" alt="Passport Photo" crossOrigin="anonymous" />` : `<span class="photo-placeholder" style="color:red;">Passport Photo<br>Not Available</span>`) : `<span class="photo-placeholder">PASSPORT<br>PHOTO</span>`}
                                </div>
                            </div>
                            <div class="header-bottom">
                                <span><strong>Admission No:</strong> ${details?.applicationNumber || 'N/A'}</span>
                                <span><strong>Status:</strong> ${pdfStatus}</span>
                                <span><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                        <div class="status-confirmed">✅ ${pdfStatus} – Jain College of Engineering &amp; Research</div>
                        <div class="notice-box">📋 <strong>Important:</strong> Please carry this printed copy when visiting the college for document verification and enrollment formalities.</div>
                        <div class="body">
                            <div class="section">
                                <div class="section-title">1. COURSE PREFERENCE</div>
                                <div class="section-content"><table><tbody>
                                    <tr><td class="label">Admission Type</td><td class="value">${details?.admissionType || '—'}</td></tr>
                                    <tr><td class="label">Preferred Branch</td><td class="value">${branch?.name ? `${branch.name} (${branch.code || ''})` : '—'}</td></tr>
                                    ${details?.cetNumber ? `<tr><td class="label">CET Number</td><td class="value">${details.cetNumber}</td></tr>` : ''}
                                    ${details?.dcetNumber ? `<tr><td class="label">DCET Number</td><td class="value">${details.dcetNumber}</td></tr>` : ''}
                                </tbody></table></div>
                            </div>
                            <div class="section">
                                <div class="section-title">2. PERSONAL DETAILS</div>
                                <div class="section-content"><table><tbody>
                                    <tr><td class="label">Full Name</td><td class="value">${applicantName || '—'}</td></tr>
                                    <tr><td class="label">Date of Birth</td><td class="value">${pd.dateOfBirth || '—'}</td></tr>
                                    <tr><td class="label">Gender</td><td class="value">${pd.gender || '—'}</td></tr>
                                    <tr><td class="label">Category</td><td class="value">${pd.category || '—'}</td></tr>
                                    <tr><td class="label">Religion</td><td class="value">${pd.religion || '—'}</td></tr>
                                    <tr><td class="label">Nationality</td><td class="value">${pd.nationality || '—'}</td></tr>
                                    <tr><td class="label">Mobile</td><td class="value">${pd.phone || user.phone || '—'}</td></tr>
                                    <tr><td class="label">Email</td><td class="value">${user.email || '—'}</td></tr>
                                </tbody></table></div>
                            </div>
                            <div class="section">
                                <div class="section-title">3. PARENT / GUARDIAN DETAILS</div>
                                <div class="section-content"><table><tbody>
                                    <tr><td class="label">Father's Name</td><td class="value">${par.fatherName || '—'}</td></tr>
                                    <tr><td class="label">Father's Occupation</td><td class="value">${par.fatherOccupation || '—'}</td></tr>
                                    <tr><td class="label">Father's Mobile</td><td class="value">${par.fatherPhone || '—'}</td></tr>
                                    <tr><td class="label">Mother's Name</td><td class="value">${par.motherName || '—'}</td></tr>
                                    <tr><td class="label">Mother's Mobile</td><td class="value">${par.motherPhone || '—'}</td></tr>
                                    <tr><td class="label">Annual Income</td><td class="value">${par.fatherAnnualIncome ? `₹${Number(par.fatherAnnualIncome).toLocaleString('en-IN')}` : '—'}</td></tr>
                                </tbody></table></div>
                            </div>
                            <div class="section">
                                <div class="section-title">4. ADDRESS</div>
                                <div class="section-content"><table><tbody>
                                    <tr><td colspan="2" class="subheader">Current Address</td></tr>
                                    <tr><td class="label">Address</td><td class="value">${addr.currentAddressLine1 || '—'}</td></tr>
                                    <tr><td class="label">City / State / Pin</td><td class="value">${[addr.currentCity, addr.currentState, addr.currentPincode].filter(Boolean).join(', ') || '—'}</td></tr>
                                </tbody></table></div>
                            </div>
                            <div class="section">
                                <div class="section-title">5. ACADEMIC RECORD</div>
                                <div class="section-content"><table><tbody>
                                    <tr><td colspan="2" class="subheader">SSLC / 10th</td></tr>
                                    <tr><td class="label">Board</td><td class="value">${acad.tenthBoard || '—'}</td></tr>
                                    <tr><td class="label">Year</td><td class="value">${acad.tenthPassingYear || '—'}</td></tr>
                                    <tr><td class="label">Percentage</td><td class="value">${acad.tenthPercentage ? `${acad.tenthPercentage}%` : '—'}</td></tr>
                                    ${showPUC ? `
                                    <tr><td colspan="2" class="subheader">PUC / 12th</td></tr>
                                    <tr><td class="label">Board</td><td class="value">${acad.twelfthBoard || '—'}</td></tr>
                                    <tr><td class="label">Year</td><td class="value">${acad.twelfthPassingYear || '—'}</td></tr>
                                    <tr><td class="label">Percentage</td><td class="value">${acad.twelfthPercentage ? `${acad.twelfthPercentage}%` : '—'}</td></tr>
                                    ` : ''}
                                    ${showDiploma ? `
                                    <tr><td colspan="2" class="subheader">Diploma details (Lateral Entry)</td></tr>
                                    <tr><td class="label">University</td><td class="value">${acad.diplomaUniversity || '—'}</td></tr>
                                    <tr><td class="label">Year</td><td class="value">${acad.diplomaYear || '—'}</td></tr>
                                    <tr><td class="label">Percentage</td><td class="value">${acad.diplomaPercentage ? `${acad.diplomaPercentage}%` : '—'}</td></tr>
                                    ` : ''}
                                </tbody></table></div>
                            </div>
                        </div>
                        <div class="declaration">
                            <div class="declaration-title">DECLARATION</div>
                            <div class="declaration-text">I hereby declare that the information furnished above is true, complete and correct to the best of my knowledge and belief.</div>
                        </div>
                        <div class="signature">
                            <div class="signature-item">
                                <div class="signature-line"></div>
                                <div class="signature-label">Date &amp; Place</div>
                            </div>
                            <div class="signature-item">
                                ${signatureUrl ? (signatureLoaded ? `<img class="signature-img" src="${signatureUrl}" alt="Signature" crossOrigin="anonymous" />` : `<span style="font-size: 8px; color: red; display: block; margin-bottom: 5px;">Signature Not Loaded</span>`) : `<span style="font-size: 8px; color: #999; display: block; margin-bottom: 5px;">Signature Not Uploaded</span>`}
                                <div class="signature-line"></div>
                                <div class="signature-label">Applicant Signature</div>
                            </div>
                        </div>
                        <div class="footer">
                            <p>Admission No: ${details?.applicationNumber || 'N/A'} &nbsp;|&nbsp; Status: ${pdfStatus} &nbsp;|&nbsp; Printed on: ${new Date().toLocaleString('en-IN')}</p>
                            <div style="border-top:1px solid #dde1e8;margin:5px 0;"></div>
                            <p>Contact: 099448693987 | principal@jcer.in</p>
                        </div>

                        ${imageDocs.length > 0 ? `
                        <div class="section" style="page-break-before: always; break-before: always; margin-top: 20px;">
                            <div class="section-title">SUPPORTING DOCUMENTS</div>
                            <div class="section-content" style="border: none;">
                                <div style="display: grid; grid-template-columns: 1fr; gap: 30px; margin-top: 15px;">
                                    ${imageDocs.map(d => {
                                        const item = loadedImageDocs[d.label];
                                        if (item && item.loaded) {
                                            return `
                                                <div style="break-inside: avoid; page-break-inside: avoid; border: 1px solid #dde1e8; padding: 15px; background: white; text-align: center;">
                                                    <h3 style="font-size: 11pt; color: #1a3c6e; margin-bottom: 10px; border-bottom: 2px solid #1a3c6e; display: inline-block; padding-bottom: 3px;">${d.label}</h3>
                                                    <div style="max-height: 400px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-top: 5px;">
                                                        <img src="${d.url}" alt="${d.label}" crossOrigin="anonymous" style="max-width: 100%; max-height: 380px; object-fit: contain;" />
                                                    </div>
                                                </div>
                                            `;
                                        } else {
                                            return `
                                                <div style="break-inside: avoid; page-break-inside: avoid; border: 1.5px dashed #f87171; padding: 15px; background: #fff5f5; text-align: center; color: #b91c1c;">
                                                    <h3 style="font-size: 11pt; margin-bottom: 5px;">${d.label}</h3>
                                                    <p style="font-size: 9pt;">Document Image Failed to Load</p>
                                                </div>
                                            `;
                                        }
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </body>
                </html>
            `;

            // Log the final printed HTML (Step 4)
            console.log("printHTML", printHTML);

            toast.dismiss(toastId);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(printHTML);
                printWindow.document.title = "";
                printWindow.document.close();

                await Promise.all(
                    Array.from(printWindow.document.images)
                        .filter(img => !img.complete)
                        .map(img =>
                            new Promise(resolve => {
                                img.onload = resolve;
                                img.onerror = resolve;
                            })
                        )
                );
                printWindow.focus();
                printWindow.print();
            } else {
                toast.error('Please allow popups from this site to download the PDF.');
            }
        } catch (error) {
            toast.dismiss(toastId);
            console.error(error);
            toast.error('Failed to generate admission PDF.');
        }
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
