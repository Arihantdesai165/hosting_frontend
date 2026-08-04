import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
    HelpCircle
} from 'lucide-react';
import AdmissionHeader from '../components/AdmissionHeader';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(72);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
    const headerRef = useRef(null);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
            setIsMobile(window.innerWidth < 1024);
        };

        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);

        let observer;
        if (headerRef.current && typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(updateHeaderHeight);
            observer.observe(headerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            if (observer) observer.disconnect();
        };
    }, []);

    const getNavItems = () => {
        if (user?.role === 'STUDENT') {
            return [
                { name: 'Dashboard', path: '/admission/dashboard', icon: LayoutDashboard },
                { name: 'Admission Form', path: '/admission/application', icon: FileText },
            ];
        } else {
            return [
                { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
                { name: 'Student Directory', path: '/admin/students', icon: Users },
            ];
        }
    };

    const navItems = getNavItems();

    return (
        <div className="admission-portal-theme h-screen w-full bg-[#f3f4f6] flex flex-col overflow-hidden">
            {/* Sticky Fixed Header - Always visible at z-50 */}
            <AdmissionHeader headerRef={headerRef} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

            {/* Layout Wrapper Below Header */}
            <div className="flex-1 flex min-w-0 overflow-hidden relative">
                {/* Mobile Sidebar Backdrop Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
                        style={{ top: isMobile ? '0px' : `${headerHeight}px` }}
                        onClick={toggleSidebar}
                    />
                )}

                {/* 
                  ROOT CAUSE ANALYSIS FOR MOBILE LOGOUT BUTTON VISIBILITY:
                  1. Viewport Height (100vh vs 100dvh): Mobile browsers include dynamic navigation/URL bars in 100vh, causing the bottom portion of a 100vh element to extend off-screen. Using 100dvh constrains the drawer to the actual visible viewport.
                  2. Double Positioning & Offset: The top: {headerHeight} combined with bottom-0 and 100vh height caused browser layout clipping. Changing top to 0px and height to 100dvh on mobile resolves layout constraints.
                  3. Outer Scrolling: The aside container had overflow-y-auto which made the entire drawer scroll as a page, pushing the profile card/logout button out of view. Changing aside to overflow-hidden, keeping the menu section (nav) flex-1 overflow-y-auto, and using mt-auto on the bottom section ensures the profile and logout are pinned at the bottom and always visible.
                */}
                <aside 
                    className={`
                        fixed lg:static bottom-0 left-0 z-40
                        w-[260px] bg-white border-r border-slate-200
                        transform transition-transform duration-300 ease-in-out
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        flex flex-col flex-shrink-0 lg:h-full overflow-hidden shadow-lg lg:shadow-none
                    `}
                    style={{
                        top: isMobile ? '0px' : undefined,
                        height: isMobile ? '100dvh' : undefined,
                    }}
                >
                    <div className="py-3.5 px-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                        <span className="font-bold text-xs text-slate-700 tracking-wider uppercase block">Navigation Menu</span>
                    </div>

                    <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) => `
                                    flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'bg-primary-50 text-primary-700 font-semibold'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon size={18} className="text-current shrink-0" />
                                <span className="truncate">{item.name}</span>
                            </NavLink>
                        ))}

                        <div className="pt-5 pb-1 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            System
                        </div>

                        <NavLink
                            to="/admission/support"
                            className={({ isActive }) => `
                                flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                ${isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <HelpCircle size={18} className="text-current shrink-0" />
                            <span className="truncate">Support</span>
                        </NavLink>
                    </nav>

                    {/* Pinned Bottom User & Logout section */}
                    <div className="flex flex-col justify-between flex-shrink-0 mt-auto">
                        <div className="p-3 mb-2 mx-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2.5 flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {user?.name?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || "Student User"}</p>
                                <p className="text-xs text-slate-500 truncate">ID: {user?.id?.substring(0,8) || `ADM-${new Date().getFullYear()}`}</p>
                            </div>
                        </div>

                        <div className="px-3 pb-4 flex-shrink-0">
                            <button
                                onClick={logout}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={18} className="shrink-0" />
                                <span className="truncate">Logout</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f3f4f6] relative z-10 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[1200px] mx-auto w-full animate-fade-in pb-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
