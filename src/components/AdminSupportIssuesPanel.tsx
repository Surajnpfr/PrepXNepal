import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Bug, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  fetchSupportIssues,
  resolveSupportIssue,
  type SupportIssue,
  type SupportIssueCategory,
} from '../lib/supportIssuesApi';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';

const CATEGORY_LABEL: Record<SupportIssueCategory, string> = {
  technical: 'App / Timer',
  content: 'Question Content',
  payment: 'Payment Claim',
  coins: 'Study Coins',
  feedback: 'Feedback',
};

type StatusFilter = 'open' | 'resolved' | 'all';

const fieldClass =
  'w-full min-h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20';

export const AdminSupportIssuesPanel: React.FC = () => {
  const { getToken } = useAuth();
  const feedback = useFeedback();
  const [issues, setIssues] = useState<SupportIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SupportIssueCategory>('all');
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupportIssues(getToken);
      setIssues(data.issues);
      setSyncedAt(data.syncedAt);
    } catch (err: any) {
      setError(err?.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCount = issues.filter((i) => i.status === 'open').length;
  const feedbackOpen = issues.filter(
    (i) => i.status === 'open' && i.category === 'feedback'
  ).length;

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
      return true;
    });
  }, [issues, statusFilter, categoryFilter]);

  const onResolve = async (id: string) => {
    const issue = issues.find((i) => i.id === id);
    const ok = await feedback.confirm({
      variant: 'warning',
      title: 'Mark as resolved?',
      message: issue
        ? `Resolve “${CATEGORY_LABEL[issue.category]}” from ${issue.userName}?`
        : 'Mark this ticket as resolved?',
      confirmLabel: 'Mark resolved',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;

    setResolvingId(id);
    try {
      const updated = await resolveSupportIssue(getToken, id, notesById[id]?.trim() || undefined);
      setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setNotesById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      feedback.toast({ message: 'Issue marked resolved', variant: 'success' });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Resolve failed',
        message: err?.message || 'Could not resolve issue',
      });
    } finally {
      setResolvingId(null);
    }
  };

  const filterChip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
    }`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2">
          <AppIcon icon={Bug} size="btn" className="text-blue-600" />
          <span>Support Issues Queue</span>
          {openCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {openCount} open
            </span>
          )}
          {feedbackOpen > 0 && (
            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {feedbackOpen} feedback
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {syncedAt && (
            <span className="text-[10px] text-slate-500 font-mono">
              Synced {new Date(syncedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <AppIcon icon={RefreshCw} size="btn" className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </h3>

      <div className="flex flex-wrap gap-2">
        {([
          ['open', 'Open'],
          ['resolved', 'Resolved'],
          ['all', 'All'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={filterChip(statusFilter === id)}
            onClick={() => setStatusFilter(id)}
          >
            {label}
          </button>
        ))}
        <span className="w-px bg-slate-200 self-stretch mx-1 hidden sm:block" />
        {(
          [
            ['all', 'All types'],
            ['technical', 'App'],
            ['content', 'Content'],
            ['payment', 'Payment'],
            ['coins', 'Coins'],
            ['feedback', 'Feedback'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={filterChip(categoryFilter === id)}
            onClick={() => setCategoryFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {filtered.length === 0 && !loading ? (
        <p className="text-xs text-slate-500 text-center py-8">
          No tickets match this filter.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 rounded-xl border text-xs space-y-3 ${
                issue.status === 'open'
                  ? issue.category === 'feedback'
                    ? 'border-blue-200 bg-blue-50/40'
                    : 'border-amber-200 bg-amber-50/40'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 font-bold text-slate-900">
                  <span className="uppercase tracking-wide text-[10px] text-slate-500">
                    {CATEGORY_LABEL[issue.category]}
                  </span>
                  <span>{issue.userName}</span>
                  <span className="font-mono font-medium text-slate-500">{issue.userEmail}</span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    issue.status === 'open'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {issue.status}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{issue.body}</p>
              {issue.staffNotes ? (
                <p className="text-[11px] text-slate-600 bg-white/70 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="font-bold text-slate-800">Staff notes: </span>
                  {issue.staffNotes}
                </p>
              ) : null}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-[10px] text-slate-500 font-mono">
                <span>{new Date(issue.createdAt).toLocaleString()}</span>
                {issue.status === 'open' ? (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-end">
                    <label className="flex-1 space-y-1 min-w-[180px]">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Staff notes (optional)
                      </span>
                      <input
                        type="text"
                        value={notesById[issue.id] || ''}
                        onChange={(e) =>
                          setNotesById((prev) => ({ ...prev, [issue.id]: e.target.value }))
                        }
                        placeholder="What did you fix or reply?"
                        className={fieldClass}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={resolvingId === issue.id}
                      onClick={() => void onResolve(issue.id)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2.5 min-h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl cursor-pointer shrink-0"
                    >
                      <AppIcon icon={CheckCircle2} size="btn" />
                      {resolvingId === issue.id ? 'Saving…' : 'Mark resolved'}
                    </button>
                  </div>
                ) : (
                  <span>
                    Resolved by {issue.resolvedBy || 'staff'}
                    {issue.resolvedAt ? ` · ${new Date(issue.resolvedAt).toLocaleString()}` : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
