import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice';
import authService from '../../services/auth.service';
import { RootState } from '../../store';
import Toast from '../../components/common/Toast';
import { Lock, Mail, ArrowRight, Loader2, X } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotRole, setForgotRole] = useState<'STUDENT' | 'TEACHER' | 'HOD' | 'PARENT' | 'PRINCIPAL'>('STUDENT');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setToast({ type: 'error', message: 'Session expired. Please log in again.' });
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const from = (location.state as any)?.from?.pathname || '/student/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setToast({ type: 'error', message: 'Please enter both User ID/Email and password.' });
      return;
    }

    try {
      dispatch(loginStart());
      const user = await authService.login(email, password);
      const token = authService.getToken() || '';
      dispatch(loginSuccess({ user, token }));
      
      const dashboardRoutes: Record<string, string> = {
        STUDENT: '/student/dashboard',
        TEACHER: '/teacher/dashboard',
        HOD: '/hod/dashboard',
        ADMIN: '/admin/dashboard',
        PRINCIPAL: '/principal/dashboard',
        PARENT: '/parent/dashboard',
      };

      const targetDashboard = dashboardRoutes[user.role];

      if (targetDashboard) {
        const redirectPath = (location.state as any)?.from?.pathname || targetDashboard;
        
        if (redirectPath.startsWith('/student') && user.role !== 'STUDENT') {
          navigate(targetDashboard, { replace: true });
        } else {
          navigate(redirectPath, { replace: true });
        }
      } else {
        authService.logout();
        dispatch(loginFailure('Invalid user role assigned.'));
        setToast({ type: 'error', message: 'Account configuration error. Please contact administration.' });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Authentication failed. Please check credentials.';
      dispatch(loginFailure(errMsg));
      setToast({ type: 'error', message: errMsg });
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitting(true);

    setTimeout(() => {
      const existing = localStorage.getItem('jcer_forgot_password_requests');
      const requests = existing ? JSON.parse(existing) : [];

      const newRequest = {
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: forgotEmail,
        role: forgotRole,
        status: 'PENDING',
        requestedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      };

      requests.unshift(newRequest);
      localStorage.setItem('jcer_forgot_password_requests', JSON.stringify(requests));

      setForgotSubmitting(false);
      setShowForgotModal(false);
      setForgotEmail('');
      setToast({
        type: 'success',
        message: '✅ Forgot password request submitted to Admin! They will reset & send your credentials via Email + SMS.',
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans text-neutral-900 selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Background Image Container with slight blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 blur-[3px] scale-105" 
        style={{ backgroundImage: 'url("/college.png")' }}
      />
      {/* Slightly blue/indigo dark overlay for readability and premium aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-blue-950/60 to-indigo-900/40 z-0"></div>
      
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Global Header Section */}
      <div className="w-full max-w-4xl text-center space-y-4 mb-6 z-10 hidden sm:block">
        <div className="flex justify-center">
          <div 
            className="w-[100px] h-[100px] rounded-full bg-white overflow-hidden flex items-center justify-center shadow-sm"
            style={{ backgroundColor: '#ffffff' }}
          >
            <img
              src="/logo.png"
              alt="JCER Logo"
              className="w-full h-full object-cover bg-white rounded-full"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            JAIN COLLEGE OF ENGINEERING AND RESEARCH
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-neutral-200 drop-shadow-sm">
            (Approved by AICTE, New Delhi, Affiliated to VTU Belagavi & Recognized by Govt. of Karnataka)
          </p>
          <p className="text-xs sm:text-sm font-semibold text-neutral-200 drop-shadow-sm">
            NBA Accredited Programs - ECE & ME
          </p>
          <p className="text-sky-300 pt-1 text-sm font-bold tracking-wider uppercase drop-shadow-sm">
            Secure ERP Portal
          </p>
        </div>
      </div>

      {/* Mobile-Only Header Layout */}
      <div className="w-full text-center space-y-3 mb-6 z-10 sm:hidden">
        <div className="flex justify-center">
          <div 
            className="w-[80px] h-[80px] rounded-full bg-white overflow-hidden flex items-center justify-center shadow-sm"
            style={{ backgroundColor: '#ffffff' }}
          >
            <img 
              src="/logo.png" 
              alt="JCER Logo" 
              className="w-full h-full object-cover bg-white rounded-full" 
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>
        </div>
        <div className="px-2 space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-white drop-shadow-md">JAIN COLLEGE OF ENGINEERING AND RESEARCH</h2>
          <p className="text-[11px] font-semibold text-neutral-200 leading-tight">Approved by AICTE • Affiliated to VTU • Recognized by Govt. of Karnataka</p>
          <p className="text-[11px] font-semibold text-neutral-200">NBA Accredited Programs - ECE & ME</p>
          <p className="text-sky-300 text-xs font-bold uppercase tracking-wider pt-0.5">Secure ERP Portal</p>
        </div>
      </div>

      {/* Login Card Container */}
      <div className="w-full max-w-md bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl z-10 p-6 sm:p-8 shadow-xl shadow-neutral-200/30">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User ID / Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider pl-1">
              User ID / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`e.g. STU-${new Date().getFullYear()}-4831`}
                className="w-full bg-white/90 border border-neutral-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none transition-all duration-200 placeholder:text-neutral-400 text-neutral-900 shadow-sm"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1 pr-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors bg-transparent border-none cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-white/90 border border-neutral-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none transition-all duration-200 placeholder:text-neutral-400 text-neutral-900 shadow-sm"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all duration-300 text-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-neutral-200/60">
          <div className="text-center text-xs font-medium text-neutral-500 space-y-1.5">
            <p>Demo Account: <span className="text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded">student@college.com</span></p>
            <p>Password: <span className="text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded">password123</span></p>
          </div>
        </div>
      </div>
      
      {/* Footer text */}
      <p className="mt-6 text-xs font-medium text-neutral-200 text-center drop-shadow-sm z-10">
        &copy; {new Date().getFullYear()} JCER Institute. All rights reserved.<br/>
        Protected by Role-Based Access Control
      </p>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/90 dark:bg-neutral-900/95 border border-white/20 rounded-[28px] shadow-2xl p-6 relative animate-fade-in">
            
            <button 
              onClick={() => { if (!forgotSubmitting) setShowForgotModal(false); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:scale-105 transition-all cursor-pointer border-none"
            >
              <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-950 dark:text-white">Request Password Recovery</h3>
                <p className="text-xs text-neutral-500">Your request will be sent to the administrator to securely regenerate and resend your login details.</p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">User ID or Registered Email</label>
                  <input
                    type="text"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. CS24001 or name@example.com"
                    className="w-full bg-white border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-xl py-2.5 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">Your Role</label>
                  <select
                    value={forgotRole}
                    onChange={(e) => setForgotRole(e.target.value as any)}
                    className="w-full bg-white border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-xl py-2.5 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 text-neutral-900 dark:text-white cursor-pointer"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="PARENT">Parent</option>
                    <option value="PRINCIPAL">Principal</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all text-xs cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
                >
                  {forgotSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    "Submit Request to Admin"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;