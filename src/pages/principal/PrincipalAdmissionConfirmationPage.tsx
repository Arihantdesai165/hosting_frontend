import React from 'react';
import { Navigate } from 'react-router-dom';

// Deprecated component - Principal works directly through Admissions Queue
export const PrincipalAdmissionConfirmationPage: React.FC = () => {
  return <Navigate to="/principal/admissions" replace />;
};

export default PrincipalAdmissionConfirmationPage;
