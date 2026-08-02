import React, { useMemo, useState } from 'react';
import { 
  Coins, 
  Sparkles, 
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { UserProfile, CoinTransaction } from '../types';
import { EARNING_RULES, REDEEMABLE_CATALOG } from '../lib/coinRewards';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-6 sm:p-8 text-slate-950 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950/20 text-slate-950 text-xs font-bold rounded-full border border-slate-950/20">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Study Coins Habit Infrastructure</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {userProfile.studyCoinBalance} <span className="text-lg font-bold uppercase">Study Coins</span>
            </h1>
            <p className="text-slate-900/80 text-xs max-w-md">
              Earn coins through mock completion and finishing your daily study plan. Redeem for packs and extra mock quota.
            </p>
          </div>

          <div className="bg-slate-950/10 backdrop-blur-md p-4 rounded-xl border border-slate-950/20 text-xs font-mono space-y-1 shrink-0">
            <div className="text-slate-900 font-bold uppercase text-[10px]">Anti-Abuse Governance</div>
            <div>• Non-withdrawable & Non-transferable</div>
            <div>• Ledger synced to your account activity</div>
            <div>• Unlocks persist after redemption</div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 font-bold text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'catalog' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Redemption Catalog
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Transaction Ledger ({transactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'rules' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Earning Rules
        </button>
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {redeemableItems.map((item) => {
              const canAfford = userProfile.studyCoinBalance >= item.coinCost;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 shadow-xs hover:border-amber-400 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-900 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <span className="font-mono font-black text-amber-600 text-sm flex items-center gap-1">
                        <Coins className="w-4 h-4 fill-current" />
                        {item.coinCost} Coins
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>

                  {item.unlocked ? (
                    <div className="w-full py-2.5 font-bold text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Unlocked
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onRedeemCoins(item.id)}
                      className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? (
                        'Redeem Now'
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Insufficient Coins
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Wallet Transaction Ledger
          </h3>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No coin transactions yet. Complete a mock or your daily study plan to earn coins.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Event Reason</th>
                    <th className="p-3">Reference Type</th>
                    <th className="p-3 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{tx.createdAt}</td>
                      <td className="p-3 font-semibold text-slate-900">{tx.reason}</td>
                      <td className="p-3 text-slate-500">{tx.refType}</td>
                      <td
                        className={`p-3 text-right font-bold ${
                          tx.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.delta >= 0 ? `+${tx.delta}` : tx.delta} Coins
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Official Study Coin Earning Event Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EARNING_RULES.map((rule) => (
              <div key={rule.title} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-xs font-bold text-slate-900">{rule.title}</div>
                <div className="text-xs text-slate-500">{rule.desc}</div>
                <div className="text-sm font-black text-amber-600 font-mono pt-1">+{rule.coins} Coins</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
