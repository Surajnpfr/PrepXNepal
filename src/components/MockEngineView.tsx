import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Globe, 
  X, 
  Grid,
  Zap,
  RotateCcw
} from 'lucide-react';
import { MockTest, Question, AttemptState } from '../types';

interface MockEngineViewProps {
  mockTest: MockTest;
  onSubmitAttempt: (attempt: AttemptState) => void;
  onExit: () => void;
}

export const MockEngineView: React.FC<MockEngineViewProps> = ({
  mockTest,
  onSubmitAttempt,
  onExit,
}) => {
  // Page & Question state
  const questionsPerPage = mockTest.questionsPerPage || 20;
  const totalPages = Math.ceil(mockTest.questions.length / questionsPerPage);

  const [attempt, setAttempt] = useState<AttemptState>(() => {
    // Check localStorage for saved session recovery
    const saved = localStorage.getItem(`prepx_attempt_${mockTest.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }

    const now = new Date();
    const ends = new Date(now.getTime() + mockTest.durationSec * 1000);
    return {
      id: `att-${Date.now()}`,
      mockId: mockTest.id,
      mockTitle: mockTest.title,
      examType: mockTest.examType,
      startedAt: now.toISOString(),
      endsAt: ends.toISOString(),
      answers: {},
      markedForReview: [],
      currentPage: 1,
      status: 'in_progress',
      totalQuestions: mockTest.questions.length,
      timeSpentSecs: {},
    };
  });

  const [remainingSecs, setRemainingSecs] = useState<number>(() => {
    const ends = new Date(attempt.endsAt).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((ends - now) / 1000));
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ne'>('en');
  const [filterMode, setFilterMode] = useState<'all' | 'answered' | 'unanswered' | 'review'>('all');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Incremental save to localStorage
  useEffect(() => {
    localStorage.setItem(`prepx_attempt_${mockTest.id}`, JSON.stringify(attempt));
  }, [attempt, mockTest.id]);

  // Timer Countdown loop
  useEffect(() => {
    if (remainingSecs <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSecs(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSecs]);

  const handleSelectOption = (qId: string, key: 'A' | 'B' | 'C' | 'D') => {
    setAttempt(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [qId]: prev.answers[qId] === key ? undefined as any : key // Toggle off if clicked twice
      }
    }));
  };

  const handleToggleReview = (qId: string) => {
    setAttempt(prev => {
      const exists = prev.markedForReview.includes(qId);
      return {
        ...prev,
        markedForReview: exists 
          ? prev.markedForReview.filter(id => id !== qId)
          : [...prev.markedForReview, qId]
      };
    });
  };

  const handleToggleBookmark = (qId: string) => {
    setBookmarkedIds(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleToggleFlag = (qId: string) => {
    setFlaggedIds(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleFinalSubmit = () => {
    localStorage.removeItem(`prepx_attempt_${mockTest.id}`);
    const finalAttempt: AttemptState = {
      ...attempt,
      status: 'scored'
    };
    onSubmitAttempt(finalAttempt);
  };

  // Pagination calculation
  const startIndex = (attempt.currentPage - 1) * questionsPerPage;
  const pageQuestions = mockTest.questions.slice(startIndex, startIndex + questionsPerPage);

  const answeredCount = Object.keys(attempt.answers).filter(k => attempt.answers[k]).length;
  const reviewCount = attempt.markedForReview.length;
  const unansweredCount = mockTest.totalQuestions - answeredCount;

  // Format timer HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Top Fixed Exam Navigation & Timer Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Title & Exit */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onExit}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Exit Test"
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base tracking-tight line-clamp-1">
                {mockTest.title}
              </h2>
              <div className="text-[10px] text-slate-400 font-mono">
                {mockTest.examType} • {mockTest.totalQuestions} Questions • 20 Qs / Page
              </div>
            </div>
          </div>

          {/* Center Timer Display */}
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-2 font-mono">
            <Clock className={`w-4 h-4 ${remainingSecs < 600 ? 'text-rose-500 animate-ping' : 'text-cyan-400'}`} />
            <div className="text-right">
              <div className="text-[9px] uppercase text-slate-400">Time Remaining</div>
              <div className={`text-base font-black tracking-wider ${remainingSecs < 600 ? 'text-rose-400' : 'text-white'}`}>
                {formatTime(remainingSecs)}
              </div>
            </div>
          </div>

          {/* Right Palette Toggle & Submit CTA */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPaletteDrawer(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Grid className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Question Palette</span>
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </header>

      {/* Main Taking Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Questions Column */}
        <main className="lg:col-span-8 space-y-6">
          {/* Top Page Progress Indicator & Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-bold">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Page</span>
                <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-lg font-mono">
                  {attempt.currentPage} of {totalPages}
                </span>
                <span className="text-slate-400">({startIndex + 1} - {Math.min(startIndex + questionsPerPage, mockTest.totalQuestions)} of {mockTest.totalQuestions} Qs)</span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Font Size Selector */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-[10px] font-mono">
                  <span className="text-slate-500 px-1">Text:</span>
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${fontSize === 'normal' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500'}`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${fontSize === 'large' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500'}`}
                  >
                    Large
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={attempt.currentPage === 1}
                    onClick={() => setAttempt(p => ({ ...p, currentPage: Math.max(1, p.currentPage - 1) }))}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>

                  <button
                    disabled={attempt.currentPage === totalPages}
                    onClick={() => setAttempt(p => ({ ...p, currentPage: Math.min(totalPages, p.currentPage + 1) }))}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Mode Toolbar */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
              <span className="text-slate-400 font-normal shrink-0">Filter:</span>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                  filterMode === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All on Page ({pageQuestions.length})
              </button>
              <button
                onClick={() => setFilterMode('answered')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                  filterMode === 'answered' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Answered ({pageQuestions.filter(q => !!attempt.answers[q.id]).length})
              </button>
              <button
                onClick={() => setFilterMode('unanswered')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                  filterMode === 'unanswered' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Unanswered ({pageQuestions.filter(q => !attempt.answers[q.id]).length})
              </button>
              <button
                onClick={() => setFilterMode('review')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                  filterMode === 'review' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                For Review ({pageQuestions.filter(q => attempt.markedForReview.includes(q.id)).length})
              </button>
            </div>
          </div>

          {/* List of Questions on Current Page */}
          <div className="space-y-6">
            {pageQuestions
              .filter(q => {
                if (filterMode === 'answered') return !!attempt.answers[q.id];
                if (filterMode === 'unanswered') return !attempt.answers[q.id];
                if (filterMode === 'review') return attempt.markedForReview.includes(q.id);
                return true;
              })
              .map((q, idx) => {
              const globalIndex = startIndex + idx + 1;
              const selectedKey = attempt.answers[q.id];
              const isReviewed = attempt.markedForReview.includes(q.id);
              const isBookmarked = bookmarkedIds.includes(q.id);
              const isFlagged = flaggedIds.includes(q.id);

              return (
                <div 
                  id={`q-card-${q.id}`}
                  key={q.id}
                  className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all space-y-4 shadow-xs ${
                    isReviewed ? 'border-purple-300 bg-purple-50/20' : selectedKey ? 'border-emerald-300' : 'border-slate-200'
                  }`}
                >
                  {/* Question Header Metadata */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center font-mono font-bold text-xs">
                        Q{globalIndex}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                        {q.subject}
                      </span>
                      <span className="text-slate-400 font-mono hidden sm:inline">
                        • {q.chapter}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleReview(q.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isReviewed ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700'
                        }`}
                      >
                        {isReviewed ? 'Marked for Review' : 'Mark for Review'}
                      </button>

                      <button
                        onClick={() => handleToggleBookmark(q.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isBookmarked ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Bookmark question"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        onClick={() => handleToggleFlag(q.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isFlagged ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:text-rose-600'
                        }`}
                        title="Report/Flag question error"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stem / Question Statement */}
                  <div className={`font-semibold text-slate-900 leading-relaxed pt-1 ${fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
                    {q.stem}
                  </div>

                  {/* Options List A, B, C, D */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const isSelected = selectedKey === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleSelectOption(q.id, key)}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {key}
                          </span>
                          <span className="text-xs sm:text-sm pt-0.5 leading-snug">
                            {q.options[key]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-bold shadow-xs">
            <button
              disabled={attempt.currentPage === 1}
              onClick={() => setAttempt(p => ({ ...p, currentPage: Math.max(1, p.currentPage - 1) }))}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <span className="text-slate-500 font-mono">
              Page {attempt.currentPage} of {totalPages}
            </span>

            <button
              disabled={attempt.currentPage === totalPages}
              onClick={() => setAttempt(p => ({ ...p, currentPage: Math.min(totalPages, p.currentPage + 1) }))}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* Desktop Persistent Question Palette Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs sticky top-20 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-xs text-slate-400 font-mono">{mockTest.totalQuestions} Qs</span>
            </h3>

            {/* Status Counters */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-emerald-800">
                <span className="block font-black text-sm">{answeredCount}</span>
                <span className="text-[10px]">Answered</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-2 rounded-xl text-purple-800">
                <span className="block font-black text-sm">{reviewCount}</span>
                <span className="text-[10px]">Reviewed</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-700">
                <span className="block font-black text-sm">{unansweredCount}</span>
                <span className="text-[10px]">Skipped</span>
              </div>
            </div>

            {/* Questions Grid Matrix */}
            <div className="max-h-[360px] overflow-y-auto pr-1 grid grid-cols-5 gap-1.5 pt-2">
              {mockTest.questions.map((q, idx) => {
                const qNum = idx + 1;
                const isAns = !!attempt.answers[q.id];
                const isRev = attempt.markedForReview.includes(q.id);
                const pageTarget = Math.ceil(qNum / questionsPerPage);

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      if (attempt.currentPage !== pageTarget) {
                        setAttempt(p => ({ ...p, currentPage: pageTarget }));
                      }
                      setTimeout(() => {
                        document.getElementById(`q-card-${q.id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isRev
                        ? 'bg-purple-600 text-white shadow-xs'
                        : isAns
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {qNum}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Submit Exam Now
              </button>
              <div className="text-center text-[10px] text-slate-400">
                Negative marking (-0.25) active for incorrect answers
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Question Palette Drawer Modal for Mobile / Small Screens */}
      {showPaletteDrawer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Grid className="w-4 h-4 text-cyan-600" />
                <span>Question Palette ({mockTest.totalQuestions} Qs)</span>
              </h3>
              <button
                onClick={() => setShowPaletteDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Counters */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-emerald-800">
                <span className="block font-black text-sm">{answeredCount}</span>
                <span className="text-[10px]">Answered</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-2 rounded-xl text-purple-800">
                <span className="block font-black text-sm">{reviewCount}</span>
                <span className="text-[10px]">Reviewed</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-700">
                <span className="block font-black text-sm">{unansweredCount}</span>
                <span className="text-[10px]">Skipped</span>
              </div>
            </div>

            {/* Matrix */}
            <div className="max-h-[300px] overflow-y-auto pr-1 grid grid-cols-5 gap-2 pt-1">
              {mockTest.questions.map((q, idx) => {
                const qNum = idx + 1;
                const isAns = !!attempt.answers[q.id];
                const isRev = attempt.markedForReview.includes(q.id);
                const pageTarget = Math.ceil(qNum / questionsPerPage);

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      if (attempt.currentPage !== pageTarget) {
                        setAttempt(p => ({ ...p, currentPage: pageTarget }));
                      }
                      setShowPaletteDrawer(false);
                      setTimeout(() => {
                        document.getElementById(`q-card-${q.id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      isRev
                        ? 'bg-purple-600 text-white shadow-xs'
                        : isAns
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {qNum}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowPaletteDrawer(false)}
                className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Palette
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Final Exam Submission</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to finalize and submit your test? Your attempt will be locked and scored immediately against CEE rules.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-bold text-slate-900">{mockTest.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attempted Answers:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marked for Review:</span>
                <span className="font-bold text-purple-600">{reviewCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unanswered / Skipped:</span>
                <span className="font-bold text-slate-600">{unansweredCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Continue Test
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
