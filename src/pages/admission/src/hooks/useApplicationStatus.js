import { useState, useEffect, useCallback } from 'react';
import api from '../../../../services/api';

const useApplicationStatus = () => {
    const [stepStatus, setStepStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatus = useCallback(async () => {
        try {
            setError(null);
            // Backend returns { applicationStatus, steps, stepStatus, completedCount, ... }
            const res = await api.get('/student/step-status');
            if (res.data.success) {
                setStepStatus(res.data.data);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                // Not logged in — handled by ProtectedRoute
                setLoading(false);
                return;
            }
            // Any error — set a blank state so the form still renders at step 1
            setStepStatus({
                applicationStatus: 'DRAFT',
                steps: [],
                stepStatus: { 1: 'ACTIVE', 2: 'LOCKED', 3: 'LOCKED', 4: 'LOCKED', 5: 'LOCKED', 6: 'LOCKED', 7: 'LOCKED' },
                completedCount: 0,
                totalSteps: 7,
                progressPercent: 0,
                activeStepIndex: 1,
                applicationNumber: null,
                studentId: null,
                adminRemarks: null,
            });
            if (err.response?.status !== 404) {
                setError(err.response?.data?.message || 'Failed to fetch status');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        
        // Fetch continuously every 30 seconds to keep data fresh
        const intervalId = setInterval(() => {
            fetchStatus();
        }, 30000);
        
        return () => clearInterval(intervalId);
    }, [fetchStatus]);

    /**
     * getStepState(stepIndex: 1-7) → 'COMPLETED' | 'ACTIVE' | 'LOCKED'
     * Maps to the backend stepStatus map: { 1: 'COMPLETED', 2: 'ACTIVE', 3: 'LOCKED', ... }
     */
    const getStepState = useCallback((stepIndex) => {
        if (!stepStatus?.stepStatus) return 'LOCKED';
        return stepStatus.stepStatus[stepIndex] || 'LOCKED';
    }, [stepStatus]);

    /**
     * isStepAccessible(stepIndex) → boolean
     * A step is accessible if it is COMPLETED or ACTIVE (not LOCKED)
     */
    const isStepAccessible = useCallback((stepIndex) => {
        const state = getStepState(stepIndex);
        return state === 'COMPLETED' || state === 'ACTIVE' || state === 'CORRECTION_REQUIRED';
    }, [getStepState]);

    return {
        stepStatus,
        loading,
        error,
        refetch: fetchStatus,
        getStepState,
        isStepAccessible,
    };
};

export default useApplicationStatus;
