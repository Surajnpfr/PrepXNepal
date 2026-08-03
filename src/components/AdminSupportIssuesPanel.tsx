import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Bug, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  fetchSupportIssues,
  resolveSupportIssue,
  type SupportIssue,
} from '../lib/supportIssuesApi';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';

const CATEGORY_LABEL: Record<SupportIssue['category'], string> = {
  technical: 'App / Timer',
  content: 'Question Content',
  payment: 'Payment Claim',
  coins: 'Study Coins',
};

export const AdminSupportIssuesPanel: React.FC = () => {
  const { getToken } = useAuth();
  const feedback = useFeedback();
  const [issues, setIssues] = useState<SupportIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

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

  const onResolve = async (id: string) => {
    try {
      const updated = await resolveSupportIssue(getToken, id);
      setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      feedback.toast({ message: 'Issue marked resolved', variant: 'success' });
    } catch (err: any) {
      await feedback.alert({
        variant: 'error',
        title: 'Resolve failed',
        message: err?.message || 'Could not resolve issue',
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <AppIcon icon={Bug} size="btn" className="text-rose-600" />
          <span>Support Issues Queue</span>
          {openCount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {openCount} open
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
            <AppIcon
              icon={RefreshCw}
              size="btn"
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>
      </h3>

      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {issues.length === 0 && !loading ? (
        <p className="text-xs text-slate-500 text-center py-8">No support issues yet.</p>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                issue.status === 'open'
                  ? 'border-amber-200 bg-amber-50/40'
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
              <p className="text-slate-700 leading-relaxed font-medium">{issue.body}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                <span>{new Date(issue.createdAt).toLocaleString()}</span>
                {issue.status === 'open' ? (
                  <button
                    type="button"
                    onClick={() => void onResolve(issue.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    <AppIcon icon={CheckCircle2} size="btn" />
                    Mark resolved
                  </button>
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
