import { Routes, Route, Navigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';

import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';

import DashboardLayout from './layouts/DashboardLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import AdmissionForm from './pages/student/AdmissionForm';

// Placeholder for unbuilt modules
const Placeholder = ({ name }) => (
  <div className="min-h-[60vh] flex items-center justify-center p-6 animate-fade-in">
    <div className="card-premium p-12 text-center max-w-md w-full shadow-2xl shadow-blue-900/5">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-8">
        <GraduationCap size={40} />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-4">{name}</h1>
      <p className="text-slate-500 font-medium leading-relaxed">This module is currently under development.</p>
      <div className="mt-10 pt-8 border-t border-slate-50">
        <button onClick={() => window.history.back()} className="text-blue-600 font-bold hover:underline">
          Return to previous page
        </button>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Student Admission Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student/dashboard"   element={<StudentDashboard />} />
          <Route path="/student/application" element={<AdmissionForm />} />
          <Route path="/student/*"           element={<Placeholder name="Student Module" />} />
        </Route>
      </Route>

      {/* Admin → redirect to main ERP admin portal */}
      {/* Admin management (approve/reject) is in the main ERP at /admin/admissions */}
      <Route path="/admin/*" element={<Navigate to="/admin/admissions" replace />} />

      {/* Root → login */}
      <Route path="/"  element={<Navigate to="/login" replace />} />
      <Route path="*"  element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
