import React, { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  FileCheck, 
  BarChart3, 
  BookOpen, 
  Bookmark, 
  CalendarCheck, 
  Trophy, 
  Sliders, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  X
} from 'lucide-react';
import { UserProfile } from '../types';
import { isStaffRole } from '../lib/clerkUserMapper';
import { BrandLogo } from './BrandLogo';
import { AppIcon } from './ui';

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

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

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
  const showLabels = !isCollapsed || mobileOpen;

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const coreNavItems: NavItem[] = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: 'Mock Tests', icon: FileCheck },
    { id: 'payment', label: 'Pricing & Plans', icon: Zap },
  ];

  const studyNavItems: NavItem[] = [
    { id: 'formulas', label: 'Formula Library', icon: BookOpen },
    { id: 'saved', label: 'Saved Questions', icon: Bookmark, badge: savedQuestionsCount },
    { id: 'planner', label: 'Study Planner', icon: CalendarCheck },
  ];

  const canAccessAdmin = isStaffRole(userProfile);

  const analyticsNavItems: NavItem[] = [
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

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      {showLabels && (
        <div className="px-3 pt-4 pb-1.5 text-[10px] uppercase font-semibold tracking-[0.08em] text-[var(--px-muted)]">
          {title}
        </div>
      )}
      {items.map((item) => {
        const isActive = activeTab === item.id || (item.id === 'catalog' && activeTab === 'mock-engine');

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNav(item.id)}
            title={!showLabels ? item.label : undefined}
            data-active={isActive}
            aria-current={isActive ? 'page' : undefined}
            className="px-nav-item"
          >
            <AppIcon
              icon={item.icon}
              size="nav"
              className={`transition-colors duration-200 ${
                isActive ? 'text-[var(--px-primary)]' : 'text-[var(--px-muted)]'
              }`}
            />
            
            {showLabels && (
              <span className="truncate flex-1 text-left">{item.label}</span>
            )}

            {showLabels && item.badge !== undefined && (
              <span
                className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-[var(--px-primary)]/15 text-[var(--px-primary)]'
                    : 'bg-[var(--px-surface-muted)] text-[var(--px-body)]'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="h-full min-h-0 flex flex-col">
      <div className="p-4 border-b border-[var(--px-border)] flex items-center justify-between shrink-0">
        <div 
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleNav('home');
          }}
        >
          <BrandLogo size={36} decorative className="shrink-0" />

          {showLabels && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-base text-[var(--px-heading)] tracking-tight leading-none">
                  PrepX
                </span>
                <span className="px-badge px-badge-primary">Nepal</span>
              </div>
              <span className="text-[11px] text-[var(--px-muted)] font-medium mt-0.5">
                CEE preparation
              </span>
            </div>
          )}
        </div>

        {mobileOpen && (
          <button 
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden touch-target inline-flex items-center justify-center p-2 text-[var(--px-muted)] hover:text-[var(--px-heading)] hover:bg-[var(--px-surface-muted)] rounded-[12px] transition-colors duration-200 shrink-0"
            aria-label="Close navigation"
          >
            <AppIcon icon={X} size="btn" />
          </button>
        )}
      </div>

      <nav
        className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto overscroll-contain"
        aria-label="Primary"
      >
        {renderNavGroup('Workspace', coreNavItems)}
        {renderNavGroup('Study', studyNavItems)}
        {renderNavGroup('Insights', analyticsNavItems)}
      </nav>

      <div className="p-3 border-t border-[var(--px-border)] space-y-2 shrink-0 bg-[var(--px-surface)]">
        {showLabels && (
          <div className="bg-[var(--px-surface-muted)] p-2.5 rounded-[12px] border border-[var(--px-border)] flex items-center gap-2.5 text-xs min-w-0">
            <div className="w-7 h-7 rounded-[10px] bg-[var(--px-primary-light)] text-[var(--px-primary)] font-display font-bold flex items-center justify-center shrink-0">
              {userProfile.name ? userProfile.name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="font-semibold text-[var(--px-heading)] truncate text-[11px]">
                {userProfile.name}
              </div>
              <div className="text-[10px] text-[var(--px-muted)] truncate">{userProfile.plan} plan</div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-full items-center justify-center min-h-11 p-2 text-[var(--px-muted)] hover:text-[var(--px-heading)] hover:bg-[var(--px-surface-muted)] rounded-[12px] transition-colors duration-200 cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <AppIcon icon={ChevronRight} size="nav" /> : <AppIcon icon={ChevronLeft} size="nav" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside 
        className={`hidden md:flex md:flex-col sticky top-4 h-[calc(100dvh-2rem)] my-4 ml-4 rounded-[16px] bg-[var(--px-surface)] border border-[var(--px-border)] shadow-[var(--px-shadow)] transition-all duration-300 ease-[var(--px-ease)] z-30 shrink-0 overflow-hidden min-h-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="Sidebar"
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation">
          <div 
            className="absolute inset-0 bg-[var(--px-heading)]/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[min(20rem,88vw)] h-full min-h-0 flex flex-col bg-[var(--px-surface)] border-r border-[var(--px-border)] shadow-[var(--px-shadow-lg)] animate-[slideIn_200ms_ease-out] overflow-hidden">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
