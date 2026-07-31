import React, { useState } from 'react';
import { Bookmark, Search, CheckCircle2, XCircle, ArrowRight, BookOpen, Trash2 } from 'lucide-react';
import { SubjectName } from '../types';

export const SavedQuestionsView: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [savedItems, setSavedItems] = useState([
    {
      id: 'sq-1',
      subject: 'Physics' as SubjectName,
      chapter: 'Simple Harmonic Motion',
      stem: 'A particle executes SHM with amplitude A. At what displacement from the mean position is its kinetic energy equal to its potential energy?',
      options: { A: 'x = A / 2', B: 'x = A / √2', C: 'x = A / √3', D: 'x = A / 4' },
      correctOptionKey: 'B',
      explanation: 'KE = 1/2 m w² (A² - x²) and PE = 1/2 m w² x². Equating KE = PE gives A² - x² = x² => 2x² = A² => x = A / √2.',
      savedAt: 'Yesterday',
    },
    {
      id: 'sq-2',
      subject: 'Chemistry' as SubjectName,
      chapter: 'Chemical Kinetics',
      stem: 'For a first-order reaction, the time required for 99.9% completion is approximately how many times its half-life (t1/2)?',
      options: { A: '4 times', B: '8 times', C: '10 times', D: '12 times' },
      correctOptionKey: 'C',
      explanation: 't_99.9% = (2.303 / k) log(100 / 0.1) = (2.303 / k) log(10³) = 3 * (2.303 / k) = 3 * (t1/2 / 0.693) * 2.303 ≈ 10 * t1/2.',
      savedAt: '2 days ago',
    },
    {
      id: 'sq-3',
      subject: 'Botany' as SubjectName,
      chapter: 'Plant Physiology & Photosynthesis',
      stem: 'In C4 plants, the primary CO2 acceptor molecule in mesophyll cells is:',
      options: { A: 'RuBP (Ribulose 1,5-bisphosphate)', B: 'PEP (Phosphoenolpyruvate)', C: 'OAA (Oxaloacetic acid)', D: 'PGA (Phosphoglyceric acid)' },
      correctOptionKey: 'B',
      explanation: 'In C4 mesophyll cells, PEP carboxylase fixes CO2 onto PEP (3-carbon) to form OAA (4-carbon).',
      savedAt: '3 days ago',
    },
    {
      id: 'sq-4',
      subject: 'Zoology' as SubjectName,
      chapter: 'Human Physiology & Endocrinology',
      stem: 'Which hormone is responsible for the reabsorption of water in the distal convoluted tubule and collecting duct of the nephron?',
      options: { A: 'Aldosterone', B: 'ADH (Vasopressin)', C: 'Oxytocin', D: 'Renin' },
      correctOptionKey: 'B',
      explanation: 'Anti-Diuretic Hormone (ADH) synthesized in the hypothalamus and released by the posterior pituitary increases aquaporin water channels in DCT & collecting duct.',
      savedAt: '5 days ago',
    },
  ]);

  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({
    'sq-1': true
  });

  const handleRemove = (id: string) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  const filtered = savedItems.filter(item => {
    if (selectedSubject !== 'All' && item.subject !== selectedSubject) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.stem.toLowerCase().includes(q) || item.chapter.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-500 fill-current" />
            <span>Saved & Flagged Questions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review tricky CEE questions you bookmarked during mock tests or practice sets.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full self-start sm:self-auto">
          {savedItems.length} Bookmarks
        </span>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold w-full sm:w-auto">
          {['All', 'Physics', 'Chemistry', 'Botany', 'Zoology'].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedSubject === sub 
                  ? 'bg-slate-900 text-white font-bold' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search saved questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No saved questions found</h3>
            <p className="text-xs text-slate-500">Bookmark questions while taking CEE mock tests to review them here anytime.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md font-mono text-[10px] uppercase">
                    {item.subject}
                  </span>
                  <span className="text-slate-500 font-semibold">{item.chapter}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Saved {item.savedAt}</span>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {item.stem}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium pt-1">
                {Object.entries(item.options).map(([key, value]) => {
                  const isCorrect = key === item.correctOptionKey;
                  return (
                    <div 
                      key={key} 
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isCorrect 
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {key}
                        </span>
                        <span>{value}</span>
                      </span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                  );
                })}
              </div>

              {/* Solution Toggle */}
              <div className="pt-2">
                <button
                  onClick={() => setExpandedSolutions(p => ({ ...p, [item.id]: !p[item.id] }))}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{expandedSolutions[item.id] ? 'Hide Verified Solution' : 'Show Verified CEE Solution'}</span>
                </button>

                {expandedSolutions[item.id] && (
                  <div className="mt-2 p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs text-blue-950 font-medium leading-relaxed">
                    💡 <strong>Solution Explanation:</strong> {item.explanation}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
