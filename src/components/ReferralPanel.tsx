import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { CheckCircle2, Copy, Link2, RefreshCw, Wallet } from 'lucide-react';
import type { ReferralCommission, ReferralTotals, StaffReferralBundle, UserProfile } from '../types';
import { REFERRAL_COMMISSION_RATE } from '../types';
import { BOOTSTRAP_ADMIN_EMAIL } from '../lib/clerkUserMapper';
import {
  buildReferralUrl,
  fetchMyReferrals,
  fetchReferralAdminOverview,
  settleReferralCommission,
} from '../lib/referralApi';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';
interface ReferralPanelProps {
  userProfile: UserProfile;
}

function TotalsStrip({ totals }: { totals: ReferralTotals }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: 'Conversions', value: String(totals.conversionCount) },
        { label: 'Gross paid', value: `Rs. ${totals.totalConversionNpr}` },
        { label: 'Commission', value: `Rs. ${totals.totalCommissionNpr}` },
        { label: 'Pending payout', value: `Rs. ${totals.pendingCommissionNpr}` },
      ].map((item) => (
        <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
          <div className="mt-1 text-lg font-black text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function CommissionTable({
  rows,
  showSettle,
  onSettle,
  settlingId,
}: {
  rows: ReferralCommission[];
  showSettle?: boolean;
  onSettle?: (id: string) => void;
  settlingId?: string | null;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500 py-6 text-center">No paid conversions yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 font-bold">Claim</th>
            <th className="px-3 py-2 font-bold">Referred</th>
            <th className="px-3 py-2 font-bold">Paid</th>
            <th className="px-3 py-2 font-bold">Commission</th>
            <th className="px-3 py-2 font-bold">Status</th>
            <th className="px-3 py-2 font-bold">When</th>
            {showSettle ? <th className="px-3 py-2 font-bold">Action</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="px-3 py-2 font-mono text-xs text-slate-600">{row.claimId}</td>
              <td className="px-3 py-2 font-mono text-xs text-slate-600 truncate max-w-[140px]">
                {row.referredClerkId}
              </td>
              <td className="px-3 py-2 font-bold">Rs. {row.conversionAmountNpr}</td>
              <td className="px-3 py-2 font-bold text-emerald-700">Rs. {row.commissionAmountNpr}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    row.status === 'settled'
                      ? 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800'
                      : 'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800'
                  }
                >
                  {row.status}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {new Date(row.createdAt).toLocaleString()}
              </td>
              {showSettle ? (
                <td className="px-3 py-2">
                  {row.status === 'pending' ? (
                    <button
                      type="button"
                      disabled={settlingId === row.id}
                      onClick={() => onSettle?.(row.id)}
                      className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-50"
                    >
                      {settlingId === row.id ? 'Saving…' : 'Mark settled'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">—</span>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const ReferralPanel: React.FC<ReferralPanelProps> = ({ userProfile }) => {
  const { getToken } = useAuth();
  const feedback = useFeedback();
  const isAdmin =
    userProfile.role === 'Admin' || userProfile.email === BOOTSTRAP_ADMIN_EMAIL;

  const [mine, setMine] = useState<StaffReferralBundle | null>(null);
  const [overview, setOverview] = useState<{
    totals: ReferralTotals;
    byReferrer: StaffReferralBundle[];
    commissions: ReferralCommission[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const my = await fetchMyReferrals(getToken);
      setMine(my);
      if (isAdmin) {
        const admin = await fetchReferralAdminOverview(getToken);
        setOverview({
          totals: admin.totals,
          byReferrer: admin.byReferrer,
          commissions: admin.commissions,
        });
      } else {
        setOverview(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, [getToken, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const linkUrl = mine ? buildReferralUrl(mine.link.code) : '';

  const copyLink = async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      feedback.toast({ message: 'Referral link copied', variant: 'success' });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      feedback.toast({ message: 'Could not copy link', variant: 'error' });
    }
  };

  const onSettle = async (id: string) => {
    setSettlingId(id);
    try {
      await settleReferralCommission(getToken, id);
      feedback.toast({ message: 'Commission marked settled', variant: 'success' });
      await load();
    } catch (err: any) {
      feedback.toast({ message: err?.message || 'Settle failed', variant: 'error' });
    } finally {
      setSettlingId(null);
    }
  };

  if (loading && !mine) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading referral data…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <AppIcon icon={Link2} size="card" className="text-rose-600" />
            My referral link
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Earn {Math.round(REFERRAL_COMMISSION_RATE * 100)}% of each approved paid conversion from
            students who sign up with your link.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <AppIcon icon={RefreshCw} size="btn" />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {mine ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Code · {mine.link.code}
              </div>
              <div className="font-mono text-sm text-slate-800 truncate mt-1">{linkUrl}</div>
            </div>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"
            >
              {copied ? <AppIcon icon={CheckCircle2} size="btn" /> : <AppIcon icon={Copy} size="btn" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>

          <TotalsStrip totals={mine.totals} />
          <div>
            <h4 className="text-sm font-black text-slate-800 mb-2">My conversions</h4>
            <CommissionTable rows={mine.commissions} />
          </div>
        </>
      ) : null}

      {isAdmin && overview ? (
        <div className="space-y-4 border-t border-slate-200 pt-8">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <AppIcon icon={Wallet} size="card" className="text-rose-600" />
              All referrals (Admin)
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Every staff link, paid conversion, and settlement status.
            </p>
          </div>
          <TotalsStrip totals={overview.totals} />

          <div className="space-y-3">
            {overview.byReferrer.map((bundle) => (
              <div
                key={bundle.link.ownerClerkId}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-slate-900">{bundle.link.ownerName}</div>
                    <div className="text-xs text-slate-500">
                      {bundle.link.ownerEmail} · {bundle.link.ownerRole} · code{' '}
                      <span className="font-mono">{bundle.link.code}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold text-slate-600">
                    Pending Rs. {bundle.totals.pendingCommissionNpr} · Total Rs.{' '}
                    {bundle.totals.totalCommissionNpr}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-sm font-black text-slate-800 mb-2">All commissions</h4>
            <CommissionTable
              rows={overview.commissions}
              showSettle
              onSettle={(id) => void onSettle(id)}
              settlingId={settlingId}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
