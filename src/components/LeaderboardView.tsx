import React, { useState } from 'react';
import { Trophy, Award, Flame, Coins, Medal, Search, Sparkles } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cee_rank' | 'coins'>('cee_rank');

  const rankers = [
    { rank: 1, name: 'Suman Adhikari', score: 188, percentile: '99.9%', coins: 840, badge: 'Biratnagar', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80' },
    { rank: 2, name: 'Pooja Karki', score: 184, percentile: '99.8%', coins: 790, badge: 'Kathmandu', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80' },
    { rank: 3, name: 'Bipul Pokharel', score: 179, percentile: '99.6%', coins: 720, badge: 'Pokhara', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
    { rank: 4, name: 'Krrish Nyoupane (You)', score: 165, percentile: '98.2%', coins: 245, badge: 'Kathmandu', avatar: '', isUser: true },
    { rank: 5, name: 'Rohan Shrestha', score: 162, percentile: '97.8%', coins: 510, badge: 'Lalitpur', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' },
    { rank: 6, name: 'Sujata Giri', score: 158, percentile: '97.1%', coins: 460, badge: 'Chitwan', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
    { rank: 7, name: 'Anish Thapa', score: 154, percentile: '96.4%', coins: 390, badge: 'Dharan', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500 fill-amber-100" />
            <span>Nepal CEE 2026 Aspirants Leaderboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Top mock scorers across Nepal preparing for medical & paramedical entrance.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('cee_rank')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'cee_rank' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            CEE Rankers
          </button>
          <button
            onClick={() => setActiveTab('coins')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'coins' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Coin Champions
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rankers.slice(0, 3).map((usr, i) => (
          <div key={usr.rank} className={`p-5 rounded-2xl border relative overflow-hidden shadow-2xs ${
            i === 0 ? 'bg-gradient-to-b from-amber-50 to-white border-amber-300' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={usr.avatar} alt={usr.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400" />
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full font-mono text-[10px] font-black flex items-center justify-center text-white ${
                  i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'
                }`}>
                  #{usr.rank}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{usr.name}</h3>
                <span className="text-[10px] text-slate-500 font-mono">{usr.badge}, Nepal</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Mock Score</span>
                <span className="font-mono font-black text-blue-600 text-base">{usr.score}/200</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Percentile</span>
                <span className="font-mono font-black text-emerald-600 text-base">{usr.percentile}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Rankings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Rank & Aspirant</span>
          <div className="flex items-center gap-8">
            <span className="w-16 text-right">Score</span>
            <span className="w-16 text-right">Percentile</span>
            <span className="w-16 text-right">Coins</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 font-sans text-xs">
          {rankers.map((usr) => (
            <div 
              key={usr.rank}
              className={`p-4 flex items-center justify-between transition-colors ${
                usr.isUser ? 'bg-blue-50/80 font-bold border-l-4 border-blue-600' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center font-mono font-black text-sm ${
                  usr.rank <= 3 ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  #{usr.rank}
                </span>
                <img src={usr.avatar} alt={usr.name} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{usr.name}</span>
                    {usr.isUser && (
                      <span className="text-[9px] uppercase font-mono font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{usr.badge}</span>
                </div>
              </div>

              <div className="flex items-center gap-8 font-mono font-bold text-xs">
                <span className="w-16 text-right text-blue-600">{usr.score}/200</span>
                <span className="w-16 text-right text-emerald-600">{usr.percentile}</span>
                <span className="w-16 text-right text-amber-600">{usr.coins} 🪙</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
