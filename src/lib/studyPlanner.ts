import type { AttemptReport, StudyPlanTask, UserProfile } from '../types';
import { COIN_REWARDS } from './coinRewards';

const TASKS_KEY = 'prepx_study_plan_tasks';
const META_KEY = 'prepx_study_plan_meta';
const DAILY_REWARD_COINS = COIN_REWARDS.DAILY_STUDY_PLAN;

export type StudyPlanMeta = {
  /** Dates (YYYY-MM-DD) that already paid the daily completion reward, keyed per userId. */
  rewardedByUser: Record<string, string[]>;
  /** Last consecutive streak count per user. */
  streakByUser: Record<string, number>;
  /** Last day the user completed the full plan. */
  lastCompletedDayByUser: Record<string, string>;
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function loadStudyPlanTasks(): StudyPlanTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StudyPlanTask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStudyPlanTasks(tasks: StudyPlanTask[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadStudyPlanMeta(): StudyPlanMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) {
      return { rewardedByUser: {}, streakByUser: {}, lastCompletedDayByUser: {} };
    }
    const parsed = JSON.parse(raw) as StudyPlanMeta;
    return {
      rewardedByUser: parsed.rewardedByUser || {},
      streakByUser: parsed.streakByUser || {},
      lastCompletedDayByUser: parsed.lastCompletedDayByUser || {},
    };
  } catch {
    return { rewardedByUser: {}, streakByUser: {}, lastCompletedDayByUser: {} };
  }
}

export function saveStudyPlanMeta(meta: StudyPlanMeta): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function averageChapterAccuracy(reports: AttemptReport[]): Map<string, { subject: string; chapter: string; accuracy: number; samples: number }> {
  const map = new Map<string, { subject: string; chapter: string; accuracy: number; samples: number; sum: number }>();
  reports.forEach((r) => {
    (r.chapterScores || []).forEach((c) => {
      const key = `${c.subject}::${c.chapter}`;
      const prev = map.get(key) || { subject: c.subject, chapter: c.chapter, accuracy: 0, samples: 0, sum: 0 };
      prev.sum += c.accuracy;
      prev.samples += 1;
      prev.accuracy = Math.round(prev.sum / prev.samples);
      map.set(key, prev);
    });
  });
  return new Map(
    [...map.entries()].map(([k, v]) => [k, { subject: v.subject, chapter: v.chapter, accuracy: v.accuracy, samples: v.samples }])
  );
}

/**
 * Build today's auto tasks from weak chapters + target gap.
 * Domain invariant: auto tasks are derived from scored reports, not hardcoded demos.
 */
export function buildAutoTasksForDay(input: {
  userId: string;
  dateKey: string;
  profile: UserProfile;
  reports: AttemptReport[];
}): StudyPlanTask[] {
  const { userId, dateKey, profile, reports } = input;
  const tasks: StudyPlanTask[] = [];
  const latest = reports[0];

  const chapterAvg = averageChapterAccuracy(reports.slice(0, 5));
  const weak = [...chapterAvg.values()]
    .filter((c) => c.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  if (weak.length > 0) {
    weak.forEach((w, idx) => {
      const mins = w.accuracy < 40 ? 35 : 25;
      tasks.push({
        id: uid(`auto-weak-${idx}`),
        userId,
        dateKey,
        subject: w.subject,
        title: `Revise ${w.chapter} (${w.accuracy}% avg — needs work)`,
        durationMin: mins,
        completed: false,
        highYield: w.accuracy < 50,
        source: 'auto',
        chapter: w.chapter,
        refReportId: latest?.id,
      });
    });
  } else if (latest?.recommendations?.length) {
    latest.recommendations.slice(0, 3).forEach((rec, idx) => {
      tasks.push({
        id: uid(`auto-rec-${idx}`),
        userId,
        dateKey,
        subject: rec.subject,
        title: rec.title || `Practice ${rec.chapter}`,
        durationMin: rec.estimatedMinutes || 20,
        completed: false,
        highYield: true,
        source: 'auto',
        chapter: rec.chapter,
        refReportId: latest.id,
      });
    });
  } else {
    tasks.push(
      {
        id: uid('auto-start-mock'),
        userId,
        dateKey,
        subject: 'CEE',
        title: 'Take your first timed CEE mock from the catalog',
        durationMin: 180,
        completed: false,
        highYield: true,
        source: 'auto',
      },
      {
        id: uid('auto-start-phy'),
        userId,
        dateKey,
        subject: 'Physics',
        title: 'Mechanics high-yield formula revision',
        durationMin: 25,
        completed: false,
        highYield: true,
        source: 'auto',
      },
      {
        id: uid('auto-start-chem'),
        userId,
        dateKey,
        subject: 'Chemistry',
        title: 'Physical Chemistry core concepts drill',
        durationMin: 25,
        completed: false,
        highYield: false,
        source: 'auto',
      },
      {
        id: uid('auto-start-bio'),
        userId,
        dateKey,
        subject: 'Botany',
        title: 'Plant physiology & genetics quick revision',
        durationMin: 20,
        completed: false,
        highYield: true,
        source: 'auto',
      }
    );
  }

  const targetGap = latest
    ? Math.max(0, (latest.targetScore || profile.targetScore) - latest.overallScore)
    : Math.max(0, profile.targetScore - (profile.lastMockScore || 0));

  if (targetGap > 0 && reports.length > 0) {
    tasks.push({
      id: uid('auto-target'),
      userId,
      dateKey,
      subject: 'CEE',
      title: `Close ${targetGap.toFixed(0)}-pt gap to target ${profile.targetScore} — practice mock or weak units`,
      durationMin: 45,
      completed: false,
      highYield: true,
      source: 'auto',
      refReportId: latest?.id,
    });
  }

  // Cap auto tasks so the day stays actionable
  return tasks.slice(0, 6);
}

/**
 * Ensure the user has a plan for `dateKey`. Regenerates auto tasks for a new day;
 * preserves today's custom tasks and completion on auto tasks with matching chapter titles when possible.
 */
export function ensureDayPlan(input: {
  allTasks: StudyPlanTask[];
  userId: string;
  dateKey: string;
  profile: UserProfile;
  reports: AttemptReport[];
}): StudyPlanTask[] {
  const { allTasks, userId, dateKey, profile, reports } = input;
  const others = allTasks.filter((t) => !(t.userId === userId && t.dateKey === dateKey));
  const todayExisting = allTasks.filter((t) => t.userId === userId && t.dateKey === dateKey);

  if (todayExisting.length > 0) {
    // Refresh auto tasks when new report arrives and today still only has starter autos with no report refs
    const hasReportBacked = todayExisting.some((t) => t.source === 'auto' && t.refReportId);
    const latestId = reports[0]?.id;
    if (latestId && !hasReportBacked && reports.length > 0) {
      const customs = todayExisting.filter((t) => t.source === 'custom');
      const autos = buildAutoTasksForDay({ userId, dateKey, profile, reports });
      return [...others, ...autos, ...customs];
    }
    return allTasks;
  }

  const autos = buildAutoTasksForDay({ userId, dateKey, profile, reports });
  return [...others, ...autos];
}

export function createCustomTask(input: {
  userId: string;
  dateKey: string;
  subject: string;
  title: string;
  durationMin?: number;
}): StudyPlanTask {
  return {
    id: uid('custom'),
    userId: input.userId,
    dateKey: input.dateKey,
    subject: input.subject,
    title: input.title.trim(),
    durationMin: input.durationMin ?? 20,
    completed: false,
    highYield: false,
    source: 'custom',
  };
}

export function daysUntilExam(examDate: string): number {
  const exam = new Date(examDate);
  if (Number.isNaN(exam.getTime())) return 0;
  const now = new Date();
  const diff = exam.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export { DAILY_REWARD_COINS };

/** After toggling, compute streak + whether to grant daily reward. */
export function applyCompletionReward(input: {
  meta: StudyPlanMeta;
  userId: string;
  dateKey: string;
  allDone: boolean;
}): { meta: StudyPlanMeta; grantCoins: number } {
  const { userId, dateKey, allDone } = input;
  const meta: StudyPlanMeta = {
    rewardedByUser: { ...input.meta.rewardedByUser },
    streakByUser: { ...input.meta.streakByUser },
    lastCompletedDayByUser: { ...input.meta.lastCompletedDayByUser },
  };

  if (!allDone) {
    return { meta, grantCoins: 0 };
  }

  const rewarded = new Set(meta.rewardedByUser[userId] || []);
  if (rewarded.has(dateKey)) {
    return { meta, grantCoins: 0 };
  }

  rewarded.add(dateKey);
  meta.rewardedByUser[userId] = [...rewarded].slice(-60);

  const prevDay = meta.lastCompletedDayByUser[userId];
  const yesterday = (() => {
    const d = new Date(`${dateKey}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return todayKey(d);
  })();

  const prevStreak = meta.streakByUser[userId] || 0;
  meta.streakByUser[userId] = prevDay === yesterday ? prevStreak + 1 : 1;
  meta.lastCompletedDayByUser[userId] = dateKey;

  return { meta, grantCoins: DAILY_REWARD_COINS };
}
