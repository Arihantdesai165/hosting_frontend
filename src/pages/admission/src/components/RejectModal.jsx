import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const RejectModal = ({ isOpen, onClose, onConfirm, isLoading = false }) => {
    const [remark, setRemark] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!remark.trim()) return;
        onConfirm(remark.trim());
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-red-900">Reject Application</h3>
                        <p className="text-xs text-red-600 mt-0.5">
                            This action will notify the student. Please provide a clear reason.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white border border-red-200 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="e.g., Invalid documents submitted, incorrect academic details, marks card not legible..."
                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 resize-none transition-all"
                            autoFocus
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            This remark will be visible to the student on their dashboard.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="h-10 px-5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!remark.trim() || isLoading}
                        className={`h-10 px-6 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${
                            remark.trim()
                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <AlertTriangle size={14} />
                        )}
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectModal;
