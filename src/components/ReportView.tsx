import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Download, 
  Share2, 
  BookOpen, 
  Info
} from 'lucide-react';
import { AttemptReport } from '../types';
import { downloadQuestionPaperPdf } from '../lib/downloadQuestionPaperPdf';
import { useFeedback } from './FeedbackProvider';
import { AppIcon } from './ui';
interface ReportViewProps {
  report: AttemptReport;
  onNavigate: (tab: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, onNavigate }) => {
  const feedback = useFeedback();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showChapterAnalysis, setShowChapterAnalysis] = useState(false);

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

        {/* Share & Download PDF Actions */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Score Out of 200 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Overall Score</div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {report.overallScore} <span className="text-slate-400 text-base font-normal">/ {report.maxScore}</span>
          </div>
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <AppIcon icon={CheckCircle2} size="btn" />
            <span>Accuracy: {report.accuracyPercentage}%</span>
          </div>
        </div>

        {/* Card 2: Predicted Rank */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Predicted Rank (CEE Cohort)</div>
          <div className="text-3xl font-black text-blue-600 font-mono">
            #{report.predictedRank}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Band: #{report.rankBand[0]} - #{report.rankBand[1]} ({report.percentile}%ile)
          </div>
        </div>

        {/* Card 3: Target Score Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Target Score Comparison</div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {report.targetGap > 0 ? `-${report.targetGap.toFixed(1)} pts` : 'Target Achieved!'}
          </div>
          <div className="text-[11px] text-slate-500">
            Target: {report.targetScore} / {report.maxScore}
          </div>
        </div>

        {/* Card 4: Speed & Time */}
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

      {/* Methodology Blurb Banner */}
      <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 flex items-start space-x-3 text-xs text-blue-900">
        <AppIcon icon={Info} size="card" className="text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Rank Prediction Methodology:</span>
          <p className="text-blue-800 leading-relaxed">
            Predicted rank is calculated by mapping your score against empirical percentile distributions from historical anonymized attempts of CEE candidates in Nepal. Confidence band reflects sample variance.
          </p>
        </div>
      </div>

      {/* Subject & Chapter Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subject Performance Breakdown */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
            Subject-wise Performance
          </h3>

          <div className="space-y-3">
            {report.subjectScores.map((sub, idx) => (
              <div key={idx} className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>{sub.subject}</span>
                  <span className="font-mono text-blue-600">{sub.score} / {sub.total} pts ({sub.accuracy}%)</span>
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

        {/* Mistake & Speed Analysis */}
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
              <div className="text-[10px] text-amber-700">
                Took &gt; 90s per question
              </div>
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
        </div>
      </div>

      {/* Chapter Breakdown Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 text-base">
            Detailed Chapter Mastery Analysis
          </h3>
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
              Analyze your correct-to-total ratios, individual chapter accuracy percentages, and dynamic mastery statuses (Weak, Improving, Strong) across all 20+ physics, chemistry, and biology exam topics.
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
                    <td className="p-3 text-center font-mono">{chap.correct} / {chap.total}</td>
                    <td className="p-3 text-center font-mono font-bold">{chap.accuracy}%</td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                        chap.status === 'Weak'
                          ? 'bg-rose-100 text-rose-800'
                          : chap.status === 'Strong'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
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
            <div key={rec.id} className="p-4 bg-slate-800/90 rounded-xl border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-300 font-mono">
                <span>{rec.subject} • {rec.chapter}</span>
                <span>{rec.estimatedMinutes} Mins</span>
              </div>
              <div className="font-bold text-white text-sm">{rec.title}</div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-400 font-mono">{rec.questionCount} Questions</span>
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
              Anyone with this public link can view your overall score and percentile summary without accessing your private details.
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
