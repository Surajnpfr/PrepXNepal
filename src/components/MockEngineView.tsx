import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Flag, 
  CheckCircle2, 
  X, 
  Grid,
} from 'lucide-react';
import { MockTest, Question, AttemptState } from '../types';
import { AppIcon } from './ui';
import { MathText } from './MathText';interface MockEngineViewProps {
  mockTest: MockTest;
  onSubmitAttempt: (attempt: AttemptState) => void | Promise<void>;
  onExit: () => void;
  /** Question ids already saved for this user (from Saved Questions store). */
  initialBookmarkedIds?: string[];
  onToggleSavedQuestion?: (question: Question, saved: boolean) => void;
}

export const MockEngineView: React.FC<MockEngineViewProps> = ({
  mockTest,
  onSubmitAttempt,
  onExit,
  initialBookmarkedIds = [],
  onToggleSavedQuestion,
}) => {
  // Page & Question state
  const questionsPerPage = mockTest.questionsPerPage || 20;
  const totalPages = Math.ceil(mockTest.questions.length / questionsPerPage);
  const submitOnceRef = useRef(false);

  const [hasConfirmedInstructions, setHasConfirmedInstructions] = useState<boolean>(() => {
    return !!localStorage.getItem(`prepx_attempt_${mockTest.id}`);
  });
  const [isAgreedToTerms, setIsAgreedToTerms] = useState<boolean>(false);

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
    return {
      id: `att-${Date.now()}`,
      mockId: mockTest.id,
      mockTitle: mockTest.title,
      examType: mockTest.examType,
      startedAt: now.toISOString(),
      endsAt: now.toISOString(), // Temporary, finalized upon starting exam
      answers: {},
      markedForReview: [],
      currentPage: 1,
      status: 'in_progress',
      totalQuestions: mockTest.questions.length,
      timeSpentSecs: {},
    };
  });

  const [remainingSecs, setRemainingSecs] = useState<number>(() => {
    const saved = localStorage.getItem(`prepx_attempt_${mockTest.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const ends = new Date(parsed.endsAt).getTime();
        const now = new Date().getTime();
        return Math.max(0, Math.floor((ends - now) / 1000));
      } catch (e) {
        // Fallback
      }
    }
    return mockTest.durationSec;
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => [...initialBookmarkedIds]);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ne'>('en');
  const [filterMode, setFilterMode] = useState<'all' | 'answered' | 'unanswered' | 'review'>('all');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Incremental save to localStorage
  useEffect(() => {
    if (hasConfirmedInstructions) {
      localStorage.setItem(`prepx_attempt_${mockTest.id}`, JSON.stringify(attempt));
    }
  }, [attempt, mockTest.id, hasConfirmedInstructions]);

  // Lock page scroll behind the fixed exam shell
  useEffect(() => {
    if (!hasConfirmedInstructions) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [hasConfirmedInstructions]);

  // Timer Countdown loop
  useEffect(() => {
    if (!hasConfirmedInstructions) return;

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
  }, [remainingSecs, hasConfirmedInstructions]);

  const handleStartExam = () => {
    const now = new Date();
    const ends = new Date(now.getTime() + mockTest.durationSec * 1000);
    setAttempt(prev => ({
      ...prev,
      startedAt: now.toISOString(),
      endsAt: ends.toISOString()
    }));
    setRemainingSecs(mockTest.durationSec);
    setHasConfirmedInstructions(true);
  };

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
    const question = mockTest.questions.find((q) => q.id === qId);
    setBookmarkedIds((prev) => {
      const exists = prev.includes(qId);
      const next = exists ? prev.filter((id) => id !== qId) : [...prev, qId];
      if (question && onToggleSavedQuestion) {
        onToggleSavedQuestion(question, !exists);
      }
      return next;
    });
  };

  const handleToggleFlag = (qId: string) => {
    setFlaggedIds(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleFinalSubmit = () => {
    if (submitOnceRef.current) return;
    submitOnceRef.current = true;
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
  const actualTotalQuestions = mockTest.questions.length || mockTest.totalQuestions;
  const unansweredCount = Math.max(0, actualTotalQuestions - answeredCount);

  // Format timer HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasConfirmedInstructions) {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans flex items-center justify-center p-4">
        <div className="bg-white text-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#2563EB] font-black">Before you begin</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                MEC CEE Regulations
              </h2>
            </div>
            <button 
              onClick={onExit}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
            >
              <AppIcon icon={X} size="btn" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
              <div className="font-bold text-slate-800">Exam Details:</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium">
                <div>• Total Questions: <span className="font-bold text-slate-900">{mockTest.questions.length || mockTest.totalQuestions} MCQs</span></div>
                <div>• Total Duration: <span className="font-bold text-slate-900">{Math.round(mockTest.durationSec / 60)} mins</span></div>
                <div>• Exam Format: <span className="font-bold text-slate-900">Nepal CEE Standard</span></div>
                <div>• Penalty Scheme: <span className="font-bold text-[#E11D48]">-0.25 negative marks</span></div>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 font-semibold">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                <span><strong>Pagination:</strong> Questions are organized across 10 pages containing 20 questions each. You can navigate back and forth between pages.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                <span><strong>No Retrospective Changes:</strong> You get one response path per question. Once you submit (or time expires), answers are scored immediately. Weekly open mocks allow exactly one attempt.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                <span><strong>Auto-save:</strong> Your answers are saved about every 10 seconds. If you reload or briefly lose connection, you can continue from where you left off.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] mt-1.5 shrink-0" />
                <span><strong>Time limit:</strong> When the timer reaches 00:00:00, your attempt is submitted automatically. Unanswered questions do not deduct marks.</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer text-xs select-none">
              <input 
                type="checkbox" 
                checked={isAgreedToTerms}
                onChange={(e) => setIsAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]/20 border-slate-300 cursor-pointer mt-0.5"
              />
              <span className="text-slate-600 font-bold leading-normal">
                I have read these exam rules and agree to the −0.25 negative marking policy.
              </span>
            </label>

            <div className="flex gap-3">
              <button 
                onClick={onExit}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Back to mock tests
              </button>
              <button 
                disabled={!isAgreedToTerms}
                onClick={handleStartExam}
                className="flex-1 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md"
              >
                Begin timed mock
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-100 font-sans flex flex-col">
      {/* Exam chrome — outside scroll so timer stays visible */}
      <header className="bg-slate-900 text-white shrink-0 z-40 border-b border-slate-800 shadow-md py-3 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left Title & Exit */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onExit}
              className="touch-target inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Exit Test"
              aria-label="Exit test"
            >
              <AppIcon icon={X} size="btn" />
            </button>
            <div className="min-w-0">
              <h2 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
                {mockTest.title}
              </h2>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {mockTest.examType} • {mockTest.totalQuestions} Questions • 20 Qs / Page
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Timer Display */}
            <div className="bg-slate-950 px-3 sm:px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-2 font-mono shrink-0">
            <AppIcon icon={Clock} size="btn" className={remainingSecs < 600 ? 'text-rose-400' : 'text-cyan-400'} />
              <div className="text-right">
                <div className="text-[9px] uppercase text-slate-400">Time Left</div>
                <div className={`text-base font-black tracking-wider ${remainingSecs < 600 ? 'text-rose-400' : 'text-white'}`}>
                  {formatTime(remainingSecs)}
                </div>
              </div>
            </div>

            {/* Palette Toggle & Submit CTA */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPaletteDrawer(true)}
                className="min-h-11 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <AppIcon icon={Grid} size="btn" className="text-cyan-400" />
                <span className="hidden sm:inline">Question Palette</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="min-h-11 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="sm:hidden">Submit</span>
                <span className="hidden sm:inline">Submit Exam</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable questions + desktop palette */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      {/* Main Taking Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                    <AppIcon icon={ChevronLeft} size="btn" />
                    <span>Prev</span>
                  </button>

                  <button
                    disabled={attempt.currentPage === totalPages}
                    onClick={() => setAttempt(p => ({ ...p, currentPage: Math.min(totalPages, p.currentPage + 1) }))}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <AppIcon icon={ChevronRight} size="btn" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Mode Toolbar */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scroll-x-safe text-[11px] font-bold">
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
                        <AppIcon icon={Bookmark} size="btn" />
                      </button>

                      <button
                        onClick={() => handleToggleFlag(q.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isFlagged ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:text-rose-600'
                        }`}
                        title="Report/Flag question error"
                      >
                        <AppIcon icon={Flag} size="btn" />
                      </button>
                    </div>
                  </div>

                  {/* Stem / Question Statement */}
                  <div className={`font-semibold text-slate-900 leading-relaxed pt-1 ${fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
                    <MathText text={q.stem} />
                  </div>

                  {q.imageUrl && (
                    <div className="pt-2">
                      <img
                        src={q.imageUrl}
                        alt="Question figure"
                        className="max-h-56 w-auto max-w-full rounded-xl border border-slate-200 bg-white object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Options List A, B, C, D */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const isSelected = selectedKey === key;
                      const optionImage = q.optionImages?.[key];
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
                          <span className="text-xs sm:text-sm pt-0.5 leading-snug flex-1 space-y-2">
                            <span className="block"><MathText text={q.options[key]} /></span>
                            {optionImage && (
                              <img
                                src={optionImage}
                                alt={`Option ${key}`}
                                className={`max-h-28 w-auto rounded-lg border object-contain ${
                                  isSelected ? 'border-white/40 bg-white' : 'border-slate-200 bg-white'
                                }`}
                                loading="lazy"
                              />
                            )}
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
              <AppIcon icon={ChevronLeft} size="btn" />
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
              <AppIcon icon={ChevronRight} size="btn" />
            </button>
          </div>
        </main>

        {/* Desktop Persistent Question Palette Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs sticky top-4 space-y-4">
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
                        document.getElementById(`q-card-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      </div>

      {/* Question Palette Drawer Modal for Mobile / Small Screens */}
      {showPaletteDrawer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AppIcon icon={Grid} size="btn" className="text-cyan-600" />
                <span>Question Palette ({mockTest.totalQuestions} Qs)</span>
              </h3>
              <button
                onClick={() => setShowPaletteDrawer(false)}
                className="touch-target inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                aria-label="Close question palette"
              >
                <AppIcon icon={X} size="btn" />
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
                        document.getElementById(`q-card-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <AppIcon icon={CheckCircle2} size="lg" />
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
