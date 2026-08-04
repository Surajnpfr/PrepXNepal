import React, { useEffect, useRef, useState } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { Show } from './Show';
import { AppNotification, UserProfile } from '../types';
import { formatRelativeTime } from '../lib/notifications';
import { AppIcon, Input } from './ui';
import { ClerkAuthControls } from './ClerkAuthControls';

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
      case 'about': return 'About PrepX Nepal';
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
    <header className="sticky top-2 sm:top-4 z-30 mx-3 sm:mx-6 my-2 bg-[var(--px-surface)] border border-[var(--px-border)] rounded-[16px] shadow-[var(--px-shadow)] px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden touch-target inline-flex items-center justify-center p-2 text-[var(--px-body)] hover:text-[var(--px-heading)] bg-[var(--px-surface-muted)] hover:bg-[var(--px-border)]/40 border border-[var(--px-border)] rounded-[12px] transition-colors duration-200 cursor-pointer shrink-0"
            aria-label="Open navigation"
          >
            <AppIcon icon={Menu} size="nav" />
          </button>

          <div className="min-w-0">
            <p className="font-display text-sm sm:text-lg font-bold text-[var(--px-heading)] tracking-tight leading-tight truncate">
              {getBreadcrumbTitle(activeTab)}
            </p>
            {clerkSyncAt && (
              <p className="text-[10px] text-[var(--px-muted)] hidden sm:block">
                Synced {new Date(clerkSyncAt).toLocaleTimeString()}
              </p>
            )}
            {clerkSyncError && (
              <p className="text-[10px] text-[var(--px-warning)] hidden sm:block" title={clerkSyncError}>
                Sync issue
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="hidden md:block flex-1 max-w-md mx-4 min-w-0" role="search">
          <div className="relative">
            <AppIcon icon={Search} size="btn" className="text-[var(--px-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search chapters or mocks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[var(--px-surface-muted)]"
              aria-label="Search chapters or mocks"
            />
          </div>
        </form>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="touch-target inline-flex items-center justify-center p-2 text-[var(--px-body)] hover:text-[var(--px-heading)] bg-[var(--px-surface-muted)] hover:bg-[var(--px-border)]/40 border border-[var(--px-border)] rounded-[12px] transition-colors duration-200 cursor-pointer relative"
              title="Notifications"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <AppIcon icon={Bell} size="btn" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-[var(--px-error)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] bg-[var(--px-surface)] border border-[var(--px-border)] rounded-[16px] shadow-[var(--px-shadow-lg)] p-3.5 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--px-border)] gap-2">
                  <span className="text-xs font-semibold text-[var(--px-heading)] font-display">
                    Notifications
                  </span>
                  {notifications.length > 0 && (
                    <button 
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-[11px] text-[var(--px-primary)] font-semibold hover:underline cursor-pointer min-h-11 sm:min-h-0 inline-flex items-center"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[var(--px-border)] max-h-[min(18rem,50vh)] overflow-y-auto my-1 overscroll-contain">
                  {notifications.length === 0 ? (
                    <div className="py-6 px-2 text-center space-y-1">
                      <p className="text-xs font-semibold text-[var(--px-heading)]">You're all caught up</p>
                      <p className="text-[11px] text-[var(--px-muted)] leading-snug">
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
                        className={`w-full text-left py-2.5 px-1.5 rounded-[12px] transition-colors duration-200 cursor-pointer hover:bg-[var(--px-surface-muted)] min-h-11 ${
                          n.read ? 'opacity-70' : 'bg-[var(--px-primary-light)]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--px-heading)] truncate">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-[var(--px-muted)] shrink-0">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--px-body)] mt-0.5 leading-snug line-clamp-3">
                          {n.desc}
                        </p>
                        {!n.read && (
                          <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-[var(--px-primary)]" aria-hidden />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Show when="signed-in">
              <div className="flex items-center gap-2 bg-[var(--px-surface-muted)] p-1 pr-2 sm:pr-3 rounded-[12px] border border-[var(--px-border)] max-w-[11rem] sm:max-w-none">
                <UserButton
                  userProfileMode="modal"
                  afterSignOutUrl="/"
                  userProfileProps={{
                    apiKeysProps: { hide: true },
                  }}
                />
                <div className="text-left hidden sm:block min-w-0">
                  <div className="text-[11px] font-semibold text-[var(--px-heading)] leading-none truncate">
                    {userProfile.name}
                  </div>
                  <span className="text-[10px] font-medium text-[var(--px-muted)] tracking-wide truncate block mt-0.5">
                    {userProfile.role} · {userProfile.plan}
                  </span>
                </div>
              </div>
            </Show>

            <Show when="signed-out">
              <ClerkAuthControls />
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
};
