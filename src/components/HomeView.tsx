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
  ChevronUp,
  Coins,
  ShieldAlert,
  Zap,
  Award
} from 'lucide-react';
import { UserProfile, MockTest, AttemptReport, StudyPlanTask } from '../types';

interface HomeViewProps {
  userProfile: UserProfile;
  onUpdateTargetScore: (newScore: number) => void;
  mockTests: MockTest[];
  pastReports: AttemptReport[];
  studyPlanTasks: StudyPlanTask[];
  onToggleStudyTask: (taskId: string) => void;
  onStartMock: (mock: MockTest) => void;
  onViewReport: (report: AttemptReport) => void;
  onNavigate: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userProfile,
  onUpdateTargetScore,
  mockTests,
  pastReports,
  studyPlanTasks,
  onToggleStudyTask,
  onStartMock,
  onViewReport,
  onNavigate,
}) => {
  const [showRecentActivity, setShowRecentActivity] = useState(true);

  const completedCount = studyPlanTasks.filter((i) => i.completed).length;

  const nextMock =
    mockTests.find((m) => !pastReports.some((r) => r.mockId === m.id)) || mockTests[0] || null;
  const latestReport = pastReports[0] || null;

  // Calculate overall readiness dynamically based on past mock reports
  const averageScore = pastReports.length > 0 
    ? Math.round(pastReports.reduce((sum, r) => sum + r.overallScore, 0) / pastReports.length) 
    : 0;
  const readinessPercentage = Math.round((averageScore / 200) * 100);

  // Dynamic recommendations parser
  const recommendation = latestReport && latestReport.recommendations && latestReport.recommendations[0]
    ? {
        title: `Revise ${latestReport.recommendations[0].chapter}`,
        desc: `You scored below average in this chapter in your recent mock. Review key formulas and definitions before your next test.`,
        subject: latestReport.recommendations[0].subject,
        duration: `${latestReport.recommendations[0].estimatedMinutes} mins`
      }
    : {
        title: "Take CEE Model Exam",
        desc: "Complete your first grand mock test in the catalog to generate personalized diagnostics and chapter insights.",
        subject: "General",
        duration: "180 mins"
      };

  // Dynamic Subject Progress Calculation (CEE subjects from scored reports)
  const subjectStats: Record<string, { scored: number; total: number; percent: number }> = {
    Physics: { scored: 0, total: 0, percent: 0 },
    Chemistry: { scored: 0, total: 0, percent: 0 },
    Zoology: { scored: 0, total: 0, percent: 0 },
    Botany: { scored: 0, total: 0, percent: 0 },
    MAT: { scored: 0, total: 0, percent: 0 },
  };

  pastReports.forEach((r) => {
    if (r.subjectScores) {
      r.subjectScores.forEach((s) => {
        const name = s.subject as keyof typeof subjectStats;
        if (subjectStats[name]) {
          subjectStats[name].scored += s.score;
          subjectStats[name].total += s.total;
        }
      });
    }
  });

  Object.keys(subjectStats).forEach((key) => {
    const s = subjectStats[key];
    s.percent =
      s.total > 0
        ? Math.round((s.scored / Math.max(s.total, 1)) * 100)
        : 0;
    // Prefer accuracy-weighted percent when totals are question counts and score is marks
    const matching = pastReports.flatMap((r) => r.subjectScores || []).filter((x) => x.subject === key);
    if (matching.length > 0) {
      s.percent = Math.round(matching.reduce((a, x) => a + x.accuracy, 0) / matching.length);
    }
  });

  const getStatusDetails = (percent: number) => {
    if (percent === 0) return { label: 'Not Attempted', badge: 'bg-slate-100 text-slate-600 border-slate-200', bar: 'bg-slate-300' };
    if (percent >= 70) return { label: 'On Track', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-600' };
    if (percent >= 50) return { label: 'Improving', badge: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-600' };
    return { label: 'Needs Attention', badge: 'bg-amber-50 text-amber-800 border-amber-200', bar: 'bg-amber-600' };
  };

  // Dynamic Countdown calculation
  const examDateStr = userProfile.examDate || '2026-09-15';
  const getDaysRemaining = () => {
    const examDate = new Date(examDateStr);
    const now = new Date();
    const diffTime = examDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };
  const daysRemaining = getDaysRemaining();

  const handleScoreUpdate = () => {
    const target = prompt("Enter your target MEC score (out of 200):", userProfile.targetScore.toString());
    if (target) {
      const num = parseInt(target, 10);
      if (!isNaN(num) && num > 0 && num <= 200) {
        onUpdateTargetScore(num);
      } else {
        alert("Please enter a valid number between 1 and 200.");
      }
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-8 select-none">
      
      {/* 1. CLEAN MEDICAL HERO BANNER (NO BLUR BLOBS) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-mono font-semibold rounded-md border border-blue-500/30">
            <span>Nepal CEE Preparation Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            Namaste{userProfile.name ? `, ${userProfile.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            Welcome to your preparation cockpit. Practice full-length model mocks, analyze chapter-level score gaps, and track your national percentile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('catalog')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <span>Start Practice Mocks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('planner')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer border border-slate-700"
          >
            Daily Schedule
          </button>
        </div>
      </div>

      {/* 2. STATS & PERFORMANCE METRIC GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Readiness Gauge */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Score Readiness</span>
            <span className="text-blue-700 font-mono text-[11px] font-bold">Nepal CEE</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{readinessPercentage}%</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Avg: {averageScore}/200
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${readinessPercentage}%` }} />
          </div>
        </div>

        {/* Target Score & Gap */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Target Goal Score</span>
              <button 
                onClick={handleScoreUpdate}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold font-mono text-slate-900">{userProfile.targetScore}</span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                Gap: {latestReport ? Math.max(0, userProfile.targetScore - latestReport.overallScore) : userProfile.targetScore} pts
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Exam: {userProfile.targetExam || 'Nepal CEE'}
          </div>
        </div>

        {/* Study Coins Balance */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Study Coins Balance</span>
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold font-mono text-slate-900">{userProfile.studyCoinBalance}</span>
              <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-bold">
                Coins
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('coins')}
            className="text-xs font-bold text-amber-700 hover:underline self-start cursor-pointer"
          >
            Redeem Rewards →
          </button>
        </div>

        {/* Countdown */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>CEE 2026 Countdown</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold font-mono text-blue-700">{daysRemaining}</span>
              <span className="text-xs font-semibold text-slate-500 font-mono">days left</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Target Date:{' '}
            {userProfile.examDate
              ? new Date(userProfile.examDate).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Not set'}
          </div>
        </div>

      </div>

      {/* 3. TODAY'S FOCUS & NEXT MOCK ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TODAY'S FOCUS */}
        <div className="lg:col-span-8 bg-blue-50/60 border border-blue-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-md border border-blue-200 uppercase tracking-wider font-mono">
              <span>Recommended Revision</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {recommendation.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {recommendation.desc}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-slate-600">
              <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200 font-semibold">{recommendation.duration}</span>
              <span className="text-slate-300">•</span>
              <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md font-bold">{recommendation.subject}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-blue-200/60">
            <button
              onClick={() => onNavigate(latestReport ? 'formulas' : 'catalog')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {latestReport ? 'Open Revision Sheet' : 'Browse Exam Catalog'}
            </button>
          </div>
        </div>

        {/* NEXT MOCK */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          {nextMock ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Target Grand Mock</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    Available
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{nextMock.title}</h3>

                <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>{nextMock.totalQuestions} questions • {Math.floor(nextMock.durationSec / 3600)} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>−0.25 CEE marking rule</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onStartMock(nextMock)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer text-center shadow-xs"
                >
                  Start Mock Attempt
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full space-y-3 py-6">
              <ShieldAlert className="w-8 h-8 text-slate-400" />
              <div className="text-xs font-bold text-slate-700">No Mocks Published</div>
              <p className="text-[10px] text-slate-500">Administrators have not uploaded mock papers yet.</p>
            </div>
          )}
        </div>

      </div>

      {/* 4. DYNAMIC SUBJECT PROGRESS & TODAY'S PLAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SUBJECT PROGRESS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Subject Mastery Breakdown</h3>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              View Full Analytics
            </button>
          </div>

          <div className="space-y-3.5">
            {Object.keys(subjectStats).map((subjKey) => {
              const stats = subjectStats[subjKey as keyof typeof subjectStats];
              const details = getStatusDetails(stats.percent);
              return (
                <div key={subjKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="font-bold text-slate-800">{subjKey}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${details.badge}`}>
                        {details.label}
                      </span>
                      <span className="font-bold font-mono text-slate-900">{stats.percent}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${details.bar} h-full rounded-full transition-all duration-500`} style={{ width: `${stats.percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TODAY'S STUDY PLAN */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Today’s Target Checklist</h3>
            <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {completedCount} of {studyPlanTasks.length} completed
            </span>
          </div>

          <div className="space-y-2.5">
            {studyPlanTasks.length === 0 ? (
              <p className="text-xs text-slate-500 font-semibold py-2">
                Open Study Planner to generate today’s targets from your mock analytics.
              </p>
            ) : (
              studyPlanTasks.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onToggleStudyTask(item.id)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between text-xs ${
                    item.completed
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 text-slate-900 font-medium hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 cursor-pointer shrink-0"
                    />
                    <span className={`truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-800 font-semibold'}`}>
                      {item.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 shrink-0 ml-2">{item.durationMin}m</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 5. RECENT ACTIVITY LOG */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRecentActivity(!showRecentActivity)}
            className="flex items-center gap-2 font-bold text-slate-800 text-sm hover:text-blue-600 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Recent Test Activity History</span>
            {showRecentActivity ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            View All Reports
          </button>
        </div>

        {showRecentActivity && (
          <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700 pt-1">
            {pastReports.length === 0 ? (
              <div className="py-4 text-slate-400 text-center font-medium">
                You haven't attempted any mock tests yet. Take a mock test from the catalog!
              </div>
            ) : (
              pastReports.slice(0, 5).map((rep) => (
                <div key={rep.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Scored {rep.overallScore}/{rep.maxScore} in {rep.mockTitle} (Accuracy: {rep.accuracyPercentage}%)</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{rep.completedAt}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};
