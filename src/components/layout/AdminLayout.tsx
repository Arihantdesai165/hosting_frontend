import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import authService from '../../services/auth.service';
import { RootState } from '../../store';
import { getAcademicYear } from '../../utils/date.util';
import {
  LayoutDashboard,
  ClipboardList,
  KeyRound,
  Users,
  FileCheck2,
  BarChart3,
  CalendarDays,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Sliders,
  Settings,
  User,
  Shield,
  AlertCircle,
  Mail,
  Send,
  MessageSquare,
  XCircle,
  RefreshCw,
  CreditCard
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

export const AdminLayout: React.FC = () => {
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
      .catch(err => console.warn('Unable to load deployment features list in AdminLayout:', err));
  }, []);

  const [isDark, setIsDark] = useState(false);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  const [pendingCount, setPendingCount] = useState(0);
  const [resubmittedCount, setResubmittedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [cancellationRequestsCount, setCancellationRequestsCount] = useState(0);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  useEffect(() => {
    const fetchCount = () => {
      admissionService.getStats().then(stats => {
        setPendingCount(stats.submitted + stats.underReview);
        setResubmittedCount(stats.resubmitted || 0);
        setRejectedCount(stats.rejected || 0);
        setVerifiedCount(stats.approved || 0);
        setCancellationRequestsCount(stats.cancellationRequests || 0);
      }).catch(err => console.error('Error loading sidebar stats:', err));
    };

    fetchCount();

    // Listen to local actions
    window.addEventListener('admissions-updated', fetchCount);

    // Periodic polling fallback
    const interval = setInterval(fetchCount, 10000);

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
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    authService.logout();
    dispatch(logout());
    navigate('/login');
  };

  const menuGroups: MenuGroup[] = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Admissions',
      items: [
        { name: 'Application Queue', path: '/admin/admissions/queue', icon: ClipboardList, badge: pendingCount > 0 ? pendingCount : undefined },
        { name: 'Resubmitted', path: '/admin/admissions/resubmitted', icon: RefreshCw, badge: resubmittedCount > 0 ? resubmittedCount : undefined },
        { name: 'Rejected / Corrections', path: '/admin/admissions/rejected', icon: XCircle, badge: rejectedCount > 0 ? rejectedCount : undefined },
        { name: 'Verified', path: '/admin/admissions/verified', icon: FileCheck2, badge: verifiedCount > 0 ? verifiedCount : undefined },
        { name: 'Cancellation Requests', path: '/admin/admissions/cancellations', icon: AlertCircle, badge: cancellationRequestsCount > 0 ? cancellationRequestsCount : undefined },
        { name: 'History', path: '/admin/admissions/history', icon: CalendarDays },
      ],
    },
    {
      title: 'Student Management',
      items: [
        { name: 'Students', path: '/admin/students', icon: Users },
      ],
    },
    {
      title: 'Settings',
      items: [
        { name: 'Settings', path: '/admin/settings/system', icon: Settings },
      ],
    },
  ];

  const subNavTabs = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Admissions Queue', path: '/admin/admissions/queue' },
    { name: 'Students', path: '/admin/students' },
  ];

  const pageTitles: Record<string, string> = {
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/analytics': 'Analytics',
    '/admin/admissions/queue': 'Application Queue',
    '/admin/admissions/resubmitted': 'Resubmitted Applications',
    '/admin/admissions/rejected': 'Rejected Applications',
    '/admin/admissions/verified': 'Verified Admissions',
    '/admin/admissions/approved': 'Approved Admissions',
    '/admin/admissions/cancellations': 'Cancellation Requests',
    '/admin/admissions/history': 'Admission History',
    '/admin/students': 'Student Management',
    '/admin/notifications': 'Notifications',
    '/admin/announcements': 'Announcements',
    '/admin/settings/system': 'System Settings',
    '/admin/settings/logs': 'Audit Logs',
  };

  const getPageTitle = () => {
    if (location.pathname.startsWith('/admin/admissions/review/')) {
      return 'Admission Review Workspace';
    }
    return pageTitles[location.pathname] || 'Admin Portal';
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden flex text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans pb-6 pr-6">

      {/* ── FLOATING SIDEBAR ── */}
      <aside className="fixed left-6 top-6 bottom-6 w-[280px] min-w-[280px] max-w-[280px] flex-shrink-0 flex flex-col justify-between py-6 px-4 rounded-[32px] glass-bar z-40">

        {/* Top: Logo + Nav */}
        <div className="flex flex-col w-full">
          <Link to="/admin/dashboard" className="flex items-center space-x-3 px-1 mb-6 hover:opacity-95 transition-all">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <img
                src="/logo.png"
                alt="JCER Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg tracking-wider uppercase text-neutral-900 dark:text-white truncate">JCER ERP</span>
              <span className="text-xs font-extrabold -mt-0.5" style={{ color: '#7C3AED' }}>Admin Portal</span>
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
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`w-full h-[50px] px-4 rounded-xl flex items-center justify-between transition-all duration-300 ${
                          isActive
                            ? 'admin-sidebar-active shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-violet-50/50 dark:hover:bg-violet-900/10 hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2.2} />
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
          <div className="rounded-2xl p-3 border text-[10px] space-y-1.5" style={{ backgroundColor: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.15)' }}>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium text-[10px]">Role</span>
              <span className="font-extrabold text-[10px]" style={{ color: '#7C3AED' }}>ADMINISTRATOR</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium text-[10px]">Academic Year</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-[10px]">{getAcademicYear()}</span>
            </div>
          </div>

          <Link
            to="/admin/admissions/queue"
            className="flex items-center space-x-2 text-[11px] font-semibold hover:underline px-1 py-0.5"
            style={{ color: '#7C3AED' }}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-[11px]">{pendingCount > 0 ? `${pendingCount} Pending Admissions` : 'No Pending Admissions'}</span>
          </Link>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 pt-6 flex flex-col min-h-screen min-w-0" style={{ paddingLeft: '328px' }}>

        {/* ── TOP HEADER ── */}
        <header className="flex flex-row items-center justify-between py-4 mb-6 z-30 gap-4">

          {/* Page Title */}
          <div className="flex-shrink-0 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-[28px] font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap leading-none">
              {getPageTitle()}
            </h1>
          </div>

          {/* Sub-Nav Pill Bar */}
          <div className="flex items-center glass-bar p-1 rounded-full flex-shrink-0">
            {subNavTabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.name}
                  to={tab.path}
                  className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'admin-nav-pill-active shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <button className="w-9 h-9 rounded-full flex items-center justify-center header-dark-btn shadow-sm hover:scale-[1.05] active:scale-[0.95] cursor-pointer">
              <Search className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center header-dark-btn shadow-sm hover:scale-[1.05] active:scale-[0.95] relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center space-x-2 header-dark-btn h-9 pl-1 pr-3 py-1 rounded-full shadow-sm cursor-pointer hover:scale-[1.02] transition-all select-none"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#7C3AED' }}>
                  <Shield className="w-3 h-3" style={{ color: '#ffffff' }} />
                </div>
                <span className="text-xs font-semibold pr-0.5 hidden md:block">
                  {user?.name?.split(' ')[0] || 'Admin'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-80 hidden md:block transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown absolute right-0 mt-2 w-52 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl py-2 animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/30">
                    <p className="profile-dropdown-label text-[10px] font-extrabold uppercase tracking-widest mb-0.5">Logged in as</p>
                    <p className="profile-dropdown-value text-sm font-extrabold">{user?.name || 'Administrator'}</p>
                    <p className="text-[10px] mt-0.5 font-extrabold" style={{ color: '#7C3AED' }}>ADMINISTRATOR</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="profile-dropdown-logout w-full text-left px-4 py-3 text-sm font-bold flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>Logout Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT (OUTLET) ── */}
        <main className="flex-1 flex flex-col relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
