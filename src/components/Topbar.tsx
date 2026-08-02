import React, { useEffect, useRef, useState } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
} from 'lucide-react';
import { SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { Show } from './Show';
import { AppNotification, UserProfile } from '../types';
import { formatRelativeTime } from '../lib/notifications';

interface TopbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  setMobileOpen: (open: boolean) => void;
  clerkSyncAt?: string | null;
  clerkSyncError?: string | null;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onOpenNotification: (notification: AppNotification) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  setMobileOpen,
  clerkSyncAt,
  clerkSyncError,
  notifications,
  onMarkAllRead,
  onMarkRead,
  onOpenNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifications) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showNotifications]);

  const getBreadcrumbTitle = (tab: string) => {
    switch (tab) {
      case 'home': return 'Dashboard';
      case 'catalog': return 'Mock Tests';
      case 'reports': return 'Progress';
      case 'formulas': return 'Study';
      case 'saved': return 'Saved Questions';
      case 'planner': return 'Study Planner';
      case 'leaderboard': return 'Leaderboard';
      case 'payment': return 'Subscription';
      case 'coins': return 'Study Coins';
      case 'admin': return 'Admin Operations';
      case 'policies': return 'Help & Support';
      default: return 'Dashboard';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchQuery.toLowerCase().includes('formula')) setActiveTab('formulas');
      else if (searchQuery.toLowerCase().includes('report') || searchQuery.toLowerCase().includes('rank')) setActiveTab('reports');
      else setActiveTab('catalog');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-3 sm:top-4 z-30 mx-3 sm:mx-6 my-2 bg-white/75 backdrop-blur-2xl border border-white/80 rounded-[22px] shadow-[0_8px_32px_rgba(37,99,235,0.06)] px-4 sm:px-6 py-2.5 font-sans transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 border border-white/80 rounded-xl transition-all cursor-pointer shadow-2xs"
            aria-label="Open Mobile Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {getBreadcrumbTitle(activeTab)}
            </h1>
            {clerkSyncAt && (
              <p className="text-[9px] font-mono text-emerald-600 hidden sm:block">
                Clerk synced {new Date(clerkSyncAt).toLocaleTimeString()}
              </p>
            )}
            {clerkSyncError && (
              <p className="text-[9px] font-mono text-amber-600 hidden sm:block" title={clerkSyncError}>
                Clerk sync notice
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="hidden md:block flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chapters or questions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/60 border border-white/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white/95 focus:border-[#2563EB]/40 focus:ring-2 focus:ring-[#2563EB]/15 backdrop-blur-md transition-all shadow-inner"
            />
          </div>
        </form>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 border border-white/80 rounded-xl transition-all cursor-pointer relative shadow-2xs backdrop-blur-md"
              title="Notifications"
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-rose-600 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-2xl border border-white/90 rounded-[22px] shadow-[0_12px_36px_rgba(15,23,42,0.12)] p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {notifications.length > 0 && (
                    <button 
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-[10px] text-[#2563EB] font-semibold hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto my-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 px-2 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-800">You're all caught up</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Mock scores, coin rewards, payments, and new catalog mocks will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          onMarkRead(n.id);
                          onOpenNotification(n);
                          setShowNotifications(false);
                        }}
                        className={`w-full text-left py-2.5 px-1.5 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 ${
                          n.read ? 'opacity-70' : 'bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.desc}</p>
                        {!n.read && (
                          <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Show when="signed-in">
              <div className="flex items-center gap-2 bg-slate-100/60 p-1 pr-3 rounded-xl border border-slate-200/50">
                <UserButton userProfileMode="modal" afterSignOutUrl="/" />
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] font-black text-slate-800 leading-none">{userProfile.name}</div>
                  <span className="text-[8px] font-bold text-slate-400 font-mono tracking-wide">{userProfile.role} • {userProfile.plan}</span>
                </div>
              </div>
            </Show>

            <Show when="signed-out">
              <div className="flex items-center gap-2">
                <SignInButton mode="modal" fallbackRedirectUrl="/" forceRedirectUrl="/" signUpFallbackRedirectUrl="/" signUpForceRedirectUrl="/">
                  <button className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal" fallbackRedirectUrl="/" forceRedirectUrl="/">
                  <button className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
};
