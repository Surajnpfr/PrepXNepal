import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Coins, 
  Menu, 
  User, 
  Sparkles, 
  ChevronDown, 
  Sliders, 
  CheckCircle2, 
  LogOut,
  ShieldAlert,
  X
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface TopbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  setUserRole: (role: UserRole) => void;
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  setUserRole,
  setMobileOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'CEE Mock #4 Published', desc: 'New full length 200 MCQ mock test live with negative marking.', time: '2h ago', read: false },
    { id: '2', title: '+20 Study Coins Earned', desc: 'You completed Biology Genetics revision set.', time: '5h ago', read: false },
    { id: '3', title: 'Target Gap Update', desc: 'Your projected CEE rank improved by 140 places!', time: '1d ago', read: true },
  ]);

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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-3 sm:top-4 z-30 mx-3 sm:mx-6 my-2 bg-white/75 backdrop-blur-2xl border border-white/80 rounded-[22px] shadow-[0_8px_32px_rgba(37,99,235,0.06)] px-4 sm:px-6 py-2.5 font-sans transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Title */}
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
          </div>
        </div>

        {/* Center: Search Field */}
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

        {/* Right Utility Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 border border-white/80 rounded-xl transition-all cursor-pointer relative shadow-2xs backdrop-blur-md"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-2xl border border-white/90 rounded-[22px] shadow-[0_12px_36px_rgba(15,23,42,0.12)] p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <button 
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    className="text-[10px] text-[#2563EB] font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto my-1">
                  {notifications.map((n) => (
                    <div key={n.id} className={`py-2.5 px-1 ${n.read ? 'opacity-70' : ''}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/80"
            >
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-2xs ring-2 ring-[#2563EB]/20">
                KN
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl border border-white/90 rounded-[22px] shadow-[0_12px_36px_rgba(15,23,42,0.12)] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3 font-sans">
                <div className="pb-2.5 border-b border-slate-100">
                  <div className="font-bold text-slate-900 text-sm">Krrish Nyoupane</div>
                  <div className="text-xs text-slate-500 font-medium">{userProfile.plan} Tier</div>
                </div>

                <div className="space-y-1 text-xs font-medium text-slate-700">
                  <button
                    onClick={() => {
                      setActiveTab('home');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('coins');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>Study Coins</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {userProfile.studyCoinBalance}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('leaderboard');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Leaderboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('payment');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Subscription</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('policies');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span>Settings</span>
                  </button>
                </div>

                {/* Role Switcher for preview */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Switch Role:</div>
                  <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                    {(['Student', 'Moderator', 'Admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setUserRole(r);
                          setShowProfileMenu(false);
                        }}
                        className={`py-1 rounded-lg transition-all cursor-pointer ${
                          userProfile.role === r 
                            ? 'bg-[#2563EB] text-white shadow-2xs' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => alert('Demo Account Logged In.')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
