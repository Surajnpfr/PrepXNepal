import React, { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { UserProfile, AttemptReport } from '../types';
import { isStaffRole } from '../lib/clerkUserMapper';
import { AppIcon } from './ui';

interface LeaderboardViewProps {
  userProfile: UserProfile;
  pastReports: AttemptReport[];
  usersList: UserProfile[];
}

function displayUsername(name: string, email: string): string {
  const trimmed = (name || '').trim();
  if (trimmed && trimmed.toLowerCase() !== 'clerk user') return trimmed;
  if (email) return email.split('@')[0];
  return 'Aspirant';
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  userProfile,
  pastReports,
  usersList,
}) => {
  const [activeTab, setActiveTab] = useState<'cee_rank' | 'coins'>('cee_rank');

  const latestReport = pastReports[0] || null;

  const sortedRankers = useMemo(() => {
    const roster = usersList.length > 0 ? usersList : userProfile.clerkId ? [userProfile] : [];

    const rows = roster
      .filter((u) => u.isClerkLive && u.email)
      // Public roster: exclude internal operator accounts from ranking display.
      .filter((u) => !isStaffRole(u))
      .map((u) => {
        const isUser = u.clerkId === userProfile.clerkId || u.email === userProfile.email;
        const score =
          isUser && latestReport
            ? latestReport.overallScore
            : typeof u.lastMockScore === 'number'
              ? u.lastMockScore
              : 0;
        return {
          id: u.id,
          username: displayUsername(u.name, u.email),
          score,
          coins: u.studyCoinBalance,
          avatar: u.avatarUrl || '',
          isUser,
        };
      });

    return [...rows]
      .sort((a, b) => (activeTab === 'cee_rank' ? b.score - a.score : b.coins - a.coins))
      .map((r, idx) => ({ ...r, rank: idx + 1 }));
  }, [activeTab, latestReport, userProfile, usersList]);

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

  return (
    <div className="px-page space-y-6 select-none">
      <div className="border-b border-[var(--px-border)] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--px-heading)] tracking-tight flex flex-wrap items-center gap-2">
            <AppIcon icon={Trophy} size="lg" className="text-[var(--px-heading)]" />
            <span>Nepal CEE 2026 Aspirants Leaderboard</span>
          </h1>
          <p className="text-xs text-[var(--px-muted)] mt-1">
            Ranked by latest mock score or Study Coins — username, photo, and score.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[var(--px-surface-muted)] p-1 rounded-[12px] text-xs font-bold border border-[var(--px-border)] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('cee_rank')}
            className={`flex-1 sm:flex-none min-h-11 px-3 py-1.5 rounded-[10px] transition-all cursor-pointer ${
              activeTab === 'cee_rank'
                ? 'bg-[var(--px-surface)] text-[var(--px-heading)] shadow-[var(--px-shadow)]'
                : 'text-[var(--px-muted)]'
            }`}
          >
            CEE Rankers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coins')}
            className={`flex-1 sm:flex-none min-h-11 px-3 py-1.5 rounded-[10px] transition-all cursor-pointer ${
              activeTab === 'coins'
                ? 'bg-[var(--px-surface)] text-[var(--px-heading)] shadow-[var(--px-shadow)]'
                : 'text-[var(--px-muted)]'
            }`}
          >
            Coin Champions
          </button>
        </div>
      </div>

      {sortedRankers.length === 0 ? (
        <div className="px-surface p-8 text-center text-sm text-[var(--px-muted)] font-semibold">
          The leaderboard is empty. Complete a mock to take your place.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedRankers.slice(0, 3).map((usr, i) => (
              <div
                key={usr.id}
                className={`p-5 rounded-[16px] border relative overflow-hidden shadow-[var(--px-shadow)] ${
                  i === 0
                    ? 'bg-gradient-to-b from-amber-50 to-white border-amber-300'
                    : 'bg-[var(--px-surface)] border-[var(--px-border)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={usr.username} avatar={usr.avatar} size="lg" />
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
                      {usr.username}
                      {usr.isUser ? ' (You)' : ''}
                    </h3>
                    <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-[var(--px-heading)]">
                      {activeTab === 'cee_rank' ? (
                        <>
                          {usr.score}
                          <span className="ml-1 text-[10px] font-semibold text-[var(--px-muted)]">
                            pts
                          </span>
                        </>
                      ) : (
                        <>
                          {usr.coins}
                          <span className="ml-1 text-[10px] font-semibold text-[var(--px-muted)]">
                            coins
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-surface overflow-hidden">
            <div className="px-5 py-3 bg-[var(--px-surface-muted)] border-b border-[var(--px-border)] text-xs font-bold text-[var(--px-muted)] flex items-center justify-between gap-3">
              <span>Rank &amp; aspirant</span>
              <span className="tabular-nums">
                {activeTab === 'cee_rank' ? 'Score' : 'Coins'}
              </span>
            </div>

            <div className="divide-y divide-[var(--px-border)] text-xs">
              {sortedRankers.map((usr) => (
                <div
                  key={usr.id}
                  className={`p-4 flex items-center gap-3 transition-colors ${
                    usr.isUser
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

                  <Avatar name={usr.username} avatar={usr.avatar} size="sm" />

                  <div className="font-bold text-[var(--px-heading)] flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="truncate">{usr.username}</span>
                    {usr.isUser && (
                      <span className="text-[9px] uppercase font-mono font-bold bg-[var(--px-primary)] text-white px-1.5 py-0.5 rounded shrink-0">
                        You
                      </span>
                    )}
                  </div>

                  <span className="shrink-0 font-mono text-sm font-black tabular-nums text-[var(--px-heading)]">
                    {activeTab === 'cee_rank' ? usr.score : usr.coins}
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
