import React from 'react';
import { GraduationCap, Globe, ShieldCheck, BookOpenCheck } from 'lucide-react';

interface HeroSectionProps {
  isDark: boolean;
  admissionCycle: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isDark, admissionCycle }) => {
  return (
    <section
      className="relative w-full overflow-hidden pt-8 sm:pt-16 pb-16 lg:pb-0"
      style={{
        background: isDark
          ? 'linear-gradient(160deg, #0b0f19 0%, #0c1a3a 35%, #0f2557 70%, #0b0f19 100%)'
          : 'linear-gradient(180deg, #E6F0FA 0%, #F0F6FC 30%, #F5F9FD 60%, #FFFFFF 100%)',
      }}
    >
      {/* ── Background Circles & Accent Lines ── */}
      {/* Concentric circles left */}
      <div className="absolute left-[6%] top-[25%] w-[130px] h-[130px] rounded-full border border-blue-500/[0.08] dark:border-white/[0.04] pointer-events-none hidden lg:block" />
      <div className="absolute left-[8%] top-[29%] w-[90px] h-[90px] rounded-full border border-blue-500/[0.05] dark:border-white/[0.03] pointer-events-none hidden lg:block" />

      {/* 5x5 Dot Grids Left & Right */}
      <svg className="absolute left-[3%] top-[20%] opacity-[0.2] dark:opacity-[0.08] pointer-events-none hidden lg:block w-20 h-20 text-slate-600 dark:text-slate-400" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="10" cy="10" r="1.5" /><circle cx="30" cy="10" r="1.5" /><circle cx="50" cy="10" r="1.5" /><circle cx="70" cy="10" r="1.5" /><circle cx="90" cy="10" r="1.5" />
        <circle cx="10" cy="30" r="1.5" /><circle cx="30" cy="30" r="1.5" /><circle cx="50" cy="30" r="1.5" /><circle cx="70" cy="30" r="1.5" /><circle cx="90" cy="30" r="1.5" />
        <circle cx="10" cy="50" r="1.5" /><circle cx="30" cy="50" r="1.5" /><circle cx="50" cy="50" r="1.5" /><circle cx="70" cy="50" r="1.5" /><circle cx="90" cy="50" r="1.5" />
        <circle cx="10" cy="70" r="1.5" /><circle cx="30" cy="70" r="1.5" /><circle cx="50" cy="70" r="1.5" /><circle cx="70" cy="70" r="1.5" /><circle cx="90" cy="70" r="1.5" />
        <circle cx="10" cy="90" r="1.5" /><circle cx="30" cy="90" r="1.5" /><circle cx="50" cy="90" r="1.5" /><circle cx="70" cy="90" r="1.5" /><circle cx="90" cy="90" r="1.5" />
      </svg>

      <svg className="absolute right-[3%] top-[20%] opacity-[0.2] dark:opacity-[0.08] pointer-events-none hidden lg:block w-20 h-20 text-slate-600 dark:text-slate-400" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="10" cy="10" r="1.5" /><circle cx="30" cy="10" r="1.5" /><circle cx="50" cy="10" r="1.5" /><circle cx="70" cy="10" r="1.5" /><circle cx="90" cy="10" r="1.5" />
        <circle cx="10" cy="30" r="1.5" /><circle cx="30" cy="30" r="1.5" /><circle cx="50" cy="30" r="1.5" /><circle cx="70" cy="30" r="1.5" /><circle cx="90" cy="30" r="1.5" />
        <circle cx="10" cy="50" r="1.5" /><circle cx="30" cy="50" r="1.5" /><circle cx="50" cy="50" r="1.5" /><circle cx="70" cy="50" r="1.5" /><circle cx="90" cy="50" r="1.5" />
        <circle cx="10" cy="70" r="1.5" /><circle cx="30" cy="70" r="1.5" /><circle cx="50" cy="70" r="1.5" /><circle cx="70" cy="70" r="1.5" /><circle cx="90" cy="70" r="1.5" />
        <circle cx="10" cy="90" r="1.5" /><circle cx="30" cy="90" r="1.5" /><circle cx="50" cy="90" r="1.5" /><circle cx="70" cy="90" r="1.5" /><circle cx="90" cy="90" r="1.5" />
      </svg>

      {/* Flying Birds Upper Right */}
      <svg className="absolute right-[15%] top-[11%] opacity-[0.25] dark:opacity-[0.12] w-14 h-10 text-slate-600 dark:text-slate-400 pointer-events-none hidden sm:block" viewBox="0 0 100 100" fill="currentColor">
        <path d="M10,20 Q15,15 20,20 Q25,15 30,20 Q25,18 20,22 Q15,18 10,20 Z" />
        <path d="M40,28 Q43,24 46,28 Q49,24 52,28 Q49,26 46,30 Q43,26 40,28 Z" />
        <path d="M25,38 Q28,35 31,38 Q34,35 37,38 Q34,36 31,40 Q28,36 25,38 Z" />
      </svg>

      {/* Floating decorative elements */}
      <div className="absolute left-[15%] top-[12%] text-slate-400/40 dark:text-white/10 font-bold select-none pointer-events-none hidden md:block">×</div>
      <div className="absolute right-[25%] top-[25%] text-slate-400/40 dark:text-white/10 font-bold select-none pointer-events-none hidden md:block">×</div>
      <div className="absolute right-[-20px] top-[40%] w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none hidden lg:block" />

      {/* ── Content Container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center flex flex-col items-center">
        
        {/* Welcome Badge */}
        <div className="flex items-center gap-3.5 mb-2.5 animate-fadeInUp">
          <div className="flex flex-col gap-1">
            <div className="w-8.5 h-[2px] bg-[#FF9933]"></div>
            <div className="w-8.5 h-[2px] bg-[#138808]"></div>
          </div>
          <span className="text-amber-600 dark:text-amber-500 font-serif italic text-xl font-semibold select-none">Welcome to</span>
          <div className="flex flex-col gap-1">
            <div className="w-8.5 h-[2px] bg-[#FF9933]"></div>
            <div className="w-8.5 h-[2px] bg-[#138808]"></div>
          </div>
        </div>

        {/* Main Title */}
        <h2
          className="animate-fadeInUp text-4xl sm:text-5xl md:text-6xl font-black tracking-tight"
          style={{
            animationDelay: '0.2s',
            color: isDark ? '#ffffff' : '#0B4F8A',
          }}
        >
          JCER Digital Portal
        </h2>

        {/* Decorative Divider */}
        <div className="flex items-center gap-1.5 my-3.5 animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#0B4F8A] dark:bg-blue-400"></div>
          <div className="w-12 h-[1.5px] bg-[#0B4F8A]/35 dark:bg-blue-400/30"></div>
          <div className="w-2 h-2 rotate-45 bg-[#0B4F8A] dark:bg-blue-400"></div>
          <div className="w-12 h-[1.5px] bg-[#0B4F8A]/35 dark:bg-blue-400/30"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#0B4F8A] dark:bg-blue-400"></div>
        </div>

        {/* Subtitle */}
        <p
          className="animate-fadeInUp text-sm sm:text-base md:text-lg max-w-2xl font-semibold leading-relaxed"
          style={{
            animationDelay: '0.3s',
            color: isDark ? '#94A3B8' : '#334155',
          }}
        >
          A single platform for managing admissions and securely accessing the College ERP System.
        </p>

        {/* ── Feature Cards + Building image composition ── */}
        <div className="w-full max-w-6xl mt-8 sm:mt-12 relative">
          <div className="relative flex flex-col items-center min-h-[320px] sm:min-h-[400px] lg:min-h-[440px]">

            {/* Dotted SVG Connector Lines (Desktop only) */}
            <svg className="absolute inset-0 w-full h-full z-[5] hidden lg:block pointer-events-none" viewBox="0 0 1000 400" preserveAspectRatio="none">
              {/* Left Top Card → Building Left Edge */}
              <path d="M 240,100 C 300,100 300,220 350,220" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 5" className="opacity-60 animate-dash" />
              <circle cx="240" cy="100" r="3" fill="#2563EB" />
              <circle cx="350" cy="220" r="3" fill="#2563EB" />

              {/* Left Bottom Card → Building Left Edge */}
              <path d="M 240,280 C 300,280 300,220 350,220" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 5" className="opacity-60 animate-dash" />
              <circle cx="240" cy="280" r="3" fill="#10B981" />
              <circle cx="350" cy="220" r="3" fill="#10B981" />

              {/* Right Top Card → Building Right Edge */}
              <path d="M 760,100 C 700,100 700,220 650,220" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 5" className="opacity-60 animate-dash" />
              <circle cx="760" cy="100" r="3" fill="#F59E0B" />
              <circle cx="650" cy="220" r="3" fill="#F59E0B" />

              {/* Right Bottom Card → Building Right Edge */}
              <path d="M 760,280 C 700,280 700,220 650,220" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="3 5" className="opacity-60 animate-dash" />
              <circle cx="760" cy="280" r="3" fill="#8B5CF6" />
              <circle cx="650" cy="220" r="3" fill="#8B5CF6" />
            </svg>

            {/* Left Feature Cards Stack */}
            <div className="lg:absolute lg:left-[2%] lg:top-[50px] xl:left-[4%] flex flex-col gap-5 lg:gap-6 z-20 w-full max-w-[325px] sm:w-auto mb-5 lg:mb-0 items-center mx-auto">
              {/* Card 1: Admissions Cycle */}
              <div
                className="w-full lg:w-auto animate-fadeInUp animate-float feature-glass rounded-full px-5 py-3 shadow-lg flex items-center gap-3.5 cursor-default bg-white/95 border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800"
                style={{ animationDelay: '0.4s' }}
              >
                <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-md">
                  <GraduationCap className="w-5 h-5" style={{ color: '#ffffff' }} />
                </div>
                <div className="text-left pr-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Admissions Cycle</p>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">{admissionCycle}</p>
                </div>
              </div>

              {/* Card 2: UG & PG Programs */}
              <div
                className="w-full lg:w-auto animate-fadeInUp animate-float-delayed feature-glass rounded-full px-5 py-3 shadow-lg flex items-center gap-3.5 cursor-default bg-white/95 border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800"
                style={{ animationDelay: '0.5s' }}
              >
                <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-md">
                  <BookOpenCheck className="w-5 h-5" style={{ color: '#ffffff' }} />
                </div>
                <div className="text-left pr-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Programs</p>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">UG & PG Programs</p>
                </div>
              </div>
            </div>

            {/* College Building Image with Smooth Transparency Mask */}
            <div
              className="w-full max-w-[500px] sm:max-w-[580px] lg:max-w-[640px] relative z-10 animate-fadeInUp"
              style={{ animationDelay: '0.35s' }}
            >
              <div
                className="relative w-full h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px] overflow-hidden"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                  maskComposite: 'intersect',
                  WebkitMaskComposite: 'source-in',
                }}
              >
                <img
                  src="/college-view.jpg"
                  alt="JCER Campus Building"
                  className="w-full h-full object-cover object-center"
                  style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.06))' }}
                />
              </div>
            </div>

            {/* Right Feature Cards Stack */}
            <div className="lg:absolute lg:right-[2%] lg:top-[50px] xl:right-[4%] flex flex-col gap-5 lg:gap-6 z-20 w-full max-w-[325px] sm:w-auto mt-5 lg:mt-0 items-center mx-auto">
              {/* Card 3: 100% Online Process */}
              <div
                className="w-full lg:w-auto animate-fadeInUp animate-float-slow feature-glass rounded-full px-5 py-3 shadow-lg flex items-center gap-3.5 cursor-default bg-white/95 border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800"
                style={{ animationDelay: '0.45s' }}
              >
                <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Globe className="w-5 h-5" style={{ color: '#ffffff' }} />
                </div>
                <div className="text-left pr-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Process</p>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">100% Online Process</p>
                </div>
              </div>

              {/* Card 4: Secure Document Upload */}
              <div
                className="w-full lg:w-auto animate-fadeInUp animate-float-slower feature-glass rounded-full px-5 py-3 shadow-lg flex items-center gap-3.5 cursor-default bg-white/95 border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800"
                style={{ animationDelay: '0.55s' }}
              >
                <div className="w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-md">
                  <ShieldCheck className="w-5 h-5" style={{ color: '#ffffff' }} />
                </div>
                <div className="text-left pr-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Security</p>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">Secure Document Upload</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Large white wave SVG at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10">
        <svg className="relative block w-full h-[60px] md:h-[90px]" viewBox="0 0 1440 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,45 C320,85 560,95 720,75 C880,55 1120,70 1440,45 L1440,90 L0,90 Z" fill={isDark ? '#0b0f19' : '#F8FAFC'} />
        </svg>
      </div>
    </section>
  );
};
