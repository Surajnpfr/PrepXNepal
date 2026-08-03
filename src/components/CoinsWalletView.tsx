import React, { useMemo, useState } from 'react';
import {
  Coins,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { UserProfile, CoinTransaction } from '../types';
import { EARNING_RULES, REDEEMABLE_CATALOG } from '../lib/coinRewards';
import { AppIcon, PageHeader } from './ui';

interface CoinsWalletViewProps {
  userProfile: UserProfile;
  transactions: CoinTransaction[];
  onRedeemCoins: (itemId: string) => void;
}

export const CoinsWalletView: React.FC<CoinsWalletViewProps> = ({
  userProfile,
  transactions,
  onRedeemCoins,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'ledger' | 'rules'>('catalog');

  const unlockedTitles = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.delta < 0 && tx.reason.startsWith('Redeemed:')) {
        set.add(tx.reason.replace(/^Redeemed:\s*/, ''));
      }
      if (tx.refType === 'redemption' && tx.refId) {
        set.add(tx.refId);
      }
    });
    return set;
  }, [transactions]);

  const redeemableItems = REDEEMABLE_CATALOG.map((item) => ({
    ...item,
    unlocked: unlockedTitles.has(item.title) || unlockedTitles.has(item.id),
  }));

  const balanceLabel = userProfile.studyCoinBalance.toLocaleString('en-NP');

  return (
    <div className="px-page space-y-6 font-sans">
      <PageHeader
        title="Study Coins"
        subtitle="Earn coins by finishing mocks and today’s study plan. Redeem for practice packs and extra mock quota."
      />

      <div className="px-surface p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-[var(--px-muted)]">Available balance</p>
            <div className="flex items-baseline gap-2 min-w-0">
              <AppIcon icon={Coins} size="card" className="text-[var(--px-muted)] self-center" />
              <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-[var(--px-heading)]">
                {balanceLabel}
              </span>
              <span className="text-sm font-semibold text-[var(--px-muted)]">coins</span>
            </div>
          </div>

          <ul className="text-xs text-[var(--px-muted)] space-y-1 sm:text-right shrink-0">
            <li>Not withdrawable or transferable</li>
            <li>Ledger follows your account activity</li>
            <li>Unlocks stay after redemption</li>
          </ul>
        </div>
      </div>

      <div className="scroll-x-safe flex items-center gap-1 border-b border-[var(--px-border)] pb-0 font-semibold text-xs -mx-1 px-1">
        {(
          [
            { id: 'catalog' as const, label: 'Redemption Catalog' },
            { id: 'ledger' as const, label: `Transaction Ledger (${transactions.length})` },
            { id: 'rules' as const, label: 'Earning Rules' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2.5 min-h-11 rounded-t-[10px] transition-colors cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === tab.id
                ? 'border-[var(--px-primary)] text-[var(--px-primary)] bg-[var(--px-primary-light)]/40'
                : 'border-transparent text-[var(--px-muted)] hover:text-[var(--px-heading)] hover:bg-[var(--px-surface-muted)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {redeemableItems.map((item) => {
            const canAfford = userProfile.studyCoinBalance >= item.coinCost;

            return (
              <div
                key={item.id}
                className="px-surface p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--px-muted)]">
                      {item.category}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-sm tabular-nums text-[var(--px-heading)]">
                      <AppIcon icon={Coins} size="btn" className="text-[var(--px-muted)]" />
                      {item.coinCost}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-[var(--px-heading)] text-base">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--px-muted)] leading-relaxed">{item.description}</p>
                </div>

                {item.unlocked ? (
                  <div className="w-full py-2.5 font-semibold text-xs rounded-[12px] bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center justify-center gap-2">
                    <AppIcon icon={CheckCircle2} size="btn" />
                    Unlocked
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onRedeemCoins(item.id)}
                    className={`w-full py-2.5 font-semibold text-xs rounded-[12px] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer ${
                      canAfford
                        ? 'bg-[var(--px-primary)] hover:bg-[var(--px-primary-hover)] text-white'
                        : 'bg-[var(--px-surface-muted)] text-[var(--px-muted)] border border-[var(--px-border)] cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      'Redeem'
                    ) : (
                      <>
                        <AppIcon icon={Lock} size="btn" />
                        Insufficient coins
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="px-surface p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-bold text-[var(--px-heading)] text-base pb-2 border-b border-[var(--px-border)]">
            Wallet Transaction Ledger
          </h3>

          {transactions.length === 0 ? (
            <p className="text-xs text-[var(--px-muted)] py-6 text-center">
              No coin transactions yet. Complete a mock or your daily study plan to earn coins.
            </p>
          ) : (
            <div className="overflow-x-auto scroll-x-safe">
              <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                <thead>
                  <tr className="bg-[var(--px-surface-muted)] text-[var(--px-muted)] font-mono uppercase text-[10px] border-b border-[var(--px-border)]">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Event Reason</th>
                    <th className="p-3">Reference Type</th>
                    <th className="p-3 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--px-border)] font-mono">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--px-surface-muted)]">
                      <td className="p-3 text-[var(--px-muted)]">{tx.createdAt}</td>
                      <td className="p-3 font-semibold text-[var(--px-heading)]">{tx.reason}</td>
                      <td className="p-3 text-[var(--px-muted)]">{tx.refType}</td>
                      <td
                        className={`p-3 text-right font-bold tabular-nums ${
                          tx.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.delta >= 0 ? `+${tx.delta}` : tx.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="px-surface p-5 sm:p-6 space-y-4">
          <h3 className="font-display font-bold text-[var(--px-heading)] text-base pb-2 border-b border-[var(--px-border)]">
            Study Coin Earning Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EARNING_RULES.map((rule) => (
              <div
                key={rule.title}
                className="p-4 rounded-[12px] border border-[var(--px-border)] bg-[var(--px-surface-muted)] space-y-1"
              >
                <div className="text-xs font-bold text-[var(--px-heading)]">{rule.title}</div>
                <div className="text-xs text-[var(--px-muted)]">{rule.desc}</div>
                <div className="text-sm font-bold tabular-nums text-[var(--px-heading)] font-mono pt-1">
                  +{rule.coins} coins
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
