import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token } = useAuth();

    if (!token) {
        return <Navigate to="/admission/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Redirect to their respective dashboards based on role
        if (user?.role === 'STUDENT') return <Navigate to="/admission/dashboard" replace />;
        if (user?.role === 'ADMISSION_OFFICER') return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/admission/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
