import React, { useState } from 'react';
import { 
  Coins, 
  Award, 
  Zap, 
  CheckCircle2, 
  Info, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  ArrowUpRight, 
  Lock 
} from 'lucide-react';
import { UserProfile, CoinTransaction } from '../types';

interface CoinsWalletViewProps {
  userProfile: UserProfile;
  transactions: CoinTransaction[];
  onRedeemCoins: (amount: number, itemTitle: string) => void;
}

export const CoinsWalletView: React.FC<CoinsWalletViewProps> = ({
  userProfile,
  transactions,
  onRedeemCoins,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'ledger' | 'rules'>('catalog');

  const redeemableItems = [
    {
      id: 'red-01',
      title: 'Chemical Kinetics High-Yield Practice Pack (30 Qs)',
      category: 'Revision Pack',
      coinCost: 50,
      description: 'Unlock 30 extra questions with step-by-step video & text solutions for Organic Reaction Mechanisms.',
      unlocked: false
    },
    {
      id: 'red-02',
      title: '1 Extra CEE Full Mock Quota',
      category: 'Mock Quota',
      coinCost: 100,
      description: 'Grants +1 full 200-question timed CEE mock test attempt added to your profile.',
      unlocked: false
    },
    {
      id: 'red-03',
      title: 'PYP 2081 Master Exam Solution Pack',
      category: 'Past Papers',
      coinCost: 75,
      description: 'Comprehensive chapter breakdown and formula shortcuts for all 200 questions of CEE 2081.',
      unlocked: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Wallet Balance Hero Card */}
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
              Earn coins through consistent practice, mock completion, and revision. Coins unlock extra practice packs and mock quotas.
            </p>
          </div>

          <div className="bg-slate-950/10 backdrop-blur-md p-4 rounded-xl border border-slate-950/20 text-xs font-mono space-y-1 shrink-0">
            <div className="text-slate-900 font-bold uppercase text-[10px]">Anti-Abuse Governance</div>
            <div>• Non-withdrawable & Non-transferable</div>
            <div>• Expiry: Configurable (Default: None)</div>
            <div>• Manual Clawback Protection Active</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 font-bold text-xs">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'catalog' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Redemption Catalog
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Transaction Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'rules' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Earning Rules
        </button>
      </div>

      {/* TAB 1: Redemption Catalog */}
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

                  <button
                    disabled={!canAfford}
                    onClick={() => onRedeemCoins(item.coinCost, item.title)}
                    className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Redeem Now' : 'Insufficient Coins'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Immutable Transaction Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Immutable Wallet Transaction Ledger (`coin_transactions`)
          </h3>

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
                    <td className="p-3 text-right font-bold text-emerald-600">
                      +{tx.delta} Coins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Earning Rules Matrix */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Official Study Coin Earning Event Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-900">Complete Mock Test</div>
              <div className="text-xs text-slate-500">Scored attempt finalized</div>
              <div className="text-sm font-black text-amber-600 font-mono pt-1">+20 Coins</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-900">Complete Recommended Revision</div>
              <div className="text-xs text-slate-500">Revision pack marked complete</div>
              <div className="text-sm font-black text-amber-600 font-mono pt-1">+15 Coins</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-900">Weekly CEE Challenge</div>
              <div className="text-xs text-slate-500">Challenge rules met</div>
              <div className="text-sm font-black text-amber-600 font-mono pt-1">+50 Coins</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-900">Personal Best Score</div>
              <div className="text-xs text-slate-500">Score &gt; prior best on template</div>
              <div className="text-sm font-black text-amber-600 font-mono pt-1">+25 Coins</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-900">Valid Question Report</div>
              <div className="text-xs text-slate-500">Moderator approves reported error</div>
              <div className="text-sm font-black text-amber-600 font-mono pt-1">+10 Coins</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-900">Profile Completion</div>
              <div className="text-xs text-slate-500">Required fields set once</div>
              <div className="text-sm font-black text-amber-600 font-mono pt-1">+15 Coins</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
