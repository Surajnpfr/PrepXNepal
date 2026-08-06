import React, { useState } from 'react';
import { 
  Brain,
  Coins, 
  Sliders,
  Zap, 
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { isStaffRole } from '../lib/clerkUserMapper';
import { planDisplayName } from '../lib/planDisplay';
import { BrandLogo } from './BrandLogo';
import { AppIcon } from './ui';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  setUserRole: (role: UserRole) => void;
  pendingPaymentCount: number;
  onOpenBrainPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  setUserRole,
  pendingPaymentCount,
  onOpenBrainPortal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-slate-950 text-white font-sans sticky top-0 z-50 border-b border-slate-800 shadow-md">
      {/* Top Notification Announcement Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-normal">
          <div className="mx-auto sm:mx-0 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium text-center sm:text-left">
              PrepX Nepal CEE 2026 Season Active! Timed mocks with negative marking.
            </span>
            <button 
              onClick={() => handleNavClick('payment')}
              className="hidden sm:inline-block text-amber-300 font-bold underline hover:text-amber-200 transition-colors cursor-pointer"
            >
              Get Standard (Rs.149)
            </button>
          </div>

          {/* Persona Switcher Pill */}
          <div className="hidden lg:flex items.center space-x-1.5 text-[10px] shrink-0 font-mono">
            <span className="text-slate-400 mr-1">Role:</span>
            <button
              onClick={() => setUserRole('Student')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                userProfile.role === 'Student' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setUserRole('Content Manager')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                userProfile.role === 'Content Manager' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Content Manager
            </button>
            <button
              onClick={() => setUserRole('Admin')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                userProfile.role === 'Admin' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin {pendingPaymentCount > 0 && `(${pendingPaymentCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Brain Portal Trigger */}
        <div className="flex items-center space-x-3 shrink-0">
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
          >
              <BrandLogo size={32} decorative className="shrink-0 group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-lg font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors block leading-none">
                PrepX Nepal
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Prepare Smarter
              </span>
            </div>
          </div>

          {onOpenBrainPortal && (
            <button
              onClick={onOpenBrainPortal}
              className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-[10px] font-extrabold rounded-full shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer ml-1 sm:ml-2 border border-cyan-400/30"
              title="Open Split Brain Landing Portal"
            >
              <AppIcon icon={Brain} size="btn" />
              <span className="hidden sm:inline">Split Brain Portal</span>
            </button>
          )}
        </div>

        {/* Center Nav Links Desktop */}
        <nav className="hidden md:flex items-center space-x-5 text-xs font-semibold text-slate-300">
          <button
            onClick={() => handleNavClick('home')}
            className={`transition-all py-1 cursor-pointer border-b-2 ${
              activeTab === 'home' ? 'text-cyan-400 font-bold border-cyan-400' : 'border-transparent hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleNavClick('catalog')}
            className={`transition-all py-1 cursor-pointer border-b-2 ${
              activeTab === 'catalog' || activeTab === 'mock-engine' ? 'text-cyan-400 font-bold border-cyan-400' : 'border-transparent hover:text-white'
            }`}
          >
            Mocks Engine
          </button>
          <button
            onClick={() => handleNavClick('reports')}
            className={`transition-all py-1 cursor-pointer border-b-2 ${
              activeTab === 'reports' ? 'text-cyan-400 font-bold border-cyan-400' : 'border-transparent hover:text-white'
            }`}
          >
            Reports & Rank
          </button>
          <button
            onClick={() => handleNavClick('formulas')}
            className={`transition-all py-1 cursor-pointer border-b-2 ${
              activeTab === 'formulas' ? 'text-cyan-400 font-bold border-cyan-400' : 'border-transparent hover:text-white'
            }`}
          >
            Formulas & Saved
          </button>
          <button
            onClick={() => handleNavClick('payment')}
            className={`transition-all py-1 cursor-pointer flex items-center gap-1 border-b-2 ${
              activeTab === 'payment' ? 'text-amber-400 font-bold border-amber-400' : 'border-transparent hover:text-white'
            }`}
          >
            <span>Upgrade Plan</span>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded border border-amber-500/40 font-mono">
              {planDisplayName(userProfile.plan)}
            </span>
          </button>

          {(userProfile.role === 'Admin' || isStaffRole(userProfile)) && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`transition-all py-1 cursor-pointer inline-flex items-center gap-1.5 border-b-2 ${
                activeTab === 'admin' ? 'text-rose-400 font-bold border-rose-400' : 'border-transparent hover:text-slate-300'
              }`}
            >
              <AppIcon icon={Sliders} size="btn" className="text-rose-400" />
              <span>Admin Desk</span>
              {pendingPaymentCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingPaymentCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Right Actions: Coins Pill, Mobile Menu Button */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Study Coins Pill */}
          <button
            onClick={() => handleNavClick('coins')}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all shadow-xs"
            title="Study Coins — Coming soon"
          >
            <AppIcon icon={Coins} size="btn" className="text-amber-400" />
            <span className="text-[10px] sm:text-xs font-bold tracking-wide">Soon</span>
          </button>

          {/* Quick Mock Trigger */}
          <button
            onClick={() => handleNavClick('catalog')}
            className="px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <AppIcon icon={Zap} size="btn" />
            <span className="hidden sm:inline">Start CEE Mock</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer transition-colors inline-flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <AppIcon icon={X} size="nav" /> : <AppIcon icon={Menu} size="nav" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-3 font-sans animate-in slide-in-from-top duration-200">
          <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider pb-1 border-b border-slate-800">
            Navigation Menu
          </div>

          <div className="grid grid-cols-1 gap-1 font-semibold text-sm">
            <button
              onClick={() => handleNavClick('home')}
              className={`p-2.5 rounded-xl text-left inline-flex items-center justify-between ${
                activeTab === 'home' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>Dashboard</span>
              <AppIcon icon={ChevronRight} size="btn" className="opacity-60" />
            </button>

            <button
              onClick={() => handleNavClick('catalog')}
              className={`p-2.5 rounded-xl text-left inline-flex items-center justify-between ${
                activeTab === 'catalog' || activeTab === 'mock-engine' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>Mock Tests Engine</span>
              <AppIcon icon={ChevronRight} size="btn" className="opacity-60" />
            </button>

            <button
              onClick={() => handleNavClick('reports')}
              className={`p-2.5 rounded-xl text-left inline-flex items-center justify-between ${
                activeTab === 'reports' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>Reports & Rank Prediction</span>
              <AppIcon icon={ChevronRight} size="btn" className="opacity-60" />
            </button>

            <button
              onClick={() => handleNavClick('formulas')}
              className={`p-2.5 rounded-xl text-left inline-flex items-center justify-between ${
                activeTab === 'formulas' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>Formulas & Revision Sheets</span>
              <AppIcon icon={ChevronRight} size="btn" className="opacity-60" />
            </button>

            <button
              onClick={() => handleNavClick('payment')}
              className={`p-2.5 rounded-xl text-left inline-flex items-center justify-between ${
                activeTab === 'payment' ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="inline-flex items-center gap-2">
                <span>Upgrade Plan</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {planDisplayName(userProfile.plan)}
                </span>
              </div>
              <AppIcon icon={ChevronRight} size="btn" className="opacity-60" />
            </button>

            <button
              onClick={() => handleNavClick('coins')}
              className={`p-2.5 rounded-xl text-left inline-flex items-center justify-between ${
                activeTab === 'coins' ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="inline-flex items-center gap-2">
                <span>Study Coins</span>
                <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  Soon
                </span>
              </div>
              <AppIcon icon={ChevronRight} size="btn" className="opacity-60" />
            </button>

            {(userProfile.role === 'Admin' || isStaffRole(userProfile)) && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`p-2.5 rounded-xl text-left inline-flex items-center justify-between ${
                  activeTab === 'admin' ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="inline-flex items-center gap-2">
                  <AppIcon icon={Sliders} size="btn" className="text-rose-400" />
                  <span>Admin Desk</span>
                  {pendingPaymentCount > 0 && (
                    <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {pendingPaymentCount} Pending
                    </span>
                  )}
                </div>
                <AppIcon icon={ChevronRight} size="btn" className="opacity-60" />
              </button>
            )}
          </div>

          {/* Role Switcher in Mobile Drawer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Switch Role:</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setUserRole('Student')}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  userProfile.role === 'Student' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => setUserRole('Content Manager')}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  userProfile.role === 'Content Manager' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Content Manager
              </button>
              <button
                onClick={() => setUserRole('Admin')}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  userProfile.role === 'Admin' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
