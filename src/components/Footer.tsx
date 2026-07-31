import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  ArrowUpRight,
  Lock
} from 'lucide-react';

export const Footer: React.FC = () => {
  // Mobile accordion state for collapsible sections
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  return (
    <footer className="bg-[#F5F8FD] text-[#172033] border-t border-[#E3E9F2] mt-16 font-sans relative overflow-hidden shadow-[0_-4px_20px_rgba(37,99,235,0.02)]">
      {/* Subtle atmospheric ambient glow behind footer */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-5xl h-48 bg-gradient-to-r from-blue-200/20 via-indigo-200/15 to-purple-200/20 blur-3xl pointer-events-none" />

      {/* Main Footer Container */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 pb-8 relative z-10 space-y-8">
        
        {/* 1. FOUR MAIN COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* COLUMN 1 — BRAND */}
          <div className="space-y-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black text-xs shadow-sm ring-2 ring-blue-500/20">
                PX
              </div>
              <div>
                <span className="font-extrabold text-[#172033] text-base tracking-tight block leading-none">
                  PrepX Nepal
                </span>
                <span className="text-[11px] text-[#315FCE] font-bold">
                  Prepare smarter. Improve faster.
                </span>
              </div>
            </div>

            <p className="text-[#627089] text-xs sm:text-[13px] leading-relaxed max-w-xs font-normal">
              Personalized mock tests, chapter-level analytics and focused revision tools for Nepal CEE and IOE entrance preparation.
            </p>

            <div className="pt-1 text-[11px] text-[#8A96A8] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12A875] shrink-0" />
              <span>Built for students preparing for competitive entrance exams in Nepal.</span>
            </div>
          </div>

          {/* COLUMN 2 — PREPARATION */}
          <div className="border-t md:border-t-0 border-[#E3E9F2] pt-4 md:pt-0">
            <button
              onClick={() => toggleSection('prep')}
              className="w-full flex items-center justify-between md:cursor-default text-left py-1"
            >
              <h4 className="font-bold text-[#172033] text-xs sm:text-[14px] tracking-tight">
                Preparation
              </h4>
              <span className="md:hidden text-[#8A96A8]">
                {openSection === 'prep' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            <ul className={`space-y-2.5 pt-3 text-xs sm:text-[13px] font-medium text-[#627089] md:block ${
              openSection === 'prep' ? 'block' : 'hidden md:block'
            }`}>
              <li>
                <a href="#cee" className="hover:text-[#1F4FC1] transition-colors flex items-center gap-1 group">
                  <span>Nepal CEE</span>
                </a>
              </li>
              <li>
                <a href="#ioe" className="hover:text-[#1F4FC1] transition-colors">IOE Entrance</a>
              </li>
              <li>
                <a href="#mocks" className="hover:text-[#1F4FC1] transition-colors">Mock Tests</a>
              </li>
              <li>
                <a href="#pyp" className="hover:text-[#1F4FC1] transition-colors">Previous Year Papers</a>
              </li>
              <li>
                <a href="#formulas" className="hover:text-[#1F4FC1] transition-colors">Formula Library</a>
              </li>
              <li>
                <a href="#planner" className="hover:text-[#1F4FC1] transition-colors">Study Planner</a>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 — PLATFORM */}
          <div className="border-t md:border-t-0 border-[#E3E9F2] pt-4 md:pt-0">
            <button
              onClick={() => toggleSection('platform')}
              className="w-full flex items-center justify-between md:cursor-default text-left py-1"
            >
              <h4 className="font-bold text-[#172033] text-xs sm:text-[14px] tracking-tight">
                Platform
              </h4>
              <span className="md:hidden text-[#8A96A8]">
                {openSection === 'platform' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            <ul className={`space-y-2.5 pt-3 text-xs sm:text-[13px] font-medium text-[#627089] md:block ${
              openSection === 'platform' ? 'block' : 'hidden md:block'
            }`}>
              <li>
                <a href="#dashboard" className="hover:text-[#1F4FC1] transition-colors">Dashboard</a>
              </li>
              <li>
                <a href="#reports" className="hover:text-[#1F4FC1] transition-colors">Performance Reports</a>
              </li>
              <li>
                <a href="#saved" className="hover:text-[#1F4FC1] transition-colors">Saved Questions</a>
              </li>
              <li>
                <a href="#coins" className="hover:text-[#1F4FC1] transition-colors">Study Coins</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#1F4FC1] transition-colors">Pricing</a>
              </li>
              <li>
                <a href="#help" className="hover:text-[#1F4FC1] transition-colors">Help Centre</a>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 — SUPPORT */}
          <div className="border-t md:border-t-0 border-[#E3E9F2] pt-4 md:pt-0 space-y-3">
            <h4 className="font-bold text-[#172033] text-xs sm:text-[14px] tracking-tight">
              Support
            </h4>

            <p className="text-[#627089] text-xs sm:text-[13px] leading-snug">
              Need help with your account, mock test or payment?
            </p>

            {/* Primary Support Button (44px height) */}
            <a
              href="mailto:support@prepxnepal.com"
              className="h-[44px] px-4 bg-[#2563EB] hover:bg-[#1F4FC1] text-white font-bold text-xs sm:text-[13px] rounded-[14px] shadow-[0_4px_14px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto inline-flex"
            >
              <HelpCircle className="w-4 h-4 text-white/90" />
              <span>Contact Support</span>
            </a>

            <ul className="space-y-2 pt-1 text-xs sm:text-[13px] font-medium text-[#627089]">
              <li>
                <a href="#faq" className="hover:text-[#1F4FC1] transition-colors">Frequently Asked Questions</a>
              </li>
              <li>
                <a href="#verification" className="hover:text-[#1F4FC1] transition-colors">Payment Verification</a>
              </li>
              <li>
                <a href="#issue" className="hover:text-[#1F4FC1] transition-colors">Report an Issue</a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#1F4FC1] transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-[#1F4FC1] transition-colors">Privacy Policy</a>
              </li>
            </ul>
          </div>

        </div>

        {/* 2. TRUST AND PAYMENT STRIP (Liquid Glass Panel) */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-[20px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(37,99,235,0.03)] grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-center text-xs text-[#627089]">
          
          {/* Group 1 — Platform Status */}
          <div className="space-y-1">
            <div className="font-bold text-[#172033] flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#12A875]" />
              <span>Platform Availability & Speed</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-[#627089] font-medium">
              <span>99.5% target availability</span>
              <span>•</span>
              <span>Secure exam timing</span>
              <span>•</span>
              <span>Fast report generation</span>
            </div>
          </div>

          {/* Group 2 — Payment Methods */}
          <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-[#E3E9F2] pt-3 md:pt-0 md:pl-5">
            <div className="font-bold text-[#172033] text-xs">
              Accepted payments
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 bg-emerald-50/90 text-[#12A875] border border-emerald-200/80 rounded-lg font-bold text-[11px] shadow-2xs">
                eSewa
              </span>
              <span className="px-2.5 py-1 bg-purple-50/90 text-purple-700 border border-purple-200/80 rounded-lg font-bold text-[11px] shadow-2xs">
                Khalti
              </span>
              <span className="px-2.5 py-1 bg-blue-50/90 text-[#2563EB] border border-blue-200/80 rounded-lg font-bold text-[11px] shadow-2xs">
                Bank Transfer
              </span>
            </div>
            <p className="text-[11px] text-[#8A96A8]">
              Manual payment verification is available when required.
            </p>
          </div>

          {/* Group 3 — Security and Fair Use */}
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-[#E3E9F2] pt-3 md:pt-0 md:pl-5">
            <div className="font-bold text-[#172033] flex items-center gap-1.5 text-xs">
              <Lock className="w-3.5 h-3.5 text-[#315FCE]" />
              <span>Security & Protection</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-[#627089] font-medium">
              <span>Secure payments</span>
              <span>•</span>
              <span>Fair Study Coins policy</span>
              <span>•</span>
              <span>Protected student data</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. BOTTOM LEGAL BAR */}
      <div className="bg-[#EBEEF5]/80 border-t border-[#E3E9F2] py-3.5 px-4 sm:px-6 text-[12px] text-[#627089] font-medium">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          
          <div className="flex items-center gap-2">
            <span>© 2026 PrepX Nepal. All rights reserved.</span>
            <span className="hidden sm:inline text-[#8A96A8]">•</span>
            <span className="text-[11px] text-[#8A96A8] font-mono">Platform v1.0</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[12px]">
            <a href="#terms" className="hover:text-[#1F4FC1] transition-colors">Terms of Service</a>
            <span className="text-slate-300">•</span>
            <a href="#privacy" className="hover:text-[#1F4FC1] transition-colors">Privacy Policy</a>
            <span className="text-slate-300">•</span>
            <a href="#coins-policy" className="hover:text-[#1F4FC1] transition-colors">Study Coins Policy</a>
            <span className="text-slate-300">•</span>
            <a href="#refund" className="hover:text-[#1F4FC1] transition-colors">Refund Policy</a>
          </div>

        </div>
      </div>

    </footer>
  );
};
