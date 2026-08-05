import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { registerLoadingCallbacks } from '../../../../services/api';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
    const [activeRequests, setActiveRequests] = useState(0);
    const [globalLoading, setGlobalLoading] = useState(false);

    const startLoading = useCallback(() => {
        setActiveRequests((prev) => {
            const next = prev + 1;
            if (next > 0) setGlobalLoading(true);
            return next;
        });
    }, []);

    const stopLoading = useCallback(() => {
        setActiveRequests((prev) => {
            const next = Math.max(0, prev - 1);
            if (next === 0) setGlobalLoading(false);
            return next;
        });
    }, []);

    // Register Axios request tracking callbacks
    useEffect(() => {
        registerLoadingCallbacks(startLoading, stopLoading);
        return () => {
            registerLoadingCallbacks(() => {}, () => {});
        };
    }, [startLoading, stopLoading]);

    return (
        <LoadingContext.Provider value={{ globalLoading, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoadingContext = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoadingContext must be used within a LoadingProvider');
    }
    return context;
};
export default LoadingContext;
