import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { RootState } from '../../store';
import { getAcademicYear } from '../../utils/date.util';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User,
  Shield,
  Megaphone,
  FileText,
  FileCheck2
} from 'lucide-react';
import admissionService from '../../services/admission.service';
import { filterMenuItems } from '../../utils/feature.util';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
  feature?: string;
  badge?: number;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const PrincipalLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [features, setFeatures] = useState<Record<string, boolean>>({
    admission: true,
    admin: true,
    principal: true,
    student: false,
    teacher: false,
    hod: false,
    parent: false,
    fees: false,
    library: false,
    placement: false,
    hostel: false,
    grievances: false,
  });

  useEffect(() => {
    fetch('/api/system/config')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.features) {
          setFeatures(json.data.features);
        }
      })
      .catch(err => console.warn('Unable to load deployment features list in PrincipalLayout:', err));
  }, []);

  const [isDark, setIsDark] = useState(false);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  useEffect(() => {
    const fetchCount = () => {
      // Principal reviews fee-verified admissions awaiting final enrollment sign-off
      admissionService.getStats().then(stats => {
        setPendingCount(stats.feeVerified || 0);
      }).catch(err => console.error('Error loading Principal stats:', err));
    };

    fetchCount();
    window.addEventListener('admissions-updated', fetchCount);
    const interval = setInterval(fetchCount, 15000);

    return () => {
      window.removeEventListener('admissions-updated', fetchCount);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuGroups: MenuGroup[] = [
    {
      title: 'Dashboard & Queue',
      items: [
        { name: 'Overview', path: '/principal/dashboard', icon: LayoutDashboard },
        { name: 'Admissions Queue', path: '/principal/admissions', icon: ClipboardList, badge: pendingCount > 0 ? pendingCount : undefined },
        { name: 'Students', path: '/principal/students', icon: Users },
        { name: 'Analytics', path: '/principal/analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Reports & Audit',
      items: [
        { name: 'Report Generation', path: '/principal/reports', icon: FileText },
      ],
    },
  ];

  const pageTitles: Record<string, string> = {
    '/principal/dashboard': 'Principal Overview',
    '/principal/admissions': 'Admissions Queue',
    '/principal/students': 'Students Directory (Read Only)',
    '/principal/analytics': 'Admission Analytics',
    '/principal/reports': 'Report Generator',
    '/principal/profile': 'My Profile',
  };

  const getPageTitle = () => {
    if (location.pathname.startsWith('/principal/admissions/review/')) {
      return 'Admission Review Workspace';
    }
    if (location.pathname.startsWith('/principal/admissions')) {
      if (location.pathname.includes('/pending')) return 'Pending Sign-off';
      if (location.pathname.includes('/approved')) return 'Enrolled Admissions';
      if (location.pathname.includes('/rejected')) return 'Rejected Admissions';
      if (location.pathname.includes('/history')) return 'Admissions History';
      return 'Admissions Approvals';
    }
    return pageTitles[location.pathname] || 'Principal Portal';
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden flex text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans pb-6 pr-6">

      {/* ── FLOATING SIDEBAR ── */}
      <aside className="fixed left-6 top-6 bottom-6 w-64 flex flex-col justify-between py-6 px-4 rounded-[32px] glass-bar z-40">
        
        {/* Top: Logo + Nav */}
        <div className="flex flex-col w-full">
          <Link to="/principal/dashboard" className="flex items-center space-x-3 px-2 mb-6 hover:opacity-95 transition-all">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="JCER Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wider uppercase text-neutral-900 dark:text-white">JCER ERP</span>
              <span className="text-[12px] font-extrabold -mt-0.5" style={{ color: '#0F4C81' }}>Principal</span>
            </div>
          </Link>

          {/* Grouped Navigation */}
          <nav className="flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-290px)] pr-1 select-none">
            {filterMenuItems(menuGroups, features).map((group) => (
              <div key={group.title} className="flex flex-col space-y-1">
                <span className="px-3 text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
                  {group.title}
                </span>
                <div className="flex flex-col space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-all duration-300 ${
                          isActive
                            ? 'bg-[#0F4C81]/10 text-[#0F4C81] dark:text-blue-300 shadow-sm border-l-4 border-[#0F4C81]'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-900/10 hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2.2} />
                          <span className="text-xs font-semibold">{item.name}</span>
                        </div>
                        {item.badge && !isActive && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-500 text-white leading-none">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Footer */}
        <div className="pt-4 border-t border-neutral-200/50 dark:border-neutral-800/40 flex flex-col space-y-3 w-full">
          <div className="rounded-2xl p-3 border text-[10px] space-y-1.5" style={{ backgroundColor: 'rgba(15,76,129,0.06)', borderColor: 'rgba(15,76,129,0.15)' }}>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium text-[10px]">Role</span>
              <span className="font-extrabold text-[10px] text-[#0F4C81] dark:text-blue-300">PRINCIPAL</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium text-[10px]">Academic Year</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-[10px]">{getAcademicYear()}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 pt-6 flex flex-col min-h-screen min-w-0" style={{ paddingLeft: '304px' }}>

        {/* ── TOP HEADER ── */}
        <header className="flex flex-row items-center justify-between py-4 mb-6 z-30 gap-4">
          <div className="flex flex-col min-w-0">
            <h2 className="text-2xl font-black tracking-tight truncate leading-tight uppercase">
              {getPageTitle()}
            </h2>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mt-0.5">
              Jain College of Engineering & Research
            </span>
          </div>

          <div className="flex items-center space-x-4 flex-shrink-0">

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/40 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              >
                <div className="size-7 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-800/40 flex items-center justify-center font-black text-xs text-[#0F4C81] dark:text-blue-300">
                  {user?.name?.charAt(0) || 'P'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[11px] font-bold tracking-tight leading-none text-neutral-800 dark:text-neutral-200">{user?.name}</span>
                  <span className="text-[9px] font-semibold text-neutral-400 mt-0.5 uppercase leading-none">Principal</span>
                </div>
                <ChevronDown size={12} className="text-neutral-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                  <Link
                    to="/principal/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="w-full px-4 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300"
                  >
                    <User size={14} /> My Profile
                  </Link>
                  <hr className="my-1 border-neutral-100 dark:border-neutral-800/40" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-2 text-left"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── SUB PAGE ROUTER CONTENT ── */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PrincipalLayout;
