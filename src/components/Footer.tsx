import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Lock
} from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string, subTab?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  // Mobile accordion state for collapsible sections
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  return (
    <footer className="bg-[#F5F8FD] text-[#172033] border-t border-[#E3E9F2] mt-16 font-sans relative overflow-hidden shadow-[0_-4px_20px_rgba(37,99,235,0.02)] select-none">
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
              Personalized mock tests, chapter-level analytics and focused revision tools for Nepal CEE preparation.
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

            <ul className={`space-y-2.5 pt-3 text-xs sm:text-[13px] font-medium text-[#627089] list-none pl-0 md:block ${
              openSection === 'prep' ? 'block' : 'hidden md:block'
            }`}>
              <li>
                <button 
                  onClick={() => onNavigate('policies', 'info')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Nepal CEE Rules
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Mock Tests
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Previous Year Papers
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('formulas')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Formula Library
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('planner')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Study Planner
                </button>
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
                Platform Navigation
              </h4>
              <span className="md:hidden text-[#8A96A8]">
                {openSection === 'platform' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            <ul className={`space-y-2.5 pt-3 text-xs sm:text-[13px] font-medium text-[#627089] list-none pl-0 md:block ${
              openSection === 'platform' ? 'block' : 'hidden md:block'
            }`}>
              <li>
                <button 
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('reports')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Performance Reports
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('saved')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Saved Questions
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('coins')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Study Coins Wallet
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('payment')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Subscription Pricing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('policies', 'info')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Help Centre Desk
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 — SUPPORT */}
          <div className="border-t md:border-t-0 border-[#E3E9F2] pt-4 md:pt-0 space-y-3">
            <h4 className="font-bold text-[#172033] text-xs sm:text-[14px] tracking-tight">
              Academic Support
            </h4>

            <p className="text-[#627089] text-xs sm:text-[13px] leading-snug">
              Need assistance with subscriptions, CEE marks, or payment verifications?
            </p>

            <button
              onClick={() => onNavigate('policies', 'issue')}
              className="h-[44px] px-4 bg-[#2563EB] hover:bg-[#1F4FC1] text-white font-bold text-xs sm:text-[13px] rounded-[14px] shadow-[0_4px_14px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer w-full text-center"
            >
              <HelpCircle className="w-4 h-4 text-white/90" />
              <span>Contact Support Desk</span>
            </button>

            <ul className="space-y-2 pt-1 text-xs sm:text-[13px] font-medium text-[#627089] list-none pl-0">
              <li>
                <button 
                  onClick={() => onNavigate('policies', 'faq')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('payment')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Payment Reference Claim
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('policies', 'issue')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full text-rose-600 font-semibold"
                >
                  Report a Problem
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('policies', 'terms')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('policies', 'privacy')}
                  className="hover:text-[#1F4FC1] transition-colors cursor-pointer text-left w-full"
                >
                  Privacy Policy
                </button>
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
            <button 
              onClick={() => onNavigate('policies', 'terms')}
              className="hover:text-[#1F4FC1] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => onNavigate('policies', 'privacy')}
              className="hover:text-[#1F4FC1] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => onNavigate('policies', 'coins-policy')}
              className="hover:text-[#1F4FC1] transition-colors cursor-pointer"
            >
              Study Coins Policy
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => onNavigate('policies', 'refund')}
              className="hover:text-[#1F4FC1] transition-colors cursor-pointer"
            >
              Refund Policy
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
};
