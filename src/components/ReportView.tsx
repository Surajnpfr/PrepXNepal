import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Share2,
  BookOpen,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import type { AttemptReport, Question } from '../types';
import { downloadQuestionPaperPdf } from '../lib/downloadQuestionPaperPdf';
import { classifyAnswer, resolvePaper } from '../lib/reportPaper';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';

interface ReportViewProps {
  report: AttemptReport;
  onNavigate: (tab: string) => void;
}

type ReviewFilter = 'all' | 'incorrect';

const REVIEW_PAGE_SIZE = 20;

export const ReportView: React.FC<ReportViewProps> = ({ report, onNavigate }) => {
  const feedback = useFeedback();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showChapterAnalysis, setShowChapterAnalysis] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [reviewPage, setReviewPage] = useState(0);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const reviewSectionRef = useRef<HTMLElement | null>(null);

  const paper = useMemo(() => resolvePaper(report), [report]);

  const classified = useMemo(() => {
    if (!paper) return [];
    return paper.questions.map((q, index) => ({
      q,
      index,
      status: classifyAnswer(q, paper.answers),
      userAns: paper.answers[q.id],
    }));
  }, [paper]);

  const incorrectCount = useMemo(
    () => classified.filter((row) => row.status === 'wrong').length,
    [classified]
  );

  const filtered = useMemo(() => {
    if (reviewFilter === 'incorrect') {
      return classified.filter((row) => row.status === 'wrong');
    }
    return classified;
  }, [classified, reviewFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / REVIEW_PAGE_SIZE));
  const safePage = Math.min(reviewPage, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * REVIEW_PAGE_SIZE,
    safePage * REVIEW_PAGE_SIZE + REVIEW_PAGE_SIZE
  );

  useEffect(() => {
    setReviewPage(0);
  }, [reviewFilter, report.id]);

  const openReview = (filter: ReviewFilter) => {
    setReviewFilter(filter);
    setReviewPage(0);
    requestAnimationFrame(() => {
      reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(`https://prepx.np/report/share/${report.shareToken}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPdf = async () => {
    const result = downloadQuestionPaperPdf(report);
    if (result.ok === false) {
      await feedback.alert({
        variant: 'error',
        title: 'Download failed',
        message: result.error,
      });
    }
  };

  const statusBadge = (status: 'correct' | 'wrong' | 'skipped') => {
    if (status === 'correct') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
          <AppIcon icon={CheckCircle2} size="btn" />
          Correct
        </span>
      );
    }
    if (status === 'wrong') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
          <AppIcon icon={XCircle} size="btn" />
          Wrong
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
        <AppIcon icon={MinusCircle} size="btn" />
        Skipped
      </span>
    );
  };

  const renderQuestionCard = (
    row: {
      q: Question;
      index: number;
      status: 'correct' | 'wrong' | 'skipped';
      userAns?: 'A' | 'B' | 'C' | 'D';
    },
    displayIndex: number
  ) => {
    const { q, status, userAns } = row;
    return (
      <article
        key={q.id}
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
      >
        <div className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-[10px] font-bold text-slate-500">Q{displayIndex}</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md font-mono text-[10px] uppercase">
              {q.subject}
            </span>
            <span className="text-slate-500 font-semibold truncate">{q.chapter}</span>
          </div>
          {statusBadge(status)}
        </div>

        <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.stem}</p>

        {q.imageUrl ? (
          <img
            src={q.imageUrl}
            alt="Question figure"
            className="max-h-56 w-auto rounded-xl border border-slate-200 object-contain bg-white"
            loading="lazy"
          />
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium pt-1">
          {(['A', 'B', 'C', 'D'] as const).map((key) => {
            const value = q.options[key];
            const isCorrect = q.correctOptionKey != null && key === q.correctOptionKey;
            const isUserWrong = userAns === key && !isCorrect;
            const optionImage = q.optionImages?.[key];
            return (
              <div
                key={key}
                className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 ${
                  isCorrect
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold'
                    : isUserWrong
                      ? 'bg-rose-50/80 border-rose-300 text-rose-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="flex items-start gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                      isCorrect
                        ? 'bg-emerald-600 text-white'
                        : isUserWrong
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="space-y-1.5">
                    <span className="block">{value}</span>
                    {optionImage ? (
                      <img
                        src={optionImage}
                        alt={`Option ${key}`}
                        className="max-h-24 rounded-lg border border-slate-200 bg-white object-contain"
                        loading="lazy"
                      />
                    ) : null}
                  </span>
                </span>
                {isCorrect ? (
                  <span className="text-[9px] font-bold uppercase text-emerald-700 shrink-0">Key</span>
                ) : isUserWrong ? (
                  <span className="text-[9px] font-bold uppercase text-rose-700 shrink-0">Yours</span>
                ) : null}
              </div>
            );
          })}
        </div>

        {q.explanation ? (
          <div>
            <button
              type="button"
              onClick={() =>
                setExpandedExplanations((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
              }
              className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
            >
              {expandedExplanations[q.id] ? 'Hide explanation' : 'Show explanation'}
            </button>
            {expandedExplanations[q.id] ? (
              <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">
                {q.explanation}
              </p>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-2">
            <AppIcon icon={CheckCircle2} size="btn" className="text-emerald-600" />
            <span>Official Scored Report #{report.id.slice(-6)}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {report.mockTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Completed on {report.completedAt} • CEE Negative Marking (-0.25) Applied
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200"
          >
            <AppIcon icon={Share2} size="btn" className="text-slate-600" />
            <span>Share Report</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <AppIcon icon={Download} size="btn" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Hero Performance Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Overall Score</div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {report.overallScore}{' '}
            <span className="text-slate-400 text-base font-normal">/ {report.maxScore}</span>
          </div>
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <AppIcon icon={CheckCircle2} size="btn" />
            <span>Accuracy: {report.accuracyPercentage}%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Target Score Comparison</div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {report.targetGap > 0 ? `-${report.targetGap.toFixed(1)} pts` : 'Target Achieved!'}
          </div>
          <div className="text-[11px] text-slate-500">
            Target: {report.targetScore} / {report.maxScore}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Average Time Per Question</div>
          <div className="text-3xl font-black text-indigo-600 font-mono">
            {report.mistakeAnalysis.speedSecPerQuestion}s
          </div>
          <div className="text-[11px] text-slate-500">
            Total Time: {Math.floor(report.timeSpentSec / 60)} mins
          </div>
        </div>
      </div>

      {/* Subject & Mistake */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Subject-wise Performance
          </h3>

          <div className="space-y-3">
            {report.subjectScores.map((sub, idx) => (
              <div key={idx} className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>{sub.subject}</span>
                  <span className="font-mono text-blue-600">
                    {sub.score} / {sub.total} pts ({sub.accuracy}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${sub.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Mistake & Speed Taxonomy
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-1">
              <div className="text-xs text-rose-800 font-medium">Wrong vs Skipped</div>
              <div className="text-lg font-black text-rose-950 font-mono">
                {report.wrongCount} Wrong / {report.skippedCount} Skipped
              </div>
              <div className="text-[10px] text-rose-700">
                Lost {-0.25 * report.wrongCount} points to negative marking
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-1">
              <div className="text-xs text-amber-800 font-medium">Slow-Correct Questions</div>
              <div className="text-lg font-black text-amber-950 font-mono">
                {report.mistakeAnalysis.slowCorrectCount} Questions
              </div>
              <div className="text-[10px] text-amber-700">Took &gt; 90s per question</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-800">Key Recommendation Strategy:</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {report.recommendations?.[0]
                ? `Priority: ${report.recommendations[0].title}${
                    report.recommendations[0].chapter
                      ? ` (${report.recommendations[0].subject} · ${report.recommendations[0].chapter})`
                      : ''
                  }. Skipping uncertain questions usually beats random guessing under CEE −0.25 marking.`
                : 'Skipping uncertain questions usually beats random guessing under CEE −0.25 marking. Focus revision on your weakest chapters from the analysis below.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => openReview('all')}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer"
            >
              Review all
            </button>
            <button
              type="button"
              onClick={() => openReview('incorrect')}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-[11px] font-bold cursor-pointer"
            >
              Review incorrect
            </button>
          </div>
        </div>
      </div>

      {/* In-browser answer review */}
      <section
        ref={reviewSectionRef}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
        aria-labelledby="browser-review-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 id="browser-review-heading" className="font-bold text-slate-900 text-base">
              Review Mock test
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {paper
                ? reviewFilter === 'incorrect'
                  ? `${filtered.length} incorrect · ${incorrectCount} wrong on paper`
                  : `${filtered.length} shown · ${incorrectCount} incorrect`
                : 'Paper snapshot unavailable for this report'}
            </p>
          </div>
          <div
            role="group"
            aria-label="Review filter"
            className="inline-flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-0.5"
          >
            <button
              type="button"
              onClick={() => setReviewFilter('all')}
              className={`px-3.5 py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                reviewFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setReviewFilter('incorrect')}
              className={`px-3.5 py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                reviewFilter === 'incorrect'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              Incorrect only
            </button>
          </div>
        </div>

        {!paper ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm font-semibold text-slate-800">Question paper data is not saved</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Complete a new mock attempt, then open that report to review answers in the browser or
              download the PDF answer key.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm font-semibold text-emerald-800">No incorrect answers</p>
            <p className="text-xs text-slate-500">
              Switch to <strong>All</strong> to browse the full paper.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {pageItems.map((row) => renderQuestionCard(row, row.index + 1))}
            </div>

            {filtered.length > REVIEW_PAGE_SIZE ? (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={safePage <= 0}
                  onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-mono text-slate-500">
                  Page {safePage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setReviewPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Chapter Breakdown Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 text-base">Detailed Chapter Mastery Analysis</h3>
          {showChapterAnalysis && (
            <button
              onClick={() => setShowChapterAnalysis(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Hide Analysis
            </button>
          )}
        </div>

        {!showChapterAnalysis ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-slate-500 font-semibold max-w-lg mx-auto leading-relaxed">
              Analyze your correct-to-total ratios, individual chapter accuracy percentages, and
              dynamic mastery statuses (Weak, Improving, Strong) across all 20+ physics, chemistry,
              and biology exam topics.
            </p>
            <button
              onClick={() => setShowChapterAnalysis(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <AppIcon icon={BookOpen} size="btn" className="text-cyan-400" />
              <span>Show Detailed Chapter Mastery Report</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto scroll-x-safe">
            <table className="w-full text-left text-xs border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3">Subject</th>
                  <th className="p-3">Chapter</th>
                  <th className="p-3 text-center">Correct / Total</th>
                  <th className="p-3 text-center">Accuracy</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.chapterScores.map((chap, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-3 font-semibold text-slate-800">{chap.subject}</td>
                    <td className="p-3 text-slate-900 font-medium">{chap.chapter}</td>
                    <td className="p-3 text-center font-mono">
                      {chap.correct} / {chap.total}
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{chap.accuracy}%</td>
                    <td className="p-3 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          chap.status === 'Weak'
                            ? 'bg-rose-100 text-rose-800'
                            : chap.status === 'Strong'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {chap.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommended Revision Tasks */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-white text-lg">Personalized Revision Plan</h3>
            <p className="text-xs text-slate-300">Targeted practice tasks derived from weak chapters</p>
          </div>
          <span className="bg-amber-400 text-slate-950 font-bold font-mono text-xs px-3 py-1 rounded-full">
            Earn +15 Coins / Pack
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {report.recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-slate-800/90 rounded-xl border border-slate-700/80 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-amber-300 font-mono">
                <span>
                  {rec.subject} • {rec.chapter}
                </span>
                <span>{rec.estimatedMinutes} Mins</span>
              </div>
              <div className="font-bold text-white text-sm">{rec.title}</div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {rec.questionCount} Questions
                </span>
                <button
                  onClick={() => onNavigate('coins')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Start Revision
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Share Report Tokenized Link</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anyone with this public link can view your overall score and percentile summary without
              accessing your private details.
            </p>

            <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200 font-mono text-xs">
              <input
                type="text"
                readOnly
                value={`https://prepx.np/report/share/${report.shareToken}`}
                className="w-full bg-transparent focus:outline-none text-slate-800 truncate"
              />
              <button
                onClick={handleCopyShare}
                className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg cursor-pointer shrink-0"
              >
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
