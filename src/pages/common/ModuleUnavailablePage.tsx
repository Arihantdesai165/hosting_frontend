import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';

export const ModuleUnavailablePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white relative font-sans overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-[32px] p-8 shadow-2xl space-y-6 z-10">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Module Unavailable</h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-semibold">
            This module is currently disabled in your organization's deployment. Please contact your system administrator if access is required.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-850 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return Home
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-450 transition-all cursor-pointer border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleUnavailablePage;
