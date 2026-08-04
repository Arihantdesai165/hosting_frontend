import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { Loader2, ChevronRight, CheckCircle2, XCircle, Fingerprint, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import SelectDropdown from '../../../components/SelectDropdown';

const Step1Admission = ({ onNext, data, updateData, applicationStatus, readOnly = false }) => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Validation states
    const [isCheckingAadhaar, setIsCheckingAadhaar] = useState(false);
    const [aadhaarError, setAadhaarError] = useState('');
    const [isCheckingCet, setIsCheckingCet] = useState(false);
    const [cetError, setCetError] = useState('');

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const res = await api.get('/branches');
                if (res.data.success) setBranches(res.data.data);
            } catch (err) {
                toast.error('Failed to load branches', { id: 'fetch-branches-error' });
            }
        };
        fetchBranches();
    }, []);

    // ── Aadhaar Debounced Check ────────────────────────────
    useEffect(() => {
        const checkAadhaarUniqueness = async () => {
            const val = data.aadhaar;
            if (!val || val.length !== 12 || isNaN(val)) {
                if (val && val.length > 0 && (val.length !== 12 || isNaN(val))) {
                    setAadhaarError('Aadhaar must be a 12-digit number');
                } else {
                    setAadhaarError('');
                }
                return;
            }

            setIsCheckingAadhaar(true);
            setAadhaarError('');

            try {
                const res = await api.post('/student/check-aadhaar', { aadhaar: val });
                if (res.data.exists) {
                    setAadhaarError('This Aadhaar is already registered with another application.');
                } else {
                    setAadhaarError('');
                }
            } catch (err) {
                console.error('Aadhaar check failed', err);
            } finally {
                setIsCheckingAadhaar(false);
            }
        };

        const timer = setTimeout(checkAadhaarUniqueness, 600);
        return () => clearTimeout(timer);
    }, [data.aadhaar]);

    // ── CET Number Debounced Check ─────────────────────────
    useEffect(() => {
        const checkCetUniqueness = async () => {
            const val = data.cetNumber || data.dcetNumber;
            const type = data.admissionType;

            if (!val || val.length < 3 || type === 'MANAGEMENT') {
                setCetError('');
                return;
            }

            setIsCheckingCet(true);
            setCetError('');

            try {
                const res = await api.post('/student/check-cet', { 
                    cetNumber: val,
                    type: type
                });
                if (res.data.exists) {
                    setCetError(`This ${type} registration number is already in use.`);
                } else {
                    setCetError('');
                }
            } catch (err) {
                console.error('CET check failed', err);
            } finally {
                setIsCheckingCet(false);
            }
        };

        const timer = setTimeout(checkCetUniqueness, 600);
        return () => clearTimeout(timer);
    }, [data.cetNumber, data.dcetNumber, data.admissionType]);

    // Auto-synchronize qualification based on admissionType for KCET and DCET
    useEffect(() => {
        if (data.admissionType === 'KCET' && data.qualification !== 'PUC') {
            updateData({ qualification: 'PUC' });
        } else if (data.admissionType === 'DCET' && data.qualification !== 'DIPLOMA') {
            updateData({ qualification: 'DIPLOMA' });
        }
    }, [data.admissionType, data.qualification, updateData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (readOnly) {
            onNext();
            return;
        }
        
        if (aadhaarError || cetError) {
            toast.error('Please resolve the errors before proceeding.');
            return;
        }

        if (!data.aadhaar || data.aadhaar.length !== 12) {
            toast.error('Please enter a valid 12-digit Aadhaar number.');
            return;
        }

        if (!data.qualification) {
            toast.error('Please select your qualification.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                admissionType: data.admissionType,
                branchId: data.branchId || null,
                aadhaar: data.aadhaar,
                cetNumber: data.cetNumber,
                dcetNumber: data.dcetNumber,
                qualification: data.qualification
            };

            const res = await api.post('/student/create', payload);
            if (res.data.success) {
                toast.success('Admission info saved!');
                onNext();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save admission info');
        } finally {
            setLoading(false);
        }
    };

    const isFormDisabled = !readOnly && (loading || isCheckingAadhaar || isCheckingCet || !!aadhaarError || !!cetError);

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <fieldset disabled={readOnly} className="space-y-6 flex flex-col p-0 m-0 border-0 w-full">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                <h2 className="text-lg font-semibold text-slate-900">Step 1: Admission Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Admission Type */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">Admission Type <span className="text-red-500">*</span></label>
                    <SelectDropdown
                        id="admissionType"
                        required
                        value={data.admissionType || ''}
                        onChange={(val) => {
                            const updates = { admissionType: val, cetNumber: '', dcetNumber: '' };
                            if (val === 'DCET') {
                                updates.qualification = 'DIPLOMA';
                            } else if (val === 'KCET') {
                                updates.qualification = 'PUC';
                            }
                            updateData(updates);
                        }}
                        placeholder="Select admission type..."
                        options={[
                            { value: 'KCET', label: 'KCET (Karnataka Common Entrance Test)' },
                            { value: 'DCET', label: 'DCET (Diploma Entrance Test)' },
                            { value: 'MANAGEMENT', label: 'Management Quota' },
                        ]}
                    />
                    {!data.admissionType && applicationStatus === 'REJECTED' && (
                        <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                    )}
                </div>

                {/* Preferred Branch */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">Preferred Branch <span className="text-red-500">*</span></label>
                    <SelectDropdown
                        id="branchId"
                        required
                        value={data.branchId || ''}
                        onChange={(val) => updateData({ branchId: val })}
                        placeholder="Select preferred engineering branch..."
                        options={branches.map(b => ({ value: b.id, label: `${b.name} (${b.code})` }))}
                    />
                    {!data.branchId && applicationStatus === 'REJECTED' && (
                        <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                    )}
                </div>

                {/* Qualification (displayed only for MANAGEMENT) */}
                {data.admissionType === 'MANAGEMENT' && (
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Qualification <span className="text-red-500">*</span></label>
                        <SelectDropdown
                            id="qualification"
                            required
                            value={data.qualification || ''}
                            onChange={(val) => updateData({ qualification: val })}
                            placeholder="Select qualification..."
                            options={[
                                { value: 'PUC', label: 'PUC / 12th Standard' },
                                { value: 'DIPLOMA', label: 'Diploma' },
                            ]}
                        />
                        {!data.qualification && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                )}

                {/* Aadhaar Number */}
                <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Fingerprint size={16} className="text-slate-400" />
                        Aadhaar Number (UIDAI) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            required
                            type="text"
                            maxLength={12}
                            placeholder="Enter 12-digit aadhaar number"
                            className={`input-premium h-11 pr-10 uppercase ${
                                aadhaarError ? 'border-red-500 ring-red-50' : 
                                (data.aadhaar?.length === 12 && !isCheckingAadhaar) ? 'border-emerald-500 ring-emerald-50' : ''
                            }`}
                            value={data.aadhaar || ''}
                            onChange={(e) => updateData({ aadhaar: e.target.value.replace(/\D/g, '') })}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                            {isCheckingAadhaar && <Loader2 size={18} className="animate-spin text-slate-400" />}
                            {!isCheckingAadhaar && data.aadhaar?.length === 12 && !aadhaarError && <CheckCircle2 size={18} className="text-emerald-500" />}
                            {!isCheckingAadhaar && aadhaarError && <XCircle size={18} className="text-red-500" />}
                        </div>
                    </div>
                    {!data.aadhaar && applicationStatus === 'REJECTED' && (
                        <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                    )}
                    {aadhaarError ? (
                        <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                            <XCircle size={12} /> {aadhaarError}
                        </p>
                    ) : (
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Info size={12} /> Aadhaar is required to prevent duplicate application profiles.
                        </p>
                    )}
                </div>

                {/* KCET Number */}
                {data.admissionType === 'KCET' && (
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">KCET Number <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                required
                                type="text"
                                className={`input-premium h-11 uppercase pr-10 ${cetError ? 'border-red-500' : ''}`}
                                value={data.cetNumber || ''}
                                onChange={(e) => updateData({ cetNumber: e.target.value.toUpperCase() })}
                                placeholder="Enter kcet number"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                {isCheckingCet && <Loader2 size={18} className="animate-spin text-slate-400" />}
                                {!isCheckingCet && data.cetNumber?.length > 3 && !cetError && <CheckCircle2 size={18} className="text-emerald-500" />}
                                {!isCheckingCet && cetError && <XCircle size={18} className="text-red-500" />}
                            </div>
                        </div>
                        {!data.cetNumber && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                        {cetError && <p className="text-[11px] font-medium text-red-500">{cetError}</p>}
                    </div>
                )}

                {/* DCET Number */}
                {data.admissionType === 'DCET' && (
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">DCET Number <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                required
                                type="text"
                                className={`input-premium h-11 uppercase pr-10 ${cetError ? 'border-red-500' : ''}`}
                                value={data.dcetNumber || ''}
                                onChange={(e) => updateData({ dcetNumber: e.target.value.toUpperCase() })}
                                placeholder="Enter dcet number"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                {isCheckingCet && <Loader2 size={18} className="animate-spin text-slate-400" />}
                                {!isCheckingCet && data.dcetNumber?.length > 3 && !cetError && <CheckCircle2 size={18} className="text-emerald-500" />}
                                {!isCheckingCet && cetError && <XCircle size={18} className="text-red-500" />}
                            </div>
                        </div>
                        {!data.dcetNumber && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                        {cetError && <p className="text-[11px] font-medium text-red-500">{cetError}</p>}
                    </div>
                )}
            </div>
            </fieldset>

            <div className="flex justify-end items-center pt-4 sm:pt-6 border-t border-slate-100 mt-6 sm:mt-8 sticky bottom-0 bg-white/95 backdrop-blur-md p-3 sm:p-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 sm:static sm:bg-transparent z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] sm:shadow-none">
                <button 
                    type="submit" 
                    id="bottom-submit-btn"
                    disabled={isFormDisabled} 
                    className={`btn-primary min-h-[48px] sm:min-h-[44px] h-11 px-8 w-full sm:w-auto flex items-center justify-center ${isFormDisabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                        <span className="flex items-center gap-2">
                            Save & Continue
                            <ChevronRight size={16} />
                        </span>
                    )}
                </button>
            </div>
        </form>
    );
};

export default Step1Admission;
