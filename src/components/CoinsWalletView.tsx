import React from 'react';
import { Coins, Clock } from 'lucide-react';
import type { UserProfile, CoinTransaction } from '../types';
import { AppIcon, PageHeader } from './ui';

interface CoinsWalletViewProps {
  userProfile: UserProfile;
  transactions: CoinTransaction[];
  onRedeemCoins: (itemId: string) => void;
}

/**
 * Study Coins wallet — Coming soon placeholder.
 * Full earn/redeem redesign is deferred; server routes remain for later.
 */
export const CoinsWalletView: React.FC<CoinsWalletViewProps> = () => {
  return (
    <div className="px-page space-y-6 font-sans">
      <PageHeader
        title="Study Coins"
        subtitle="Rewards and redemptions are launching soon."
      />

      <div className="px-surface p-8 sm:p-10 max-w-xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest">
          <AppIcon icon={Clock} size="btn" />
          Coming soon
        </div>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <AppIcon icon={Coins} size="card" className="text-amber-600" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--px-heading)] tracking-tight">
            Study Coins rewards are on the way
          </h2>
          <p className="text-sm text-[var(--px-muted)] leading-relaxed">
            We&apos;re redesigning how you earn and redeem Study Coins for practice packs and extra
            mocks. The wallet, catalog, and earning rules will open here when the new system is
            ready.
          </p>
        </div>

        <p className="text-xs text-[var(--px-muted)]">
          Keep practising with mocks and your study plan — coin rewards will catch up after launch.
        </p>
      </div>
    </div>
  );
};
