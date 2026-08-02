import React from 'react';
import { 
  LayoutDashboard, 
  FileCheck, 
  BarChart3, 
  BookOpen, 
  Bookmark, 
  CalendarCheck, 
  Trophy, 
  Sparkles, 
  Coins, 
  Sliders, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react';
import { UserProfile } from '../types';
import { isStaffRole } from '../lib/clerkUserMapper';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  pendingPaymentCount?: number;
  savedQuestionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
  pendingPaymentCount = 0,
  savedQuestionsCount = 0,
}) => {
  const handleNav = (tab: string) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const coreNavItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: 'Mock Tests', icon: FileCheck },
    { id: 'payment', label: 'Pricing & Plans', icon: Zap },
  ];

  const studyNavItems = [
    { id: 'formulas', label: 'Formula Library', icon: BookOpen },
    { id: 'saved', label: 'Saved Questions', icon: Bookmark, badge: savedQuestionsCount },
    { id: 'planner', label: 'Study Planner', icon: CalendarCheck },
  ];

  const canAccessAdmin = isStaffRole(userProfile);

  const analyticsNavItems: any[] = [
    { id: 'reports', label: 'Progress Reports', icon: BarChart3 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'policies', label: 'Help & Support', icon: HelpCircle },
  ];

  if (canAccessAdmin) {
    analyticsNavItems.push({
      id: 'admin',
      label: 'Admin Desk',
      icon: Sliders,
      badge: pendingPaymentCount > 0 ? pendingPaymentCount : undefined,
    });
  }

  const renderNavGroup = (title: string, items: any[]) => (
    <div className="space-y-1">
      {!isCollapsed && (
        <div className="px-3 pt-3 pb-1 text-[10px] uppercase font-mono font-black tracking-widest text-slate-400">
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id || (item.id === 'catalog' && activeTab === 'mock-engine');

        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            title={isCollapsed ? item.label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer relative group ${
              isActive
                ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold border border-[#2563EB]/25 shadow-[0_2px_8px_rgba(37,99,235,0.08)] backdrop-blur-md'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-700'}`} />
            
            {!isCollapsed && (
              <span className="truncate flex-1 text-left">{item.label}</span>
            )}

            {!isCollapsed && item.badge !== undefined && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-[#2563EB]/20 text-[#2563EB]' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between font-sans py-2">
      {/* Top Header Logo */}
      <div>
        <div className="p-4 border-b border-slate-200/50 flex items-center justify-between">
          <div 
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-[0_4px_12px_rgba(37,99,235,0.25)] border border-white/30 group-hover:scale-105 transition-transform shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base text-slate-900 tracking-tight leading-none">PrepX</span>
                  <span className="text-[10px] font-bold uppercase bg-blue-100/80 text-blue-700 px-1.5 py-0.5 rounded font-mono border border-blue-200/60 backdrop-blur-xs">
                    NEPAL
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">CEE 2026 Aspirants</span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          {mobileOpen && (
            <button 
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Categorized Navigation Groups */}
        <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
          {renderNavGroup('Main Workspace', coreNavItems)}
          {renderNavGroup('Study & Practice', studyNavItems)}
          {renderNavGroup('Analytics & Governance', analyticsNavItems)}
        </div>
      </div>

      {/* Bottom Desktop Collapse Trigger & User Status Card */}
      <div className="p-3 border-t border-slate-200/50 space-y-2">
        {!isCollapsed && (
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5 text-xs">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#2563EB] font-mono font-black flex items-center justify-center shrink-0">
              {userProfile.name ? userProfile.name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 truncate text-[11px]">{userProfile.name}</div>
              <div className="text-[10px] font-mono text-slate-500 truncate">{userProfile.plan} Tier</div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-full items-center justify-center p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar with Liquid Glass styling */}
      <aside 
        className={`hidden md:block sticky top-4 h-[calc(100vh-2rem)] my-4 ml-4 rounded-[24px] bg-white/75 backdrop-blur-3xl border border-white/80 shadow-[0_8px_32px_rgba(37,99,235,0.06)] transition-all duration-300 z-30 shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-72 max-w-[80vw] bg-white/85 backdrop-blur-2xl border-r border-white/90 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
