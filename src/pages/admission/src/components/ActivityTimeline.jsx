import {
    Send,
    Search,
    ShieldCheck,
    CheckCircle,
    XCircle,
    Clock,
    Award,
    Upload,
    FileCheck,
    AlertTriangle
} from 'lucide-react';

const TIMELINE_STEPS = [
    {
        key: 'submittedAt',
        label: 'Application Submitted',
        icon: Send,
        activeColor: 'text-blue-600',
        activeBg: 'bg-blue-100',
        activeBorder: 'border-blue-300',
        lineColor: 'bg-blue-300'
    },
    {
        key: 'rejectedAt',
        label: 'Application Rejected',
        icon: XCircle,
        activeColor: 'text-red-600',
        activeBg: 'bg-red-100',
        activeBorder: 'border-red-300',
        lineColor: 'bg-red-300',
        isNegative: true
    },
    {
        key: 'correctionRequestedAt',
        label: 'Correction Required',
        icon: AlertTriangle,
        activeColor: 'text-amber-600',
        activeBg: 'bg-amber-100',
        activeBorder: 'border-amber-300',
        lineColor: 'bg-amber-300'
    },
    {
        key: 'resubmittedAt',
        label: 'Application Resubmitted',
        icon: Send,
        activeColor: 'text-indigo-600',
        activeBg: 'bg-indigo-100',
        activeBorder: 'border-indigo-300',
        lineColor: 'bg-indigo-300'
    },
    {
        key: 'reviewStartedAt',
        label: 'Under Review',
        icon: Search,
        activeColor: 'text-amber-600',
        activeBg: 'bg-amber-100',
        activeBorder: 'border-amber-300',
        lineColor: 'bg-amber-300'
    },
    {
        key: 'documentsVerifiedAt',
        label: 'Documents Verified',
        icon: ShieldCheck,
        activeColor: 'text-teal-600',
        activeBg: 'bg-teal-100',
        activeBorder: 'border-teal-300',
        lineColor: 'bg-teal-300'
    },
    {
        key: 'approvedAt',
        label: 'Admission Approved',
        icon: CheckCircle,
        activeColor: 'text-emerald-600',
        activeBg: 'bg-emerald-100',
        activeBorder: 'border-emerald-300',
        lineColor: 'bg-emerald-300'
    },
    {
        key: 'forwardedToPrincipalAt',
        label: 'Forwarded to Principal',
        icon: Send,
        activeColor: 'text-violet-600',
        activeBg: 'bg-violet-100',
        activeBorder: 'border-violet-300',
        lineColor: 'bg-violet-300'
    },
    {
        key: 'usnAssignedAt',
        label: 'Admission Confirmed 🎉',
        icon: Award,
        activeColor: 'text-purple-600',
        activeBg: 'bg-purple-100',
        activeBorder: 'border-purple-300',
        lineColor: 'bg-purple-300',
        isFinal: true
    },
    {
        key: 'cancellationRequestedAt',
        label: 'Cancellation Requested',
        icon: Clock,
        activeColor: 'text-amber-600',
        activeBg: 'bg-amber-100',
        activeBorder: 'border-amber-300',
        lineColor: 'bg-amber-300'
    },
    {
        key: 'cancellationApprovedAt',
        label: 'Admission Cancelled',
        icon: XCircle,
        activeColor: 'text-red-600',
        activeBg: 'bg-red-100',
        activeBorder: 'border-red-300',
        lineColor: 'bg-red-300',
        isFinal: true
    }
];

const ActivityTimeline = ({ timeline = {}, compact = false }) => {
    // Determine which final step to show (approved OR rejected, not both)
    const isRejected = !!timeline.rejectedAt;
    const isApproved = !!timeline.approvedAt;
    const isCancelled = !!timeline.cancellationApprovedAt;
    const isCancellationRequested = !!timeline.cancellationRequestedAt;

    const stepsToShow = TIMELINE_STEPS.filter(step => {
        if (step.key === 'rejectedAt' && !isRejected) return false;
        if (step.key === 'correctionRequestedAt' && !timeline.correctionRequestedAt) return false;
        if (step.key === 'approvedAt' && isRejected) return false;
        if (step.key === 'cancellationRequestedAt' && !isCancellationRequested) return false;
        if (step.key === 'cancellationApprovedAt' && !isCancelled) return false;
        return true;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-0">
            {stepsToShow.map((step, index) => {
                const date = timeline[step.key];
                let isActive = !!date;

                // If the application was rejected and has not been resubmitted yet,
                // ensure all subsequent steps show as pending/inactive.
                if (isRejected && !timeline.resubmittedAt) {
                    const rejectedStepIndex = stepsToShow.findIndex(s => s.key === 'rejectedAt');
                    if (index > rejectedStepIndex) {
                        isActive = false;
                    }
                }

                const isLast = index === stepsToShow.length - 1;
                const Icon = step.icon;

                return (
                    <div key={step.key} className="flex gap-3 relative">
                        {/* Vertical line */}
                        {!isLast && (
                            <div className="absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)]">
                                <div className={`w-full h-full ${isActive ? step.lineColor : 'bg-slate-200'}`} />
                            </div>
                        )}

                        {/* Icon circle */}
                        <div className={`
                            relative z-10 flex-shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center border-2 transition-all duration-500
                            ${isActive
                                ? `${step.activeBg} ${step.activeBorder} ${step.activeColor}`
                                : 'bg-slate-50 border-slate-200 text-slate-300'}
                        `}>
                            {isActive ? (
                                <Icon size={compact ? 12 : 14} />
                            ) : (
                                <Clock size={compact ? 10 : 12} />
                            )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 ${compact ? 'pb-4' : 'pb-6'}`}>
                            <p className={`font-semibold text-sm leading-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                {step.label}
                            </p>
                            {isActive && date ? (
                                <p className={`text-xs mt-0.5 font-medium ${step.isNegative ? 'text-red-500' : 'text-slate-500'}`}>
                                    {formatDate(date)}
                                </p>
                            ) : (
                                <p className="text-xs mt-0.5 text-slate-300 italic">Pending</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActivityTimeline;
