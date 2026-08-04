import React from 'react';

const StatusBadge = ({ status }) => {
    let color = 'bg-slate-100 text-slate-600';
    let label = 'Unknown';

    switch (status) {
        case 'REGISTERED':
            color = 'bg-slate-100 text-slate-600';
            label = 'Draft';
            break;
        case 'SUBMITTED':
            color = 'bg-blue-50 text-blue-700 border border-blue-200';
            label = 'Submitted';
            break;
        case 'RESUBMITTED':
            color = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            label = 'Resubmitted';
            break;
        case 'UNDER_REVIEW':
            color = 'bg-amber-50 text-amber-700 border border-amber-200';
            label = 'Under Review';
            break;
        case 'DOCUMENT_VERIFIED':
            color = 'bg-teal-50 text-teal-700 border border-teal-200';
            label = 'Docs Verified';
            break;
        case 'CORRECTION_REQUIRED':
            color = 'bg-orange-50 text-orange-700 border border-orange-200';
            label = 'Needs Correction';
            break;
        case 'REJECTED':
            color = 'bg-red-50 text-red-700 border border-red-200';
            label = 'Rejected';
            break;
        case 'APPROVED':
        case 'ADMISSION_CONFIRMED':
            color = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            label = 'Approved';
            break;
        case 'ENROLLED':
        case 'USN_ASSIGNED':
            color = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            label = 'Admission Confirmed';
            break;
        default:
            label = status?.replace(/_/g, ' ') || 'Unknown';
            break;
    }

    return (
        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md tracking-wide ${color}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
