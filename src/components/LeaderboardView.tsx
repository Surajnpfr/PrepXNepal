import React, { useEffect, useState } from 'react';
import { Download, Trophy } from 'lucide-react';
import { UserProfile } from '../types';
import { isStaffRole } from '../lib/clerkUserMapper';
import {
  downloadWeeklyLeaderboardCsv,
  downloadWeeklyLeaderboardPdfFile,
  fetchWeeklyLeaderboard,
  type WeeklyLeaderboardResponse,
  type WeeklyLeaderboardRow,
} from '../lib/leaderboardApi';
import { formatWindowLabel } from '../lib/weeklyMock';
import { AppIcon } from './ui';
import { useFeedback } from './FeedbackProvider';

interface LeaderboardViewProps {
  userProfile: UserProfile;
  getToken: () => Promise<string | null>;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  userProfile,
  getToken,
}) => {
  const feedback = useFeedback();
  const [weekly, setWeekly] = useState<WeeklyLeaderboardResponse | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const canExport = isStaffRole(userProfile);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setWeeklyLoading(true);
      setWeeklyError(null);
      try {
        const data = await fetchWeeklyLeaderboard(getToken);
        if (!cancelled) setWeekly(data);
      } catch (err: any) {
        if (!cancelled) setWeeklyError(err?.message || 'Failed to load weekly leaderboard');
      } finally {
        if (!cancelled) setWeeklyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const weeklyRows: WeeklyLeaderboardRow[] = weekly?.rows || [];

  const Avatar: React.FC<{ name: string; avatar: string; size: 'sm' | 'lg' }> = ({
    name,
    avatar,
    size,
  }) => {
    const dim = size === 'lg' ? 'w-12 h-12 text-sm' : 'w-8 h-8 text-xs';
    if (avatar) {
      return (
        <img
          src={avatar}
          alt=""
          className={`${dim} rounded-full object-cover shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${dim} rounded-full bg-[var(--px-primary-light)] text-[var(--px-primary)] font-bold flex items-center justify-center shrink-0`}
        aria-hidden
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const statusLabel =
    weekly?.status === 'open'
      ? 'Open now'
      : weekly?.status === 'upcoming'
        ? 'Upcoming'
        : weekly?.status === 'closed'
          ? 'Closed — results'
          : 'No weekly mock';

  return (
    <div className="px-page space-y-6 select-none">
      <div className="border-b border-[var(--px-border)] pb-4">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--px-heading)] tracking-tight flex flex-wrap items-center gap-2">
          <AppIcon icon={Trophy} size="lg" className="text-[var(--px-heading)]" />
          <span>Nepal CEE Aspirants Leaderboard</span>
        </h1>
        <p className="text-xs text-[var(--px-muted)] mt-1">
          Ranked from this week’s open mock only (one timed attempt per student).
        </p>
        {weekly?.mock ? (
          <p className="text-xs text-[var(--px-heading)] mt-2 font-semibold">
            {weekly.mock.title} · {statusLabel}
            <span className="block text-[var(--px-muted)] font-medium mt-0.5">
              {formatWindowLabel(weekly.mock.opensAt, weekly.mock.closesAt)}
            </span>
          </p>
        ) : null}
        {canExport && weekly?.mock ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={exportBusy}
              onClick={() => {
                void (async () => {
                  setExportBusy(true);
                  try {
                    await downloadWeeklyLeaderboardCsv(getToken);
                    feedback.toast({
                      variant: 'success',
                      message: 'Downloaded weekly student ranks CSV (includes email).',
                    });
                  } catch (err: any) {
                    await feedback.alert({
                      variant: 'error',
                      title: 'CSV export failed',
                      message: err?.message || 'Could not export CSV',
                    });
                  } finally {
                    setExportBusy(false);
                  }
                })();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--px-primary)] hover:underline cursor-pointer disabled:opacity-50"
            >
              <AppIcon icon={Download} size="btn" />
              {exportBusy ? 'Exporting…' : 'Export CSV'}
            </button>
            <button
              type="button"
              disabled={exportBusy}
              onClick={() => {
                void (async () => {
                  setExportBusy(true);
                  try {
                    const file = await downloadWeeklyLeaderboardPdfFile(getToken);
                    feedback.toast({
                      variant: 'success',
                      message: `Downloaded ${file}`,
                    });
                  } catch (err: any) {
                    await feedback.alert({
                      variant: 'error',
                      title: 'PDF export failed',
                      message: err?.message || 'Could not export PDF',
                    });
                  } finally {
                    setExportBusy(false);
                  }
                })();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--px-primary)] hover:underline cursor-pointer disabled:opacity-50"
            >
              <AppIcon icon={Download} size="btn" />
              {exportBusy ? 'Exporting…' : 'Export PDF'}
            </button>
          </div>
        ) : null}
      </div>

      {weeklyLoading ? (
        <div className="px-surface p-8 text-center text-sm text-[var(--px-muted)] font-semibold">
          Loading this week’s leaderboard…
        </div>
      ) : weeklyError ? (
        <div className="px-surface p-8 text-center text-sm text-rose-600 font-semibold">
          {weeklyError}
        </div>
      ) : !weekly?.mock ? (
        <div className="px-surface p-8 text-center text-sm text-[var(--px-muted)] font-semibold">
          No weekly open mock is configured yet. Check back when admin publishes this week’s paper.
        </div>
      ) : weeklyRows.length === 0 ? (
        <div className="px-surface p-8 text-center text-sm text-[var(--px-muted)] font-semibold">
          {weekly.status === 'upcoming'
            ? 'This week’s mock has not opened yet.'
            : weekly.status === 'open'
              ? 'No attempts yet — be the first on the board.'
              : 'No attempts were recorded for this week’s mock.'}
          {weekly.youAttempted && weekly.yourScore != null ? (
            <p className="mt-2 text-[var(--px-heading)]">Your score: {weekly.yourScore} pts</p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weeklyRows.slice(0, 3).map((usr, i) => (
              <div
                key={`${usr.rank}-${usr.displayName}`}
                className={`p-5 rounded-[16px] border relative overflow-hidden shadow-[var(--px-shadow)] ${
                  i === 0
                    ? 'bg-gradient-to-b from-amber-50 to-white border-amber-300'
                    : 'bg-[var(--px-surface)] border-[var(--px-border)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={usr.displayName} avatar={usr.avatarUrl} size="lg" />
                    <span
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full font-mono text-[10px] font-black flex items-center justify-center text-white ${
                        i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'
                      }`}
                    >
                      #{usr.rank}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[var(--px-heading)] text-sm truncate">
                      {usr.displayName}
                      {usr.isYou ? ' (You)' : ''}
                    </h3>
                    <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-[var(--px-heading)]">
                      {usr.score}
                      <span className="ml-1 text-[10px] font-semibold text-[var(--px-muted)]">
                        pts
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-surface overflow-hidden">
            <div className="px-5 py-3 bg-[var(--px-surface-muted)] border-b border-[var(--px-border)] text-xs font-bold text-[var(--px-muted)] flex items-center justify-between gap-3">
              <span>Rank &amp; aspirant</span>
              <span className="tabular-nums">Score</span>
            </div>
            <div className="divide-y divide-[var(--px-border)] text-xs">
              {weeklyRows.map((usr) => (
                <div
                  key={`${usr.rank}-${usr.displayName}-${usr.completedAt}`}
                  className={`p-4 flex items-center gap-3 transition-colors ${
                    usr.isYou
                      ? 'bg-[var(--px-primary-light)]/50 font-bold border-l-4 border-[var(--px-primary)]'
                      : 'hover:bg-[var(--px-surface-muted)]'
                  }`}
                >
                  <span
                    className={`w-6 text-center font-mono font-black text-sm shrink-0 ${
                      usr.rank <= 3 ? 'text-amber-600' : 'text-[var(--px-muted)]'
                    }`}
                  >
                    #{usr.rank}
                  </span>
                  <Avatar name={usr.displayName} avatar={usr.avatarUrl} size="sm" />
                  <div className="font-bold text-[var(--px-heading)] flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="truncate">{usr.displayName}</span>
                    {usr.isYou && (
                      <span className="text-[9px] uppercase font-mono font-bold bg-[var(--px-primary)] text-white px-1.5 py-0.5 rounded shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-sm font-black tabular-nums text-[var(--px-heading)]">
                    {usr.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
