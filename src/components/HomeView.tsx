import React, { useState } from 'react';
import { 
  Target, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileCheck,
  TrendingUp,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { UserProfile, MockTest, AttemptReport } from '../types';

interface HomeViewProps {
  userProfile: UserProfile;
  onUpdateTargetScore: (newScore: number) => void;
  mockTests: MockTest[];
  pastReports: AttemptReport[];
  onStartMock: (mock: MockTest) => void;
  onViewReport: (report: AttemptReport) => void;
  onNavigate: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userProfile,
  onUpdateTargetScore,
  mockTests,
  pastReports,
  onStartMock,
  onViewReport,
  onNavigate,
}) => {
  // Interactive checklist state for Today's Plan
  const [studyPlanItems, setStudyPlanItems] = useState([
    { id: '1', title: 'Chemical Bonding practice', duration: '25 min', completed: true },
    { id: '2', title: 'Biology revision', duration: '20 min', completed: false },
    { id: '3', title: 'CEE Mock Test #4', duration: '3 hr', completed: false },
  ]);

  const [showRecentActivity, setShowRecentActivity] = useState(true);

  const togglePlanItem = (id: string) => {
    setStudyPlanItems(prev =>
      prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    );
  };

  const completedCount = studyPlanItems.filter(i => i.completed).length;

  const nextMock = mockTests[0] || {
    id: 'mock-cee-4',
    title: 'CEE Mock Test #4',
    questionsCount: 200,
    durationMinutes: 180,
  };

  const latestReport = pastReports[0];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans">
      
      {/* 1. WELCOME SECTION */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-[22px] p-6 shadow-[0_4px_24px_rgba(37,99,235,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-[32px] font-bold text-slate-900 tracking-tight leading-snug">
            Namaste, Krrish 👋
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            Here is the most important task for your CEE preparation today.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('catalog')}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-[0_4px_16px_rgba(37,99,235,0.25)] cursor-pointer flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Start Today’s Practice</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('planner')}
            className="text-xs sm:text-sm font-bold text-[#2563EB] hover:text-blue-800 transition-colors cursor-pointer px-2 py-1"
          >
            View Study Plan
          </button>
        </div>
      </div>

      {/* 2. TODAY'S FOCUS & NEXT MOCK ROW (65% / 35% on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TODAY'S FOCUS (65% width) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white/95 border border-blue-200/80 backdrop-blur-2xl rounded-[22px] p-6 shadow-[0_6px_24px_rgba(37,99,235,0.06)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/80 text-[#2563EB] font-bold text-[11px] rounded-full border border-blue-200/60 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Recommended for you</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Revise Chemical Bonding
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              You lost 6 marks from this chapter in your latest mock.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-500">
              <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/60">20 questions</span>
              <span className="text-slate-300">•</span>
              <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/60">Around 25 minutes</span>
              <span className="text-slate-300">•</span>
              <span className="bg-blue-100/60 text-[#2563EB] px-2.5 py-1 rounded-lg border border-blue-200/60 font-bold">Chemistry</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-blue-100/80">
            <button
              onClick={() => onNavigate('catalog')}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-[0_4px_16px_rgba(37,99,235,0.25)] cursor-pointer"
            >
              Start Practice
            </button>
            <button
              onClick={() => onNavigate('formulas')}
              className="px-4 py-2.5 text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm bg-white/80 hover:bg-white rounded-xl border border-slate-200/80 transition-all cursor-pointer"
            >
              Choose Another Chapter
            </button>
          </div>
        </div>

        {/* NEXT MOCK (35% width) */}
        <div className="lg:col-span-4 bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[22px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Next Mock</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Scheduled Today
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{nextMock.title}</h3>

            <div className="space-y-1.5 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                <span>200 questions • 3 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>−0.25 negative marking rule</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onStartMock(nextMock as any)}
              className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(37,99,235,0.22)] cursor-pointer text-center"
            >
              Start Mock
            </button>
            <button
              onClick={() => onNavigate('policies')}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-1 transition-colors cursor-pointer"
            >
              View Instructions
            </button>
          </div>
        </div>

      </div>

      {/* 3. QUICK PROGRESS (3 Compact Cards in 1 Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Overall Readiness */}
        <div className="bg-white/90 border border-slate-200/80 backdrop-blur-xl p-5 rounded-[20px] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Overall Readiness</span>
            <span className="text-[#2563EB] font-mono">CEE 2026</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">68%</span>
            <span className="text-xs font-bold text-[#12A875] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Up 3% this week
            </span>
          </div>

          {/* Simple progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full transition-all duration-500" style={{ width: '68%' }} />
          </div>
        </div>

        {/* Latest Mock Score */}
        <div className="bg-white/90 border border-slate-200/80 backdrop-blur-xl p-5 rounded-[20px] shadow-2xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Latest Mock Score</span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">142/200</span>
            </div>

            <p className="text-xs text-slate-500 font-medium mt-1">
              12 marks higher than your previous mock
            </p>
          </div>

          <button
            onClick={() => {
              if (latestReport) onViewReport(latestReport);
              else onNavigate('reports');
            }}
            className="text-xs font-bold text-[#2563EB] hover:underline self-start pt-1 cursor-pointer"
          >
            Review Results →
          </button>
        </div>

        {/* Study Streak */}
        <div className="bg-white/90 border border-slate-200/80 backdrop-blur-xl p-5 rounded-[20px] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Current Study Streak</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">6 days</span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Personal best: 12 days
          </p>
        </div>

      </div>

      {/* 4. SUBJECT PROGRESS & TODAY'S PLAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SUBJECT PROGRESS */}
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[22px] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Subject Progress</h3>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
            >
              View Full Progress
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Biology */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="font-bold text-slate-800">Biology</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#12A875] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    On Track
                  </span>
                  <span className="font-bold font-mono text-slate-900">72%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#12A875] h-full rounded-full" style={{ width: '72%' }} />
              </div>
            </div>

            {/* Physics */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="font-bold text-slate-800">Physics</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                    Improving
                  </span>
                  <span className="font-bold font-mono text-slate-900">64%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '64%' }} />
              </div>
            </div>

            {/* Chemistry */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="font-bold text-slate-800">Chemistry</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#E99A15] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                    Needs Attention
                  </span>
                  <span className="font-bold font-mono text-slate-900">58%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#E99A15] h-full rounded-full" style={{ width: '58%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* TODAY'S STUDY PLAN */}
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[22px] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Today’s Plan</h3>
            <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {completedCount} of {studyPlanItems.length} completed
            </span>
          </div>

          <div className="space-y-2.5">
            {studyPlanItems.map((item) => (
              <div
                key={item.id}
                onClick={() => togglePlanItem(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  item.completed
                    ? 'bg-slate-50/80 border-slate-200/60 text-slate-400'
                    : 'bg-white border-slate-200/80 text-slate-900 font-medium hover:border-blue-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
                  />
                  <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-800 font-semibold'}>
                    {item.title}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">{item.duration}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. CEE COUNTDOWN ROW */}
      <div className="bg-slate-50/90 border border-slate-200/80 backdrop-blur-md rounded-[18px] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-[#2563EB] rounded-xl">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900">CEE 2026 Exam</div>
            <div className="text-slate-500 font-medium">15 September 2026</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm sm:text-base font-bold font-mono text-[#2563EB]">46 days remaining</span>
          </div>
          <div className="hidden sm:block w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: '70%' }} />
          </div>
        </div>
      </div>

      {/* 6. RECENT ACTIVITY (Collapsible or bottom section) */}
      <div className="bg-white/80 border border-slate-200/80 rounded-[22px] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRecentActivity(!showRecentActivity)}
            className="flex items-center gap-2 font-bold text-slate-800 text-sm hover:text-[#2563EB] transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Recent Activity</span>
            {showRecentActivity ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
          >
            View All Activity
          </button>
        </div>

        {showRecentActivity && (
          <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700 pt-1">
            <div className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#12A875]" />
                <span>Completed Biology Revision</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">2 hours ago</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Scored 142/200 in Mock #3</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">Yesterday</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Saved 5 Physics questions</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">2 days ago</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
