import React, { useState } from 'react';
import api from '../../../api/axios';
import { Loader2, UploadCloud, CheckCircle, FileText, User, Image, ClipboardIcon, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressDocumentImage, validateImageType } from '../../../utils/imageCompressor';

const ACCEPTED_MIME = 'image/jpeg,image/jpg,image/png';

const Step6Documents = ({ onNext, onPrev, data, onUploadSuccess, applicationStatus, readOnly = false }) => {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState({});
    const [compressing, setCompressing] = useState({});
    const [validating, setValidating] = useState({});

    const isDiplomaApplicant = data?.qualification === 'DIPLOMA';

    const DOCS = [
        { name: 'photo',           label: 'Recent Passport Photo',            icon: User,          note: 'Accepted: JPG / PNG' },
        { name: 'signature',       label: 'E-Signature / Scanned Sign',        icon: ClipboardIcon, note: 'Accepted: JPG / PNG' },
        { name: 'sslcMarkscard',   label: 'SSLC / 10th Marks Card',            icon: FileText,      note: 'Accepted: JPG / PNG' },
        ...(isDiplomaApplicant ? [
            { name: 'diplomaSemester5Marksheet', label: 'Diploma 5th Semester Marks Card', icon: GraduationCap, note: 'Accepted: JPG / PNG' },
            { name: 'diplomaSemester6Marksheet', label: 'Diploma 6th Semester Marks Card', icon: GraduationCap, note: 'Accepted: JPG / PNG' },
        ] : [
            { name: 'pucMarkscard',    label: 'PUC / 12th Marks Card',            icon: GraduationCap, note: 'Accepted: JPG / PNG' },
        ]),
        { name: 'aadhaar',          label: 'Aadhaar Card Copy',               icon: FileText,      note: 'Accepted: JPG / PNG' },
        {
            name: 'cetScoreCard',
            label: 'Entrance Score Card (CET/DCET)',
            icon: FileText,
            note: data?.admissionType === 'MANAGEMENT' ? 'Accepted: JPG / PNG (Optional for Management)' : 'Accepted: JPG / PNG',
        },
        { name: 'feesPaidReceipt',  label: 'Fees Paid Receipt',               icon: FileText,      note: 'Accepted: JPG / PNG' },
        { name: 'casteCertificate',  label: 'Caste Certificate',              icon: Image,         note: 'Accepted: JPG / PNG (Optional)' },
        { name: 'incomeCertificate', label: 'Income Certificate',             icon: Image,         note: 'Accepted: JPG / PNG (Optional)' },
        { name: 'studyCertificate',  label: '7 Years Study Certificate',       icon: FileText,      note: 'Accepted: JPG / PNG' },
    ];

    const API_FIELDS = {
        photo:                     'photo',
        signature:                 'signature',
        sslcMarkscard:             'tenthMarksheet',
        pucMarkscard:              'twelfthMarksheet',
        diplomaSemester5Marksheet: 'diplomaSemester5Marksheet',
        diplomaSemester6Marksheet: 'diplomaSemester6Marksheet',
        aadhaar:                   'aadhaar',
        cetScoreCard:              'cetScoreCard',
        casteCertificate:          'casteCertificate',
        incomeCertificate:         'gapCertificate',
        studyCertificate:          'domicileCertificate',
        feesPaidReceipt:           'feesPaidReceipt',
    };

    const COLOR_REQUIRED_DOCS = ['photo', 'sslcMarkscard', 'aadhaar', 'feesPaidReceipt'];

    const handleFileChange = async (e, docName) => {
        const file = e.target.files[0];
        // Reset input so same file can be re-selected after error
        e.target.value = '';

        if (!file) return;

        // 1. Validate image format (JPG / JPEG / PNG)
        const typeCheck = validateImageType(file);
        if (!typeCheck.valid) {
            toast.error(typeCheck.error);
            return;
        }

        const needsColorCheck = COLOR_REQUIRED_DOCS.includes(docName);
        setCompressing(prev => ({ ...prev, [docName]: true }));

        try {
            // 2. Document-specific color validation check
            if (needsColorCheck) {
                const formData = new FormData();
                formData.append('document', file);
                formData.append('documentType', API_FIELDS[docName] || docName);

                const valRes = await api.post('/student/validate-document', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (!valRes.data.success) {
                    toast.error(valRes.data.message || 'Please upload the original COLOR image of this document.');
                    setFiles(prev => ({ ...prev, [docName]: null }));
                    return;
                }
            }

            // 3. Compress & store file for upload
            const compressed = await compressDocumentImage(file, docName);
            setFiles(prev => ({ ...prev, [docName]: compressed }));
            toast.success(`${file.name} selected`, { duration: 3000 });
        } catch (err) {
            if (needsColorCheck) {
                const errMsg = err.response?.data?.message || 'Please upload the original COLOR image of this document.';
                toast.error(errMsg);
                setFiles(prev => ({ ...prev, [docName]: null }));
            } else {
                setFiles(prev => ({ ...prev, [docName]: file }));
                toast.success(`${file.name} selected`, { duration: 3000 });
            }
        } finally {
            setCompressing(prev => ({ ...prev, [docName]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (readOnly) {
            onNext();
            return;
        }

        const isPhotoPresent     = files.photo        || data?.photo        || data?.photoUrl;
        const isSignaturePresent = files.signature    || data?.signature    || data?.signatureUrl;
        const isSslcPresent      = files.sslcMarkscard || data?.sslcMarkscard || data?.tenthMarksheetUrl;
        const isAadhaarPresent   = files.aadhaar      || data?.aadhaarUrl;
        const isCetPresent       = files.cetScoreCard || data?.cetScoreCard || data?.cetScoreCardUrl;
        const isFeesPaidPresent  = files.feesPaidReceipt || data?.feesPaidReceiptUrl;

        if (!isPhotoPresent || !isSignaturePresent || !isSslcPresent) {
            toast.error('Photo, Signature, and SSLC marks card are required');
            return;
        }

        if (isDiplomaApplicant) {
            const isDip5Present = files.diplomaSemester5Marksheet || data?.diplomaSemester5MarksheetUrl;
            const isDip6Present = files.diplomaSemester6Marksheet || data?.diplomaSemester6MarksheetUrl;
            if (!isDip5Present || !isDip6Present) {
                toast.error('Diploma 5th Semester Marks Card and 6th Semester Marks Card are required');
                return;
            }
        } else {
            const isPucPresent = files.pucMarkscard || data?.pucMarkscard || data?.twelfthMarksheetUrl;
            if (!isPucPresent) {
                toast.error('PUC / 12th Marks Card is required');
                return;
            }
        }

        if (!isAadhaarPresent) {
            toast.error('Aadhaar Card is required');
            return;
        }
        if (data?.admissionType !== 'MANAGEMENT' && !isCetPresent) {
            toast.error('Entrance Score Card (CET/DCET) is required');
            return;
        }
        if (!isFeesPaidPresent) {
            toast.error('Fees Paid Receipt is required');
            return;
        }
        if (Object.keys(files).length === 0) {
            onNext();
            return;
        }

        setLoading(true);

        const formData = new FormData();
        Object.keys(files).forEach(key => {
            if (files[key]) {
                formData.append(API_FIELDS[key] || key, files[key]);
            }
        });

        try {
            const res = await api.post('/student/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
                toast.success('Documents uploaded successfully!');
                if (onUploadSuccess) await onUploadSuccess();
                onNext();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to upload documents');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-slate-900">Step 6: Document Upload</h2>
                </div>
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded text-xs font-semibold">
                    Document Verification
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DOCS.map(doc => {
                    const DB_MAP = {
                        photo:                     'photoUrl',
                        signature:                 'signatureUrl',
                        sslcMarkscard:             'tenthMarksheetUrl',
                        pucMarkscard:              'twelfthMarksheetUrl',
                        diplomaSemester5Marksheet: 'diplomaSemester5MarksheetUrl',
                        diplomaSemester6Marksheet: 'diplomaSemester6MarksheetUrl',
                        aadhaar:                   'aadhaarUrl',
                        cetScoreCard:              'cetScoreCardUrl',
                        casteCertificate:          'casteCertificateUrl',
                        incomeCertificate:         'gapCertificateUrl',
                        studyCertificate:          'domicileCertificateUrl',
                        feesPaidReceipt:           'feesPaidReceiptUrl',
                    };
                    const isFileSelected  = !!files[doc.name];
                    const isFileInDb      = doc.name === 'aadhaar'
                        ? !!data?.aadhaarUrl
                        : !!(data?.[doc.name] || data?.[DB_MAP[doc.name]]);
                    const isComplete      = isFileSelected || isFileInDb;
                    const isCompressing   = !!compressing[doc.name];
                    const isBusy          = isCompressing;
                    const isRequired      = ['photo', 'signature', 'sslcMarkscard', 'pucMarkscard', 'diplomaSemester5Marksheet', 'diplomaSemester6Marksheet', 'aadhaar', 'feesPaidReceipt'].includes(doc.name) ||
                        (doc.name === 'cetScoreCard' && data?.admissionType !== 'MANAGEMENT');

                    return (
                        <div
                            key={doc.name}
                            className={`p-4 rounded-lg border transition-all ${
                                isComplete
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-slate-200 hover:border-primary-300'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                    isComplete ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {isComplete ? <CheckCircle size={18} /> : <doc.icon size={18} />}
                                </div>
                                {isRequired && (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                        isComplete ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white'
                                    }`}>
                                        {isComplete ? 'Uploaded' : 'Required'}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{doc.label}</h3>
                            <p className="text-xs text-slate-500 mb-3">{doc.note}</p>

                            <label className={`block w-full ${isBusy || readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border transition-colors text-sm ${
                                    isBusy || readOnly
                                        ? 'bg-slate-100 border-slate-200 text-slate-400 font-medium'
                                        : isComplete
                                        ? 'border-dashed bg-white border-green-200 text-green-600 font-medium'
                                        : 'border-solid bg-slate-800 border-slate-800 text-white hover:bg-slate-900 hover:border-slate-900 font-medium'
                                }`}>
                                    {isCompressing
                                        ? <><Loader2 size={16} className="animate-spin text-amber-600" /> Processing…</>
                                        : <><UploadCloud size={16} /> {isComplete ? 'Update File' : 'Choose File'}</>
                                    }
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept={ACCEPTED_MIME}
                                    disabled={isBusy || readOnly}
                                    onChange={(e) => handleFileChange(e, doc.name)}
                                />
                            </label>

                            {!isComplete && isRequired && applicationStatus === 'REJECTED' && (
                                <p className="text-red-500 text-[11px] font-bold mt-2 animate-pulse text-center">
                                    Please upload this document mandatorily
                                </p>
                            )}

                             {(isFileSelected || isFileInDb) && (
                                 <div className="mt-2 flex items-center justify-between px-2 py-1.5 bg-white rounded border border-slate-100">
                                     <div className="flex items-center gap-1.5 overflow-hidden">
                                         <FileText size={12} className="text-primary-600" />
                                         <p className="text-[11px] font-medium text-slate-600 truncate">
                                             {isFileSelected ? files[doc.name].name : 'Previously uploaded'}
                                         </p>
                                     </div>
                                     {!isFileSelected && isFileInDb && data?.[DB_MAP[doc.name]] && (
                                         <a href={data[DB_MAP[doc.name]]} target="_blank" rel="noreferrer" className="text-[10px] text-primary-600 hover:underline font-bold shrink-0">
                                             View
                                         </a>
                                     )}
                                 </div>
                             )}
                        </div>
                    );
                })}
            </div>

            <div className="pt-4 sm:pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md p-3 sm:p-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 sm:static sm:bg-transparent z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] sm:shadow-none">
                <button type="button" onClick={onPrev} className="btn-secondary w-full sm:w-auto min-h-[48px] sm:min-h-[44px] h-11 px-5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
                    <ChevronLeft size={16} /> Back
                </button>
                <button
                    type="submit"
                    id="bottom-submit-btn"
                    disabled={loading || Object.values(compressing).some(Boolean) || Object.values(validating).some(Boolean)}
                    className="btn-primary w-full sm:w-auto min-h-[48px] sm:min-h-[44px] h-11 px-6 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold"
                >
                    {loading
                        ? <Loader2 size={18} className="animate-spin" />
                        : <>Upload & Continue <ChevronRight size={16} /></>
                    }
                </button>
            </div>
        </form>
    );
};

export default Step6Documents;
