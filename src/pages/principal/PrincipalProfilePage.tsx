import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { toast } from 'react-toastify';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldAlert, 
  Calendar,
  Lock,
  Camera,
  CheckCircle,
  Building
} from 'lucide-react';
import API from '../../services/api';

export const PrincipalProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [phone, setPhone] = useState(user?.phone || '98765 43201');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning('New password & confirm password do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await API.put('/auth/change-password', {
        oldPassword,
        newPassword
      });
      if (res.data.success || res.status === 200) {
        toast.success('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Card */}
        <div className="lg:col-span-5 glass-panel rounded-[32px] p-6 shadow-ambient flex flex-col items-center justify-between text-center space-y-6">
          <div className="space-y-4 w-full flex flex-col items-center">
            <div className="relative">
              <img
                src={user?.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop'}
                alt="Principal"
                className="w-28 h-28 rounded-[28px] object-cover border-4 border-white dark:border-neutral-800 shadow-md"
              />
              <button 
                onClick={() => toast.info('Image upload stub triggered.')}
                className="absolute bottom-1 right-1 w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center border hover:scale-105 active:scale-95 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-black uppercase">
                {user?.role || 'PRINCIPAL'}
              </span>
              <h3 className="text-lg font-black text-neutral-900 dark:text-white mt-2">
                {user?.name || 'Dr. Ramesh Prasad'}
              </h3>
              <p className="text-xs text-neutral-400 font-bold mt-0.5">
                College Administrator / Dean
              </p>
            </div>
          </div>

          <div className="w-full bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl p-4 text-xs space-y-2.5 text-left border">
            <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-300">
              <Building className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="font-semibold">Institution: Jain College of Engineering</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-300">
              <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="font-semibold">{user?.email || 'principal@college.com'}</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-300">
              <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="font-semibold">{phone}</span>
            </div>
          </div>

          <div className="w-full">
            <button 
              onClick={() => toast.success('Profile details saved.')}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 dark:bg-neutral-850 dark:hover:bg-neutral-750 text-white rounded-xl text-xs font-black shadow-sm transition-colors cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </div>

        {/* Change Password Panel */}
        <div className="lg:col-span-7 glass-panel rounded-[32px] p-6 shadow-ambient">
          <div className="flex items-center gap-2 mb-6 border-b pb-3">
            <Lock className="w-5 h-5 text-indigo-500" />
            <h3 className="font-extrabold text-neutral-900 dark:text-white text-md">🛡️ SECURITY & PASSWORD MANAGEMENT</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="py-3 px-6 bg-neutral-900 hover:bg-neutral-850 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              Update Access Credentials
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default PrincipalProfilePage;
