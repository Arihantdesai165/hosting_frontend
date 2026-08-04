import React from 'react';
import { Menu } from 'lucide-react';

const AdmissionHeader = ({ toggleSidebar, isSidebarOpen, headerRef }) => {
    return (
        <header ref={headerRef} className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm flex-shrink-0 transition-none">
            <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5">
                
                {/* ─── 1. DESKTOP / LAPTOP LAYOUT ─── */}
                <div className="hidden lg:flex items-center gap-4 py-1 w-full">
                    
                    {/* LEFT: Hamburger Menu Icon */}
                    <div className="flex items-center shrink-0">
                        {toggleSidebar ? (
                            <button
                                onClick={toggleSidebar}
                                className="p-2 text-slate-800 hover:text-primary-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                                aria-label="Toggle Navigation Menu"
                                type="button"
                            >
                                <Menu className="w-7 h-7" />
                            </button>
                        ) : (
                            <div className="w-7 h-7" />
                        )}
                    </div>

                    {/* CENTER / RIGHT: UNIFIED BRANDING BLOCK (Logo + College Details) */}
                    <div className="flex items-center justify-start gap-3.5 xl:gap-4 flex-1 min-w-0">
                        {/* College Logo */}
                        <div 
                            className="shrink-0 w-14 h-14 xl:w-16 xl:h-16 bg-white rounded-full overflow-hidden flex items-center justify-center shadow-xs border border-slate-200"
                            style={{ backgroundColor: '#ffffff' }}
                        >
                            <img 
                                src="/logo.png" 
                                alt="JCER Logo" 
                                className="w-full h-full object-cover bg-white rounded-full" 
                                style={{ backgroundColor: '#ffffff' }}
                            />
                        </div>

                        {/* Text Stack */}
                        <div className="flex flex-col text-left justify-center min-w-0">
                            {/* Title */}
                            <h1 
                                className="text-[#0B4F8A] text-base lg:text-lg xl:text-xl font-extrabold leading-tight uppercase font-sans tracking-tight"
                                style={{ color: '#0B4F8A', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: '800' }}
                            >
                                JAIN COLLEGE OF ENGINEERING & RESEARCH
                            </h1>

                            {/* Approval Line */}
                            <p 
                                className="text-xs text-slate-700 font-medium leading-snug mt-0.5"
                                style={{ color: '#1f2937', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
                            >
                                (Approved by AICTE, New Delhi, Affiliated to VTU Belagavi)
                            </p>

                            {/* Accreditation Line */}
                            <p 
                                className="text-xs font-bold text-indigo-700 leading-tight mt-0.5"
                                style={{ color: '#4f46e5', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
                            >
                                Recognized by Govt. of Karnataka • NBA Accredited Programs – ECE & ME
                            </p>
                        </div>
                    </div>

                </div>

                {/* ─── 2. MOBILE / TABLET LAYOUT (lg:hidden) ─── */}
                <div className="flex lg:hidden items-center justify-between gap-2 h-auto min-h-[56px] py-1">
                    
                    {/* LEFT: Hamburger Menu Icon */}
                    <div className="flex items-center shrink-0">
                        {toggleSidebar ? (
                            <button
                                onClick={toggleSidebar}
                                className="p-1.5 text-slate-800 hover:text-primary-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                                aria-label="Toggle Navigation Menu"
                                type="button"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        ) : (
                            <div className="w-6 h-6" />
                        )}
                    </div>

                    {/* CENTER / RIGHT: College Logo & Details */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-start">
                        {/* College Logo */}
                        <div 
                            className="shrink-0 w-10 h-10 xs:w-[42px] xs:h-[42px] bg-white rounded-full overflow-hidden flex items-center justify-center shadow-xs border border-slate-200"
                            style={{ backgroundColor: '#ffffff' }}
                        >
                            <img 
                                src="/logo.png" 
                                alt="JCER Logo" 
                                className="w-full h-full object-cover bg-white rounded-full" 
                                style={{ backgroundColor: '#ffffff' }}
                            />
                        </div>

                        {/* Text Stack */}
                        <div className="flex flex-col text-left justify-center min-w-0 flex-1">
                            <h1 
                                className="text-[#0B4F8A] text-[10.5px] min-[360px]:text-[11.5px] min-[390px]:text-xs sm:text-base font-extrabold leading-tight uppercase font-sans tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
                                style={{ color: '#0B4F8A', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: '800' }}
                            >
                                JAIN COLLEGE OF ENGINEERING & RESEARCH
                            </h1>
                            <p 
                                className="text-[8.5px] min-[360px]:text-[9px] sm:text-[10px] text-slate-700 font-medium leading-snug mt-0.5"
                                style={{ color: '#1f2937', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
                            >
                                (Approved by AICTE, New Delhi, Affiliated to VTU Belagavi & Recognized by Govt. of Karnataka)
                            </p>
                            <p 
                                className="text-[9px] min-[360px]:text-[9.5px] sm:text-[10.5px] font-bold text-indigo-600 leading-tight mt-0.5"
                                style={{ color: '#4f46e5', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
                            >
                                NBA Accredited Programs – ECE & ME
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </header>
    );
};

export default AdmissionHeader;
