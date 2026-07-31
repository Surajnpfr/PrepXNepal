import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  Coins, 
  Filter, 
  Search, 
  Award,
  Sparkles
} from 'lucide-react';
import { MockTest, UserProfile } from '../types';

interface CatalogViewProps {
  mockTests: MockTest[];
  userProfile: UserProfile;
  onStartMock: (mock: MockTest) => void;
  onNavigate: (tab: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  mockTests,
  userProfile,
  onStartMock,
  onNavigate,
}) => {
  const [selectedKind, setSelectedKind] = useState<'All' | 'Mock' | 'PYP'>('All');
  const [selectedExam, setSelectedExam] = useState<'All' | 'Nepal CEE' | 'IOE Entrance'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMocks = mockTests.filter(m => {
    if (selectedKind !== 'All' && m.kind !== selectedKind) return false;
    if (selectedExam !== 'All' && m.examType !== selectedExam) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mock Tests & Previous Year Papers (PYP)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real CEE and IOE exam simulation with negative marking (-0.25) and server-timed countdown.
          </p>
        </div>

        {/* User Entitlement Quota Pill */}
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-slate-800 shadow-sm shrink-0">
          <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div className="text-xs">
            <div className="text-slate-400 text-[10px] uppercase font-mono">Current Plan</div>
            <div className="font-bold text-cyan-300">
              {userProfile.plan} Tier • {userProfile.mocksRemaining !== null ? `${userProfile.mocksRemaining} Mocks Left` : 'Unlimited Mocks'}
            </div>
          </div>
          {userProfile.plan === 'Free' && (
            <button
              onClick={() => onNavigate('payment')}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-[11px] rounded-lg hover:bg-amber-400 transition-colors ml-2 cursor-pointer"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Kind Filters */}
        <div className="flex items-center space-x-2 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setSelectedKind('All')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              selectedKind === 'All' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Catalog
          </button>
          <button
            onClick={() => setSelectedKind('Mock')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              selectedKind === 'Mock' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            CEE Full Mocks
          </button>
          <button
            onClick={() => setSelectedKind('PYP')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              selectedKind === 'PYP' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            PYP Past Papers
          </button>
        </div>

        {/* Exam Type & Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
          >
            <option value="All">All Exams (CEE / IOE)</option>
            <option value="Nepal CEE">Nepal CEE</option>
            <option value="IOE Entrance">IOE Entrance</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mocks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMocks.map((mock) => {
          const isFreeDemo = mock.id.includes('demo') || mock.coinPrice === 0;
          const isEntitled = userProfile.plan === 'Unlimited' || (userProfile.mocksRemaining ?? 0) > 0 || isFreeDemo;

          return (
            <div 
              key={mock.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono ${
                    mock.kind === 'PYP' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {mock.kind === 'PYP' ? `Official PYP (${mock.year})` : 'Grand Model Mock'}
                  </span>

                  <span className="text-xs font-bold text-slate-500 font-mono">
                    {mock.examType}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {mock.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Authentic exam paper structure featuring 20 questions per page, server-synced time, and negative marking rules.
                </p>

                {/* Specs Pill List */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-slate-600">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                    <span className="block font-bold text-slate-900">{mock.totalQuestions} Qs</span>
                    <span className="text-[9px] text-slate-400">Total</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                    <span className="block font-bold text-slate-900">{Math.floor(mock.durationSec / 3600)} Hrs</span>
                    <span className="text-[9px] text-slate-400">Duration</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                    <span className="block font-bold text-rose-600">-0.25</span>
                    <span className="text-[9px] text-slate-400">Neg Mark</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                {isEntitled ? (
                  <button
                    onClick={() => onStartMock(mock)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Start Timed Attempt</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('payment')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
                  >
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Upgrade Plan to Unlock</span>
                  </button>
                )}

                <div className="text-center text-[10px] text-slate-400">
                  {isFreeDemo ? 'Free Demo Mock for all aspirants' : '1 Quota / Mock Deduction upon Start'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
