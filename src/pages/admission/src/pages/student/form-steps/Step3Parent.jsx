import React, { useState } from 'react';
import api from '../../../../../../services/api';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Step3Parent = ({ onNext, onPrev, data, updateData, applicationStatus, readOnly = false }) => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (readOnly) {
            onNext();
            return;
        }

        setLoading(true);
        try {
            const payload = {
                fatherName: data.fatherName,
                motherName: data.motherName,
                fatherPhone: data.parentMobile || data.fatherPhone,
                fatherEmail: data.parentEmail || data.fatherEmail,
                fatherOccupation: data.occupation || data.fatherOccupation,
                fatherAnnualIncome: (data.annualIncome !== undefined && data.annualIncome !== '' && data.annualIncome !== null)
                    ? parseFloat(data.annualIncome)
                    : (data.fatherAnnualIncome !== undefined && data.fatherAnnualIncome !== '' && data.fatherAnnualIncome !== null)
                        ? parseFloat(data.fatherAnnualIncome)
                        : null,
                motherOccupation: data.motherOccupation || '',
                motherPhone: data.motherPhone || '',
            };

            const res = await api.put('/student/parent', payload);
            if (res.data.success) {
                toast.success('Parent details saved!');
                onNext();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save parent details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        updateData({ [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-slate-900">Step 3: Parent Information</h2>
                </div>
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded text-xs font-semibold">
                    Parent Details
                </span>
            </div>
            
            <fieldset disabled={readOnly} className="space-y-6 flex flex-col p-0 m-0 border-0 w-full">

            {/* Father's Details */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Father's Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Father's Name <span className="text-red-500">*</span></label>
                        <input required type="text" name="fatherName" className="input-premium h-11 uppercase" value={data.fatherName || ''} onChange={handleChange} placeholder="Enter father's name" />
                        {!data.fatherName && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Father's Mobile No. <span className="text-red-500">*</span></label>
                        <input required type="tel" name="parentMobile" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="input-premium h-11 uppercase" value={data.parentMobile || data.fatherPhone || ''} onChange={handleChange} placeholder="Enter father's mobile number" />
                        {!(data.parentMobile || data.fatherPhone) && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Father's Occupation <span className="text-red-500">*</span></label>
                        <input required type="text" name="occupation" className="input-premium h-11 uppercase" value={data.occupation || data.fatherOccupation || ''} onChange={handleChange} placeholder="Enter father's occupation" />
                        {!(data.occupation || data.fatherOccupation) && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Mother's Details */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Mother's Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Mother's Name <span className="text-red-500">*</span></label>
                        <input required type="text" name="motherName" className="input-premium h-11 uppercase" value={data.motherName || ''} onChange={handleChange} placeholder="Enter mother's name" />
                        {!data.motherName && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Mother's Mobile No. <span className="text-red-500">*</span></label>
                        <input required type="tel" name="motherPhone" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="input-premium h-11 uppercase" value={data.motherPhone || ''} onChange={handleChange} placeholder="Enter mother's mobile number" />
                        {!data.motherPhone && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Mother's Occupation <span className="text-red-500">*</span></label>
                        <input required type="text" name="motherOccupation" className="input-premium h-11 uppercase" value={data.motherOccupation || ''} onChange={handleChange} placeholder="Enter mother's occupation" />
                        {!data.motherOccupation && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Family Information */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Family Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Parent Email ID</label>
                        <input type="email" name="parentEmail" className="input-premium h-11" value={data.parentEmail || data.fatherEmail || ''} onChange={handleChange} placeholder="Enter parent email" />
                    </div>

                    <div className="space-y-1.5 lg:col-span-1">
                        <label className="text-sm font-medium text-slate-700">Annual Income (₹) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                            <input required type="number" min="0" name="annualIncome" inputMode="numeric" className="input-premium h-11" style={{ paddingLeft: '2.2rem' }} value={data.annualIncome || data.fatherAnnualIncome || ''} onChange={handleChange} placeholder="Enter annual income" />
                        </div>
                        {!(data.annualIncome || data.fatherAnnualIncome) && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                </div>
            </div>
            </fieldset>

            <div className="pt-4 sm:pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md p-3 sm:p-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 sm:static sm:bg-transparent z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] sm:shadow-none">
                <button type="button" onClick={onPrev} className="btn-secondary w-full sm:w-auto min-h-[48px] sm:min-h-[44px] h-11 px-5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
                    <ChevronLeft size={16} /> Back
                </button>
                <button type="submit" id="bottom-submit-btn" disabled={loading} className="btn-primary w-full sm:w-auto min-h-[48px] sm:min-h-[44px] h-11 px-6 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                        <>Save & Continue <ChevronRight size={16} /></>
                    )}
                </button>
            </div>
        </form>
    );
};

export default Step3Parent;
