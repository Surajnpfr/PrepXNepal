import React, { useState } from 'react';
import { Bookmark, Search, CheckCircle2, Trash2 } from 'lucide-react';
import type { SavedQuestionItem } from '../lib/savedQuestions';
import { formatRelativeTime } from '../lib/notifications';
import { AppIcon } from './ui';

interface SavedQuestionsViewProps {
  items: SavedQuestionItem[];
  onRemove: (questionId: string) => void;
  onNavigate?: (tab: string) => void;
}

export const SavedQuestionsView: React.FC<SavedQuestionsViewProps> = ({
  items,
  onRemove,
  onNavigate,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  const filtered = items.filter((item) => {
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
            <AppIcon icon={Bookmark} size="lg" className="text-amber-500" />
            <span>Saved & Flagged Questions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review tricky CEE questions you bookmarked during mock tests.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full self-start sm:self-auto">
          {items.length} Bookmarks
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold w-full sm:w-auto">
          {['All', 'Physics', 'Chemistry', 'Botany', 'Zoology', 'MAT', 'Mixed'].map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-2.5 min-h-11 rounded-xl transition-all cursor-pointer ${
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
          <AppIcon icon={Search} size="btn" className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search saved questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <AppIcon icon={Bookmark} size="lg" className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No saved questions yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Save questions with the star icon during a mock. They appear here for later revision.
            </p>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Browse Mock Catalog
              </button>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md font-mono text-[10px] uppercase">
                    {item.subject}
                  </span>
                  <span className="text-slate-500 font-semibold truncate">{item.chapter}</span>
                  {item.mockTitle && (
                    <span className="text-slate-400 font-mono text-[10px] truncate">· {item.mockTitle}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                  <span>Saved {formatRelativeTime(item.savedAt)}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(item.questionId)}
                    className="hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                    title="Remove Bookmark"
                  >
                    <AppIcon icon={Trash2} size="btn" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-900 leading-relaxed">{item.stem}</p>

              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt="Question figure"
                  className="max-h-48 w-auto rounded-xl border border-slate-200 object-contain bg-white"
                  loading="lazy"
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium pt-1">
                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                  const value = item.options[key];
                  const isCorrect = item.correctOptionKey != null && key === item.correctOptionKey;
                  const optionImage = item.optionImages?.[key];
                  return (
                    <div
                      key={key}
                      className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 ${
                        isCorrect
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="flex items-start gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {key}
                        </span>
                        <span className="space-y-1.5">
                          <span className="block">{value}</span>
                          {optionImage && (
                            <img
                              src={optionImage}
                              alt={`Option ${key}`}
                              className="max-h-24 rounded-lg border border-slate-200 bg-white object-contain"
                              loading="lazy"
                            />
                          )}
                        </span>
                      </span>
                      {isCorrect && <AppIcon icon={CheckCircle2} size="btn" className="text-emerald-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {item.explanation && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSolutions((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                    className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    {expandedSolutions[item.id] ? 'Hide explanation' : 'Show explanation'}
                  </button>
                  {expandedSolutions[item.id] && (
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">
                      {item.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
