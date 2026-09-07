import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Calendar,
  ArrowRight,
  History,
  ChevronDown,
  ChevronUp,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, MockTest, AttemptReport, StudyPlanTask } from '../types';
import {
  OFFICIAL_MBBS_EXAM_DATE_ISO,
  OFFICIAL_MBBS_EXAM_LABEL,
  daysUntilExamDate,
  formatExamDateShort,
  resolveExamDate,
} from '../lib/examSchedule';
import {
  formatWindowLabel,
  resolveWeeklyMockFromList,
  weeklyWindowStatus,
} from '../lib/weeklyMock';
import { useFeedback } from './FeedbackProvider';
import { Badge, Button, Card, PageHeader, ProgressBar, AppIcon } from './ui';
import { DailyQuickPractice } from './DailyQuickPractice';

interface HomeViewProps {
  userProfile: UserProfile;
  onUpdateTargetScore: (newScore: number) => void;
  mockTests: MockTest[];
  pastReports: AttemptReport[];
  studyPlanTasks: StudyPlanTask[];
  onToggleStudyTask: (taskId: string) => void;
  onStartMock: (mock: MockTest) => void;
  onStudyMock: (mock: MockTest) => void;
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
  onStudyMock,
  onViewReport,
  onNavigate,
}) => {
  const feedback = useFeedback();
  const [showRecentActivity, setShowRecentActivity] = useState(true);

  const completedCount = studyPlanTasks.filter((i) => i.completed).length;

  const nextMock =
    mockTests.find((m) => !pastReports.some((r) => r.mockId === m.id)) || mockTests[0] || null;
  const latestReport = pastReports[0] || null;

  const weeklyMock = resolveWeeklyMockFromList(mockTests);
  const weeklyStatus = weeklyMock
    ? weeklyWindowStatus(weeklyMock.opensAt, weeklyMock.closesAt)
    : 'unscheduled';
  const weeklyAttempt = weeklyMock
    ? pastReports.find((r) => r.mockId === weeklyMock.id)
    : undefined;

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
        title: 'Take a full CEE mock',
        desc: 'Complete a timed mock to get subject and chapter scores for revision.',
        subject: 'Full paper',
        duration: '180 mins'
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

  const examDate = resolveExamDate(userProfile.examDate);
  const daysRemaining = daysUntilExamDate(examDate);

  const handleScoreUpdate = async () => {
    const target = await feedback.prompt({
      title: 'Target score',
      message: 'Set your target MEC score out of 200.',
      label: 'Target score',
      defaultValue: String(userProfile.targetScore),
      inputType: 'number',
      placeholder: '165',
      confirmLabel: 'Save target',
      validate: (value) => {
        const num = parseInt(value, 10);
        if (Number.isNaN(num) || num < 1 || num > 200) {
          return 'Enter a whole number between 1 and 200.';
        }
        return null;
      },
    });
    if (!target) return;
    onUpdateTargetScore(parseInt(target, 10));
    feedback.toast({ message: 'Target score updated.', variant: 'success' });
  };

  return (
    <div className="px-page space-y-6">
      
      <PageHeader
        title={userProfile.name ? `${userProfile.name.split(' ')[0]}’s dashboard` : 'Dashboard'}
        subtitle={
          latestReport
            ? `Latest mock: ${latestReport.overallScore}/200. Target ${userProfile.targetScore}/200.`
            : `Target ${userProfile.targetScore}/200 · ${daysRemaining} days until exam.`
        }
        actions={
          <>
            <Button type="button" onClick={() => onNavigate('catalog')}>
              <span>Open mock catalog</span>
              <AppIcon icon={ArrowRight} size="btn" />
            </Button>
            <Button type="button" variant="secondary" onClick={() => onNavigate('planner')}>
              Today’s plan
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--px-muted)]">
            <span>Average score</span>
            <span className="tabular-nums text-[11px]">/200</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold tabular-nums text-[var(--px-heading)]">{averageScore}</span>
            <span className="text-xs text-[var(--px-muted)]">{readinessPercentage}% of max</span>
          </div>
          <ProgressBar value={readinessPercentage} aria-label="Average score readiness" />
        </Card>

        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--px-muted)]">
            <span>Target score</span>
            <button 
              type="button"
              onClick={handleScoreUpdate}
              className="text-[11px] font-semibold text-[var(--px-primary)] hover:underline cursor-pointer"
            >
              Edit
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold tabular-nums text-[var(--px-heading)]">{userProfile.targetScore}</span>
            <span className="text-xs text-[var(--px-muted)]">
              Gap {latestReport ? Math.max(0, userProfile.targetScore - latestReport.overallScore) : userProfile.targetScore}
            </span>
          </div>
          <div className="text-[11px] text-[var(--px-muted)]">
            {userProfile.targetExam || 'Nepal CEE'}
          </div>
        </Card>

        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--px-muted)]">
            <span>Study coins</span>
            <AppIcon icon={Coins} size="btn" className="text-[var(--px-muted)]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-display font-bold text-[var(--px-heading)]">Coming soon</p>
            <p className="text-[11px] text-[var(--px-muted)] leading-snug">
              Rewards and redemptions launch with the new wallet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('coins')}
            className="text-xs font-semibold text-[var(--px-primary)] hover:underline self-start cursor-pointer"
          >
            Learn more
          </button>
        </Card>

        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--px-muted)]">
            <span>Days to exam</span>
            <AppIcon icon={Calendar} size="btn" className="text-[var(--px-muted)]" />
          </div>
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold tabular-nums text-[var(--px-heading)]">
                {daysRemaining}
              </span>
              <span className="text-xs text-[var(--px-muted)]">days</span>
            </div>
            <div className="text-[11px] text-[var(--px-muted)]">
              {examDate === OFFICIAL_MBBS_EXAM_DATE_ISO
                ? OFFICIAL_MBBS_EXAM_LABEL
                : formatExamDateShort(examDate)}
            </div>
          </>
        </Card>

      </div>

      {weeklyMock ? (
        <Card padding="lg" className="border-amber-200 bg-gradient-to-r from-amber-50/80 to-[var(--px-surface)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                This week’s open mock · {weeklyStatus}
              </p>
              <h2 className="font-display text-lg font-bold text-[var(--px-heading)] truncate">
                {weeklyMock.title}
              </h2>
              <p className="text-xs text-[var(--px-muted)]">
                {formatWindowLabel(weeklyMock.opensAt, weeklyMock.closesAt)}
              </p>
              <p className="text-xs text-[var(--px-body)]">
                One timed attempt · auto-submit at 00:00:00 · ranks on Leaderboard
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              {weeklyAttempt ? (
                <>
                  <p className="text-sm font-bold text-[var(--px-heading)] text-center sm:text-right">
                    Your score: {weeklyAttempt.overallScore} pts
                  </p>
                  <Button type="button" fullWidth onClick={() => onNavigate('leaderboard')}>
                    View weekly leaderboard
                  </Button>
                </>
              ) : weeklyStatus === 'open' ? (
                <Button type="button" fullWidth onClick={() => onStartMock(weeklyMock)}>
                  Start weekly mock
                </Button>
              ) : (
                <Button type="button" fullWidth onClick={() => onNavigate('leaderboard')}>
                  {weeklyStatus === 'upcoming' ? 'Opens soon — leaderboard' : 'View results'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      <DailyQuickPractice variant="dashboard" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        <Card padding="lg" className="lg:col-span-8 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--px-muted)]">Next revision focus</p>

            <h2 className="font-display text-lg font-bold text-[var(--px-heading)] tracking-tight">
              {recommendation.title}
            </h2>

            <p className="text-sm text-[var(--px-body)] leading-relaxed">
              {recommendation.desc}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge tone="neutral">{recommendation.duration}</Badge>
              <Badge tone="neutral">{recommendation.subject}</Badge>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--px-border)]">
            <Button
              type="button"
              onClick={() => onNavigate(latestReport ? 'formulas' : 'catalog')}
            >
              {latestReport ? 'Open formula library' : 'Browse mock catalog'}
            </Button>
          </div>
        </Card>

        <Card padding="lg" className="lg:col-span-4 flex flex-col justify-between gap-4">
          {nextMock ? (
            <>
              <div className="space-y-3">
                <p className="text-xs font-medium text-[var(--px-muted)]">Suggested mock</p>

                <h3 className="font-display text-base font-bold text-[var(--px-heading)] leading-snug">{nextMock.title}</h3>

                <div className="space-y-1 text-sm text-[var(--px-body)]">
                  <p>{nextMock.totalQuestions} questions · {Math.floor(nextMock.durationSec / 3600)} hours</p>
                  <p>−0.25 negative marking</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button type="button" fullWidth onClick={() => onStudyMock(nextMock)}>
                  Study this paper
                </Button>
                <Button type="button" fullWidth onClick={() => onStartMock(nextMock)}>
                  Give Mock test
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full space-y-3 py-6">
              <AppIcon icon={ShieldAlert} size="lg" className="text-[var(--px-muted)]" />
              <div className="text-xs font-bold text-[var(--px-heading)]">No mocks available</div>
              <p className="text-[10px] text-[var(--px-muted)]">
                New mock tests will appear here once they are published.
              </p>
            </div>
          )}
        </Card>

      </div>

      {/* 4. DYNAMIC SUBJECT PROGRESS & TODAY'S PLAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SUBJECT PROGRESS */}
        <div className="px-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--px-border)] pb-3">
            <h3 className="font-display font-bold text-[var(--px-heading)] text-sm sm:text-base">Subject Mastery Breakdown</h3>
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
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Today’s tasks</h3>
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
            <AppIcon icon={History} size="btn" className="text-slate-400" />
            <span>Recent mocks</span>
            {showRecentActivity ? <AppIcon icon={ChevronUp} size="btn" className="text-slate-400" /> : <AppIcon icon={ChevronDown} size="btn" className="text-slate-400" />}
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
                You haven&apos;t completed a mock yet. Open Mock Tests to start your first timed practice.
              </div>
            ) : (
              pastReports.slice(0, 5).map((rep) => (
                <div key={rep.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AppIcon icon={CheckCircle2} size="btn" className="text-blue-600" />
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
