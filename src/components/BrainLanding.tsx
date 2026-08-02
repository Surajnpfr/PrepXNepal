import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  Clock, 
  Target, 
  TrendingUp, 
  BarChart2, 
  BookOpen, 
  Coins, 
  Layers, 
  Zap, 
  Award, 
  ChevronRight, 
  Menu, 
  X, 
  FileText, 
  AlertCircle,
  Play,
  LayoutDashboard,
  FileCheck,
  LineChart,
  BookMarked,
  Bell,
  User,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface BrainLandingProps {
  onEnterApp: (initialCategory?: string) => void;
  onClose?: () => void;
}

export const BrainLanding: React.FC<BrainLandingProps> = ({ onEnterApp, onClose }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 text-slate-900 overflow-y-auto font-sans antialiased selection:bg-blue-100 relative">

      {/* 1. FLOATING LIQUID GLASS HEADER */}
      <header className="sticky top-4 z-50 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 transition-all">
        <div className="h-[70px] bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(37,99,235,0.06),0_1px_1px_rgba(255,255,255,0.8)_inset] rounded-[24px] px-5 flex items-center justify-between transition-all hover:bg-white/85">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onEnterApp()}>
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_14px_rgba(37,99,235,0.35)] border border-white/30 relative overflow-hidden transition-transform group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-60" />
              PX
            </div>
            <div>
              <span className="font-bold text-[#0F172A] text-base tracking-tight block leading-tight">
                PrepX <span className="text-[#2563EB]">Nepal</span>
              </span>
              <span className="text-[11px] text-[#53647C] font-medium tracking-wide block">
                Prepare Smarter
              </span>
            </div>
          </div>

          {/* Segmented Liquid Glass Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/60 backdrop-blur-md rounded-full border border-white/60 text-[14px] font-medium text-[#53647C]">
            <button 
              onClick={() => scrollToSection('split-brain-section')} 
              className="px-4 py-1.5 rounded-full hover:bg-white/90 hover:text-[#0F172A] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
            >
              Mock Tests
            </button>
            <button 
              onClick={() => scrollToSection('split-brain-section')} 
              className="px-4 py-1.5 rounded-full hover:bg-white/90 hover:text-[#0F172A] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
            >
              Resources
            </button>
            <button 
              onClick={() => scrollToSection('performance-section')} 
              className="px-4 py-1.5 rounded-full hover:bg-white/90 hover:text-[#0F172A] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
            >
              Performance
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works-section')} 
              className="px-4 py-1.5 rounded-full hover:bg-white/90 hover:text-[#0F172A] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
            >
              Study Plan
            </button>
            <button 
              onClick={() => scrollToSection('coins-section')} 
              className="px-4 py-1.5 rounded-full hover:bg-white/90 hover:text-[#0F172A] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => onEnterApp()} 
              className="px-4 py-2 text-[14px] font-medium text-[#53647C] hover:text-[#0F172A] hover:bg-white/60 rounded-full transition-all cursor-pointer"
            >
              Sign In
            </button>
            
            {/* Liquid Glass Primary Button */}
            <button 
              onClick={() => onEnterApp()} 
              className="px-4 py-2 bg-[#2563EB]/90 hover:bg-[#2563EB] text-white font-semibold text-[14px] rounded-[14px] transition-all cursor-pointer shadow-[0_4px_16px_rgba(37,99,235,0.25)] border-t border-white/40 border-x border-b border-white/10 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Take a Free Mock</span>
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-white" />
              </div>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-[#0F172A] hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Collapsible Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/90 backdrop-blur-2xl border border-white/80 rounded-[20px] p-4 space-y-2 shadow-xl animate-in fade-in duration-150">
            <button 
              onClick={() => scrollToSection('split-brain-section')} 
              className="block w-full text-left px-3 py-2 font-medium text-[14px] text-[#0F172A] rounded-xl hover:bg-slate-100/70"
            >
              Mock Tests
            </button>
            <button 
              onClick={() => scrollToSection('split-brain-section')} 
              className="block w-full text-left px-3 py-2 font-medium text-[14px] text-[#0F172A] rounded-xl hover:bg-slate-100/70"
            >
              Resources
            </button>
            <button 
              onClick={() => scrollToSection('performance-section')} 
              className="block w-full text-left px-3 py-2 font-medium text-[14px] text-[#0F172A] rounded-xl hover:bg-slate-100/70"
            >
              Performance
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works-section')} 
              className="block w-full text-left px-3 py-2 font-medium text-[14px] text-[#0F172A] rounded-xl hover:bg-slate-100/70"
            >
              Study Plan
            </button>

            <div className="pt-3 border-t border-slate-200/60 flex flex-col gap-2">
              <button 
                onClick={() => onEnterApp()} 
                className="w-full py-2.5 text-center font-medium text-[14px] text-[#53647C] bg-slate-100/60 rounded-xl"
              >
                Sign In
              </button>
              <button 
                onClick={() => onEnterApp()} 
                className="w-full py-2.5 text-center font-semibold text-[14px] text-white bg-[#2563EB] rounded-xl shadow-md"
              >
                Take a Free Mock
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO COMPOSITION (Fully visible above fold on 1440x900) */}
      <section className="relative pt-8 pb-8 lg:pt-12 lg:pb-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* LEFT HERO CONTENT (~43% width: lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-5 text-left">
            
            {/* Small Liquid Glass Status Capsule */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/80 backdrop-blur-md border border-white/90 text-[#2563EB] text-[11px] font-bold tracking-wider rounded-full shadow-[0_2px_8px_rgba(37,99,235,0.08)] uppercase">
              <Target className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>NEPAL CEE 2026 PREPARATION</span>
            </div>

            {/* Main Headline (54-60px on desktop, dark navy with gradient highlight ONLY on "your performance") */}
            <h1 className="text-[34px] sm:text-[46px] lg:text-[56px] font-bold tracking-tight text-[#0F172A] leading-[1.08]">
              Prepare for Nepal CEE with a plan built around{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#7C3AED]">
                your performance.
              </span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-[15px] sm:text-[18px] text-[#53647C] leading-relaxed max-w-[560px]">
              Take realistic mock tests, review every mistake and focus your revision on the chapters where you can gain the most marks.
            </p>

            {/* Liquid Glass Hero Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              
              {/* Primary Tinted Glass Button */}
              <button 
                onClick={() => onEnterApp()} 
                className="px-6 py-3.5 bg-[#2563EB]/90 hover:bg-[#2563EB] text-white font-semibold text-[15px] rounded-[16px] shadow-[0_8px_24px_rgba(37,99,235,0.28)] border-t border-white/50 border-x border-b border-white/20 backdrop-blur-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-3"
              >
                <span>Start Free Mock</span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </button>

              {/* Secondary Clear Glass Button */}
              <button 
                onClick={() => onEnterApp('reports')} 
                className="px-5 py-3.5 bg-white/80 hover:bg-white text-[#0F172A] font-semibold text-[15px] rounded-[16px] border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all hover:-translate-y-0.5 cursor-pointer flex items-center justify-center"
              >
                View Sample Report
              </button>

            </div>

            {/* Compact Glass Chips Trust Row */}
            <div className="pt-3 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#53647C]">
              <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-full px-3 py-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0 stroke-[2.5]" />
                <span>200-question mocks</span>
              </div>
              <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-full px-3 py-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0 stroke-[2.5]" />
                <span>−0.25 negative marking</span>
              </div>
              <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-full px-3 py-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0 stroke-[2.5]" />
                <span>Instant chapter analysis</span>
              </div>
            </div>

          </div>

          {/* RIGHT HERO CONTENT: PREMIUM FLOATING LIQUID GLASS APPLICATION WINDOW (~57% width: lg:col-span-7) */}
          <div className="lg:col-span-7">
            
            {/* Floating Glass Application Panel */}
            <div className="bg-white/88 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] rounded-[28px] overflow-hidden text-[#0F172A] relative transition-transform duration-300 hover:shadow-[0_25px_60px_rgba(37,99,235,0.12)]">
              
              {/* Subtle Refractive Top Highlight Line */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80 pointer-events-none" />

              {/* Application Header Bar */}
              <div className="bg-slate-50/70 backdrop-blur-md border-b border-slate-200/60 px-5 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#12A875] shadow-[0_0_8px_rgba(18,168,117,0.5)]" />
                  <span className="font-semibold text-[#0F172A]">PrepX Dashboard</span>
                  <span className="text-[#53647C]/40">•</span>
                  <span className="text-[#53647C] font-medium">Nepal CEE 2026</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Study Coins Glass Capsule */}
                  <div className="bg-amber-50/90 backdrop-blur-md border border-amber-200/60 px-3 py-1 rounded-full text-[11px] font-semibold text-amber-900 flex items-center gap-1.5 shadow-2xs">
                    <span>🪙 245 Coins</span>
                  </div>

                  {/* Bell Icon Capsule */}
                  <div className="w-7 h-7 rounded-full bg-white/80 border border-slate-200/60 flex items-center justify-center text-[#53647C]">
                    <Bell className="w-3.5 h-3.5" />
                  </div>

                  {/* Avatar Capsule */}
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                    KN
                  </div>
                </div>
              </div>

              {/* Main Application Inner Grid (Left Glass Rail + Content) */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[410px]">
                
                {/* Left Mini Rail (Desktop) */}
                <div className="hidden md:flex md:col-span-3 border-r border-slate-200/60 bg-slate-50/50 backdrop-blur-md p-3 flex-col justify-between text-[12px]">
                  <div className="space-y-1">
                    <button 
                      onClick={() => setActiveTab('overview')}
                      className={`w-full px-3 py-2 rounded-[10px] flex items-center gap-2.5 font-medium transition-all ${
                        activeTab === 'overview' 
                          ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/80 text-[#2563EB] font-bold' 
                          : 'text-[#53647C] hover:bg-white/60'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Overview</span>
                    </button>

                    <button 
                      onClick={() => onEnterApp('mock-tests')}
                      className="w-full px-3 py-2 text-[#53647C] hover:bg-white/60 rounded-[10px] flex items-center gap-2.5 font-medium transition-all cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Mock Tests</span>
                    </button>

                    <button 
                      onClick={() => onEnterApp('reports')}
                      className="w-full px-3 py-2 text-[#53647C] hover:bg-white/60 rounded-[10px] flex items-center gap-2.5 font-medium transition-all cursor-pointer"
                    >
                      <LineChart className="w-4 h-4" />
                      <span>Analytics</span>
                    </button>

                    <button 
                      onClick={() => onEnterApp('study-resources')}
                      className="w-full px-3 py-2 text-[#53647C] hover:bg-white/60 rounded-[10px] flex items-center gap-2.5 font-medium transition-all cursor-pointer"
                    >
                      <BookMarked className="w-4 h-4" />
                      <span>Revision</span>
                    </button>
                  </div>

                  <div className="p-3 bg-white/80 border border-slate-200/80 rounded-[12px] text-[11px] text-[#53647C] shadow-2xs">
                    <div className="font-bold text-[#0F172A]">Target Score</div>
                    <div className="font-mono font-bold text-[#2563EB] mt-0.5 text-xs">165 / 200</div>
                  </div>
                </div>

                {/* Main Dashboard Content Area */}
                <div className="col-span-1 md:col-span-9 p-5 space-y-4 bg-white/60">
                  
                  {/* Dashboard Greeting Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div>
                      <h2 className="text-[15px] font-bold text-[#0F172A]">Good morning, Krrish Nyoupane</h2>
                      <p className="text-[12px] text-[#53647C]">Your next mock is scheduled for today.</p>
                    </div>
                    <button 
                      onClick={() => onEnterApp('mock-tests')}
                      className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-[12px] rounded-[10px] shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-colors cursor-pointer shrink-0"
                    >
                      Start Mock
                    </button>
                  </div>

                  {/* Primary Focus Card: Latest CEE Mock Performance */}
                  <div className="p-4 bg-white/90 border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] rounded-[16px] space-y-3 relative">
                    
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-bold text-[#53647C] uppercase tracking-wider text-[10px]">Latest CEE Mock</span>
                      <span className="px-2.5 py-0.5 bg-[#12A875]/10 text-[#12A875] border border-[#12A875]/20 text-[11px] font-bold rounded-full">
                        +12 marks improvement
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 items-baseline">
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F172A]">
                          142 <span className="text-xs text-[#53647C] font-normal">/ 200</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-[#53647C] uppercase block font-medium">Accuracy</span>
                        <span className="font-mono font-bold text-[#0F172A] text-[13px]">74%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#53647C] uppercase block font-medium">Time Used</span>
                        <span className="font-mono font-bold text-[#0F172A] text-[13px]">2h 41m</span>
                      </div>
                    </div>

                    {/* Score Trend Chart Inside Score Card */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[10px] text-[#53647C] font-semibold mb-1.5 flex justify-between">
                        <span>Score Trend (Last 5 Mocks)</span>
                        <span className="text-[#2563EB] font-mono">122 → 142 (+20)</span>
                      </div>
                      <div className="h-9 flex items-end justify-between gap-2 px-1">
                        {[
                          { mock: 'M1', score: 122 },
                          { mock: 'M2', score: 128 },
                          { mock: 'M3', score: 135 },
                          { mock: 'M4', score: 138 },
                          { mock: 'Latest', score: 142, active: true }
                        ].map((item, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div 
                              className={`w-full rounded-t-xs transition-all ${
                                item.active 
                                  ? 'bg-gradient-to-t from-[#2563EB] to-[#60A5FA] shadow-[0_2px_8px_rgba(37,99,235,0.3)]' 
                                  : 'bg-slate-200'
                              }`}
                              style={{ height: `${(item.score / 200) * 32}px` }}
                            />
                            <span className="text-[9px] font-mono text-[#53647C]">{item.mock}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Two Secondary Supporting Areas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Subject Performance */}
                    <div className="p-3.5 bg-white/80 border border-slate-200/60 rounded-[16px] space-y-2">
                      <div className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">
                        Subject Readiness
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-[#53647C] font-medium">Physics</span>
                          <span className="font-mono font-bold text-[#2563EB]">64%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '64%' }} />
                        </div>

                        <div className="flex justify-between pt-0.5">
                          <span className="text-[#53647C] font-medium">Chemistry</span>
                          <span className="font-mono font-bold text-[#E99716]">58%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#E99716] h-full rounded-full" style={{ width: '58%' }} />
                        </div>

                        <div className="flex justify-between pt-0.5">
                          <span className="text-[#53647C] font-medium">Botany & Zoology</span>
                          <span className="font-mono font-bold text-[#12A875]">74%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#12A875] h-full rounded-full" style={{ width: '74%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Recommended Action Tinted Glass Card */}
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-[16px] space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold font-mono text-amber-800 uppercase bg-white/90 px-2 py-0.5 rounded-full border border-amber-200/60">
                          NEXT RECOMMENDED ACTION
                        </span>
                        <h3 className="font-bold text-[13px] text-[#0F172A] mt-1.5">Revise Chemical Bonding</h3>
                        <p className="text-[11px] text-[#53647C] mt-0.5 leading-snug">
                          You lost 6 marks in this chapter during your latest mock.
                        </p>
                      </div>

                      <button 
                        onClick={() => onEnterApp('study-resources')}
                        className="w-full py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-[11px] rounded-[8px] transition-colors cursor-pointer text-center shadow-2xs"
                      >
                        Practice this chapter
                      </button>
                    </div>

                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. BELOW-THE-FOLD PREVIEW HEADER */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 text-center z-10 relative">
        <p className="text-[13px] font-semibold text-[#53647C] uppercase tracking-wider">
          Everything you need to improve your next score.
        </p>
      </div>

      {/* 4. SPLIT BRAIN PREPARATION MODES SECTION */}
      <section id="split-brain-section" className="py-14 lg:py-18 bg-white/80 backdrop-blur-xl border-y border-slate-200/80 z-10 relative">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              DUAL PREPARATION SYSTEM
            </span>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-[#0F172A] tracking-tight pt-1">
              One platform. Two focused preparation modes.
            </h2>
            <p className="text-[15px] text-[#53647C] leading-relaxed">
              Switch between analytical mock-test preparation and focused biology revision without losing track of your overall CEE progress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD ONE: Analytical Mode */}
            <div className="bg-gradient-to-br from-[#06B6D4]/8 to-sky-50/50 backdrop-blur-xl rounded-[24px] border border-[#06B6D4]/25 p-7 flex flex-col justify-between space-y-5 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06B6D4]/15 text-[#0284C7] text-[11px] font-mono font-bold">
                  <Zap className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Analytical Mode</span>
                </div>

                <h3 className="text-xl font-bold text-[#0F172A]">
                  Physics, Chemistry and Timed Mocks
                </h3>

                <p className="text-[14px] text-[#53647C] leading-relaxed">
                  Build exam speed and accuracy with CEE-pattern questions, timed mock tests, negative marking and detailed performance analysis.
                </p>

                <ul className="space-y-2 text-[13px] text-[#0F172A] font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0284C7] shrink-0" />
                    <span>Full-length 200-question mock tests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0284C7] shrink-0" />
                    <span>−0.25 negative marking simulation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0284C7] shrink-0" />
                    <span>Time and accuracy analysis per question</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0284C7] shrink-0" />
                    <span>Rank and score prediction engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0284C7] shrink-0" />
                    <span>Chapter-level mistake review</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-[#06B6D4]/20">
                <button 
                  onClick={() => onEnterApp('mock-tests')}
                  className="w-full py-2.5 bg-[#0284C7] hover:bg-sky-700 text-white font-semibold text-[14px] rounded-[12px] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <span>Explore Mock Tests</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CARD TWO: Revision Mode */}
            <div className="bg-gradient-to-br from-[#7C3AED]/8 to-purple-50/50 backdrop-blur-xl rounded-[24px] border border-[#7C3AED]/25 p-7 flex flex-col justify-between space-y-5 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/15 text-[#7C3AED] text-[11px] font-mono font-bold">
                  <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Revision Mode</span>
                </div>

                <h3 className="text-xl font-bold text-[#0F172A]">
                  Botany, Zoology and Study Resources
                </h3>

                <p className="text-[14px] text-[#53647C] leading-relaxed">
                  Strengthen high-weight biology chapters with concise revision materials, formula collections and focused practice recommendations.
                </p>

                <ul className="space-y-2 text-[13px] text-[#0F172A] font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>High-yield biology revision notes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Formula and fact library</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Weak-chapter recommendations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Daily study targets & checklist</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Study Coins and habit rewards</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-[#7C3AED]/20">
                <button 
                  onClick={() => onEnterApp('study-resources')}
                  className="w-full py-2.5 bg-[#7C3AED] hover:bg-purple-700 text-white font-semibold text-[14px] rounded-[12px] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <span>Explore Study Resources</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="how-it-works-section" className="py-14 lg:py-18 bg-[#F4F7FD] z-10 relative">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
              3-STEP LEARNING FLOW
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-bold text-[#0F172A] tracking-tight">
              From practice to progress in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-[20px] border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-3 transition-all hover:bg-white hover:shadow-md">
              <div className="w-10 h-10 rounded-[12px] bg-blue-50 text-[#2563EB] font-mono font-bold text-sm flex items-center justify-center border border-blue-100 shadow-2xs">
                01
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">Take a CEE-style mock</h3>
              <p className="text-[13px] text-[#53647C] leading-relaxed">
                Attempt timed questions with authentic marking rules, negative marking calculation, and subject section toggles.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-6 rounded-[20px] border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-3 transition-all hover:bg-white hover:shadow-md">
              <div className="w-10 h-10 rounded-[12px] bg-purple-50 text-[#7C3AED] font-mono font-bold text-sm flex items-center justify-center border border-purple-100 shadow-2xs">
                02
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">Understand your mistakes</h3>
              <p className="text-[13px] text-[#53647C] leading-relaxed">
                See subject, chapter, speed and accuracy breakdowns. Uncover exactly where marks were lost.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-6 rounded-[20px] border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-3 transition-all hover:bg-white hover:shadow-md">
              <div className="w-10 h-10 rounded-[12px] bg-emerald-50 text-[#12A875] font-mono font-bold text-sm flex items-center justify-center border border-emerald-100 shadow-2xs">
                03
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">Follow your revision plan</h3>
              <p className="text-[13px] text-[#53647C] leading-relaxed">
                Practice the chapters most likely to improve your score with curated formulas, revision notes, and target sets.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. PERFORMANCE ANALYTICS SECTION */}
      <section id="performance-section" className="py-14 lg:py-18 bg-white/80 backdrop-blur-xl border-y border-slate-200/80 z-10 relative">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
              ACTIONABLE INSIGHTS
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-bold text-[#0F172A] tracking-tight">
              Know exactly where your marks are going.
            </h2>
            <p className="text-[15px] text-[#53647C] leading-relaxed">
              PrepX converts every mock test into clear, actionable recommendations so students know what to study next.
            </p>
          </div>

          <div className="bg-slate-50/70 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-6 sm:p-8 space-y-6">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-[16px] border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-[#53647C] uppercase">Total MCQs</span>
                <div className="text-xl font-bold font-mono text-[#0F172A] mt-1">200 Questions</div>
              </div>
              <div className="bg-white p-4 rounded-[16px] border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-[#53647C] uppercase">Attempted</span>
                <div className="text-xl font-bold font-mono text-[#0F172A] mt-1">174 MCQs</div>
              </div>
              <div className="bg-white p-4 rounded-[16px] border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-[#12A875] uppercase">Correct</span>
                <div className="text-xl font-bold font-mono text-[#12A875] mt-1">142 (+142.0)</div>
              </div>
              <div className="bg-white p-4 rounded-[16px] border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Incorrect Penalty</span>
                <div className="text-xl font-bold font-mono text-rose-600 mt-1">32 (-8.0)</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[16px] border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              <div>
                <h4 className="text-[14px] font-bold text-[#0F172A]">Chapter-Level Mistake Diagnosis</h4>
                <p className="text-[12px] text-[#53647C] mt-0.5">
                  Chemical Kinetics (Chemistry) & Rotational Dynamics (Physics) caused 12 out of 32 incorrect answers.
                </p>
              </div>
              <button 
                onClick={() => onEnterApp('study-resources')}
                className="px-4 py-2 bg-[#EEF4FF] hover:bg-blue-100 text-[#2563EB] font-semibold text-[12px] rounded-[10px] transition-colors shrink-0 cursor-pointer"
              >
                Review Weak Chapters
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 7. STUDY COINS & CONSISTENCY */}
      <section id="coins-section" className="py-14 lg:py-18 bg-[#F4F7FD] z-10 relative">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#E99716] uppercase tracking-wider bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              CONSISTENCY REWARDS
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-bold text-[#0F172A] tracking-tight pt-1">
              Stay consistent and earn Study Coins.
            </h2>
            <p className="text-[15px] text-[#53647C] leading-relaxed">
              Complete mocks, maintain study streaks and finish daily goals to earn coins that unlock revision packs and practice resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-[20px] border border-white/90 shadow-2xs space-y-2 transition-all hover:bg-white hover:shadow-md">
              <div className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <span>🪙 +20 Coins</span>
              </div>
              <h3 className="font-bold text-[14px] text-[#0F172A]">Finish a 200 Q Mock Test</h3>
              <p className="text-[12px] text-[#53647C]">
                Complete any timed full-length or chapter mock test to earn reward coins instantly.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-6 rounded-[20px] border border-white/90 shadow-2xs space-y-2 transition-all hover:bg-white hover:shadow-md">
              <div className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <span>🪙 +15 Coins</span>
              </div>
              <h3 className="font-bold text-[14px] text-[#0F172A]">Maintain a 5-Day Study Streak</h3>
              <p className="text-[12px] text-[#53647C]">
                Log in daily to complete at least one chapter revision set to maintain your streak bonus.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-6 rounded-[20px] border border-white/90 shadow-2xs space-y-2 transition-all hover:bg-white hover:shadow-md">
              <div className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <span>🪙 +10 Coins</span>
              </div>
              <h3 className="font-bold text-[14px] text-[#0F172A]">Complete Daily Target Plan</h3>
              <p className="text-[12px] text-[#53647C]">
                Check off all subject study targets on your daily study planner to boost your wallet.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 8. STATS PROOF SECTION */}
      <section className="py-12 bg-white/80 backdrop-blur-xl border-y border-slate-200/80 z-10 relative">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <div className="text-3xl font-bold font-mono text-[#2563EB]">200</div>
              <div className="text-[12px] font-medium text-[#53647C]">CEE-Style Questions Per Mock</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold font-mono text-[#7C3AED]">4</div>
              <div className="text-[12px] font-medium text-[#53647C]">Core CEE Subjects</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold font-mono text-[#12A875]">Real-time</div>
              <div className="text-[12px] font-medium text-[#53647C]">Performance Analysis</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold font-mono text-[#E99716]">Personalized</div>
              <div className="text-[12px] font-medium text-[#53647C]">Chapter Recommendations</div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto z-10 relative">
        <div className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-[24px] p-8 sm:p-12 text-white text-center space-y-5 shadow-[0_12px_40px_rgba(37,99,235,0.2)] border border-white/20 relative overflow-hidden">
          
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <h2 className="text-[28px] sm:text-[38px] font-bold tracking-tight text-white leading-tight">
              Start preparing with a clear plan—not guesswork.
            </h2>
            <p className="text-[15px] text-blue-100 leading-relaxed">
              Take your first PrepX mock and discover which chapters deserve your attention.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
            <button 
              onClick={() => onEnterApp()} 
              className="w-full sm:w-auto px-7 py-3.5 bg-white text-[#2563EB] hover:bg-slate-50 font-semibold text-[15px] rounded-[14px] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <span>Start Free Mock Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onEnterApp('reports')} 
              className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-[15px] rounded-[14px] border border-white/20 transition-all cursor-pointer backdrop-blur-md"
            >
              View Sample Report
            </button>
          </div>

        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/80 py-10 text-[13px] text-[#53647C] z-10 relative">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-200/60 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                PX
              </div>
              <span className="font-bold text-[#0F172A] text-base">PrepX Nepal</span>
            </div>

            <div className="flex flex-wrap items-center gap-5 font-medium text-[13px]">
              <button onClick={() => onEnterApp()} className="hover:text-[#2563EB] transition-colors">Mock Tests</button>
              <button onClick={() => onEnterApp()} className="hover:text-[#2563EB] transition-colors">Resources</button>
              <button onClick={() => onEnterApp()} className="hover:text-[#2563EB] transition-colors">Performance Reports</button>
              <button onClick={() => onEnterApp()} className="hover:text-[#2563EB] transition-colors">Pricing</button>
              <button onClick={() => onEnterApp()} className="hover:text-[#2563EB] transition-colors">Help Centre</button>
              <button onClick={() => onEnterApp()} className="hover:text-[#2563EB] transition-colors">Privacy Policy</button>
              <button onClick={() => onEnterApp()} className="hover:text-[#2563EB] transition-colors">Terms of Service</button>
              <button onClick={() => onEnterApp()} className="hover:text-[#2563EB] transition-colors">Contact</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#53647C]">
            <p>© 2026 PrepX Nepal. Designed for Medical Education Commission (MEC) Nepal CEE aspirants.</p>
            <p className="font-mono">Kathmandu, Nepal</p>
          </div>

        </div>
      </footer>

      {/* 11. MOBILE FLOATING LIQUID GLASS BOTTOM ACTION BAR */}
      <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.12)] rounded-2xl p-2.5 flex justify-around items-center md:hidden">
        <button 
          onClick={() => onEnterApp()}
          className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#2563EB]"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button 
          onClick={() => onEnterApp('mock-tests')}
          className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#53647C]"
        >
          <FileCheck className="w-4 h-4" />
          <span>Mocks</span>
        </button>
        <button 
          onClick={() => onEnterApp('reports')}
          className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#53647C]"
        >
          <LineChart className="w-4 h-4" />
          <span>Progress</span>
        </button>
        <button 
          onClick={() => onEnterApp('study-resources')}
          className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-[#53647C]"
        >
          <BookMarked className="w-4 h-4" />
          <span>Resources</span>
        </button>
      </div>

    </div>
  );
};
