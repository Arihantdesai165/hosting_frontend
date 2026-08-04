import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Mail, Phone, X, Award, MapPin } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import userManagementService from '../../../services/userManagement.service';
import { toast } from 'react-toastify';

export const PrincipalManagementPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [principals, setPrincipals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState<any | null>(null);

  const fetchPrincipals = async () => {
    setLoading(true);
    try {
      const res = await userManagementService.getPrincipals();
      if (res.success) {
        setPrincipals(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load Principal accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrincipals();
  }, []);

  const handleEditClick = (principal: any) => {
    setSelectedPrincipal(principal);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl pb-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Principal / Super Admin</h2>
          <p className="text-sm text-neutral-500">Manage high-level institutional accounts and access rights.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-500/20 flex items-center gap-2 transition-all"
            >
              <Plus size={16} /> Add Principal Account
            </button>
          )}
        </div>
      </div>

      <div className="p-4 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl text-sm font-medium text-amber-800 dark:text-amber-300 flex items-start gap-3 shadow-sm">
        <Shield className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
        <div>
          <strong>Caution:</strong> Users listed here have `SUPER_ADMIN` privileges. They can modify system settings, issue credentials, and manage all other users.
        </div>
      </div>

      {/* PRINCIPALS LIST (Cards Layout instead of Table for VIP accounts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center items-center text-neutral-500 font-semibold">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading principal accounts...
          </div>
        ) : principals.length === 0 ? (
          <div className="col-span-full py-12 flex justify-center items-center text-neutral-500 font-semibold">
            No Principal accounts found.
          </div>
        ) : (
          principals.map((principal) => (
            <div key={principal.id} className="glass-panel rounded-3xl p-6 border border-neutral-200/60 dark:border-neutral-700/60 shadow-ambient flex flex-col gap-4 relative overflow-hidden group hover:border-violet-300 dark:hover:border-violet-700 transition-all">
              
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                 <button 
                  onClick={() => handleEditClick(principal)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-white dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shadow-sm transition-colors"
                >
                  <Edit size={14} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={principal.user.profileImage || `https://ui-avatars.com/api/?name=${principal.user.firstName}+${principal.user.lastName}&background=random`} 
                    alt={principal.user.firstName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-neutral-800 shadow-md" 
                  />
                  <div className="absolute -bottom-2 -right-2 bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 p-1 rounded-full border-2 border-white dark:border-neutral-900">
                    <Award size={12} />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">
                    {principal.user.firstName} {principal.user.lastName}
                  </h3>
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mt-0.5">
                    {principal.designation || 'Principal'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/60">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <Mail size={14} className="text-neutral-400"/> 
                    <span className="truncate">{principal.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <Phone size={14} className="text-neutral-400"/> 
                    {principal.user.phone || 'No phone added'}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-2 flex items-center justify-between">
                 <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center w-max gap-1.5 ${
                    principal.user.status === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${principal.user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {principal.user.status}
                  </span>
                  
                  <span className="text-xs font-semibold text-neutral-400">
                    ID: {principal.employeeId || 'N/A'}
                  </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALS */}
      {/* ... Add New and Edit modals similar to others ... */}

    </div>
  );
};

export default PrincipalManagementPage;
