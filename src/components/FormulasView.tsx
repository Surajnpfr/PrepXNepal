import React, { useState, useEffect } from 'react';
import { FileText, Bookmark, Search, CheckCircle2, BookOpen, Download, Copy, Check } from 'lucide-react';
import { FORMULA_SHEETS } from '../data/mockData';

export const FormulasView: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [savedFormulas, setSavedFormulas] = useState<string[]>(() => {
    const saved = localStorage.getItem('prepx_saved_formulas');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('prepx_saved_formulas', JSON.stringify(savedFormulas));
  }, [savedFormulas]);

  const toggleSaveFormula = (formulaKey: string) => {
    setSavedFormulas(prev => 
      prev.includes(formulaKey) ? prev.filter(k => k !== formulaKey) : [...prev, formulaKey]
    );
  };

  const handleCopyFormula = (formulaText: string) => {
    navigator.clipboard.writeText(formulaText);
    setCopiedFormula(formulaText);
    setTimeout(() => setCopiedFormula(null), 1800);
  };

  const filteredSheets = FORMULA_SHEETS.filter(s => {
    if (selectedSubject === 'Bookmarks') {
      return s.formulas.some(f => savedFormulas.includes(`${s.id}-${f.name}`));
    }
    if (selectedSubject !== 'All' && s.subject !== selectedSubject) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = s.title.toLowerCase().includes(q);
      const matchesFormulas = s.formulas.some(f => f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q));
      return matchesTitle || matchesFormulas;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Toast Notification Banner */}
      {copiedFormula && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-mono animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Formula copied to clipboard: <strong>{copiedFormula}</strong></span>
        </div>
      )}

      {/* Title */}
      <div className="border-b border-slate-200 pb-6 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          High-Yield Formula Sheets & Saved Notes
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Instant offline-cached revision formulas for CEE Physics, Chemistry, Botany, Zoology, and Mathematics.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold w-full md:w-auto">
          {['All', 'Physics', 'Chemistry', 'Botany', 'Zoology', 'Bookmarks'].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedSubject === sub 
                  ? 'bg-slate-900 text-white shadow-xs font-bold' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub === 'Bookmarks' && <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-current" />}
              <span>{sub}</span>
              {sub === 'Bookmarks' && savedFormulas.length > 0 && (
                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                  {savedFormulas.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 md:w-64 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search formulas or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Formulas Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSheets.map((sheet) => {
          const formulasToRender = selectedSubject === 'Bookmarks'
            ? sheet.formulas.filter(f => savedFormulas.includes(`${sheet.id}-${f.name}`))
            : sheet.formulas;

          if (formulasToRender.length === 0) return null;

          return (
            <div key={sheet.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {sheet.subject}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{sheet.title}</h3>
                </div>
                <button 
                  onClick={() => alert(`Downloading offline formula sheet for ${sheet.title}`)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                  title="Download PDF Formula Sheet"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {formulasToRender.map((f, i) => {
                  const formulaKey = `${sheet.id}-${f.name}`;
                  const isSaved = savedFormulas.includes(formulaKey);

                  return (
                    <div key={i} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 space-y-2 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{f.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyFormula(f.formula)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Copy formula text"
                          >
                            {copiedFormula === f.formula ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => toggleSaveFormula(formulaKey)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSaved ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-white'
                            }`}
                            title={isSaved ? 'Remove Bookmark' : 'Bookmark Formula'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="font-mono text-sm font-black text-blue-600 bg-white p-2.5 rounded-lg border border-slate-200 inline-block shadow-2xs">
                        {f.formula}
                      </div>

                      {f.note && (
                        <div className="text-[10px] text-slate-500 font-mono leading-relaxed pt-0.5">
                          💡 {f.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
