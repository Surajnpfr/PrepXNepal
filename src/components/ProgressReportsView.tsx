import React, { useMemo } from 'react';
import { Award, ChevronRight, ClipboardList } from 'lucide-react';
import type { AttemptReport, UserProfile } from '../types';
import { MockScoreTrendChart } from './MockScoreTrendChart';
import { ReportView } from './ReportView';
import { AppIcon } from './ui';
import { BrandLogo } from './BrandLogo';
import { REPORTS_FAQS } from '../lib/siteSeo';

interface ProgressReportsViewProps {
  pastReports: AttemptReport[];
  activeReport: AttemptReport | null;
  userProfile: UserProfile;
  onSelectReport: (report: AttemptReport) => void;
  onNavigate: (tab: string) => void;
}

const LAST_REVIEWED = '2026-08-03';

export const ProgressReportsView: React.FC<ProgressReportsViewProps> = ({
  pastReports,
  activeReport,
  userProfile,
  onSelectReport,
  onNavigate,
}) => {
  const selected = activeReport || pastReports[0] || null;

  const summary = useMemo(() => {
    if (pastReports.length === 0) return null;
    const scores = pastReports.map((r) => r.overallScore);
    return {
      count: pastReports.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.max(...scores),
    };
  }, [pastReports]);

  const handleInternalNav = (e: React.MouseEvent<HTMLAnchorElement>, tab: string) => {
    e.preventDefault();
    onNavigate(tab);
  };

  const guideBlock = (
    <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 font-sans">
      <header className="space-y-3">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          Key takeaway for Nepal CEE aspirants
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          CEE mock test performance reports for Nepal entrance prep
        </h1>
        <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
          <strong>PrepX Nepal</strong> is a Nepal CEE (Medical Education Commission) online mock-test
          and entrance-prep platform. A performance report here is a scored, chapter-level review of
          your timed practice exam—built for MBBS / BDS entrance aspirants who need MEC-style
          negative marking (−0.25), accuracy trends, and a clear revision plan after every mock.
        </p>
        <p className="text-xs text-slate-500">
          Published by PrepX Nepal · Kathmandu, Nepal · Last reviewed {LAST_REVIEWED} · Contact{' '}
          <a
            href="mailto:support@prepxnepal.edu.np"
            className="text-blue-700 font-semibold underline underline-offset-2"
          >
            support@prepxnepal.edu.np
          </a>
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
            <BrandLogo size={64} className="shrink-0" alt="PrepX Nepal logo — Nepal CEE mock test platform" />
        <div className="text-sm text-slate-600 leading-relaxed space-y-2">
          <p>
            Use this page after a timed mock to see what to revise next for Nepal CEE (MEC) entrance
            prep.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Built for Nepal CEE / MBBS aspirants and mentors</li>
            <li>Turn each attempt into a chapter revision checklist</li>
            <li>Decide which subject to prioritise before your next timed mock</li>
          </ul>
        </div>
      </div>

      <section className="space-y-3" aria-labelledby="how-reports-work">
        <h2 id="how-reports-work" className="text-xl font-bold text-slate-900">
          How do PrepX Nepal progress reports work?
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          After you submit a timed mock, PrepX Nepal stores an attempt report with overall score,
          accuracy percentage, predicted rank signal, and chapter analytics. Open any attempt below
          to see the full scored breakdown and export a PDF for offline review.
        </p>
        <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-2">
          <li>Complete a timed mock from the catalog under MEC-style timing and marking.</li>
          <li>Return to Progress Reports to compare your score trend against your target.</li>
          <li>Open the weakest chapters, then revise formulas and retake focused practice.</li>
        </ol>
      </section>

      <section className="space-y-3" aria-labelledby="report-vs-rank">
        <h2 id="report-vs-rank" className="text-xl font-bold text-slate-900">
          What should I compare in a CEE mock report?
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Compare overall score, accuracy, and chapter readiness—not vanity streaks. The table below
          summarises what each signal is for.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border border-slate-200 rounded-xl overflow-hidden">
            <caption className="sr-only">
              Comparison of PrepX Nepal report signals for Nepal CEE prep decisions
            </caption>
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="p-3 font-bold">
                  Signal
                </th>
                <th scope="col" className="p-3 font-bold">
                  What it shows
                </th>
                <th scope="col" className="p-3 font-bold">
                  When to act
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-3 font-semibold">Overall score / 200</td>
                <td className="p-3">MEC-style total after −0.25 wrong answers</td>
                <td className="p-3">Track trend vs your target score</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Accuracy %</td>
                <td className="p-3">Correct rate among attempted items</td>
                <td className="p-3">If accuracy drops, slow down guessing</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Chapter readiness</td>
                <td className="p-3">Subject/chapter weak spots</td>
                <td className="p-3">Schedule those chapters in the planner</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Predicted rank signal</td>
                <td className="p-3">Relative standing from the attempt</td>
                <td className="p-3">Use as a progress check, not a final seat forecast</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="reports-faq">
        <h2 id="reports-faq" className="text-xl font-bold text-slate-900">
          Frequently asked questions about CEE performance reports
        </h2>
        <div className="space-y-4">
          {REPORTS_FAQS.map((faq) => (
            <div key={faq.question} className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-base font-bold text-slate-900">{faq.question}</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="related-resources">
        <h2 id="related-resources" className="text-xl font-bold text-slate-900">
          Related PrepX Nepal resources and official CEE context
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Continue with mocks, formulas, or help pages inside PrepX Nepal. For official entrance
          policy and notices, refer to the Medical Education Commission of Nepal.
        </p>
        <ul className="text-sm space-y-2">
          <li>
            <a
              href="/catalog"
              onClick={(e) => handleInternalNav(e, 'catalog')}
              className="text-blue-700 font-semibold underline underline-offset-2"
            >
              Browse the Nepal CEE mock test catalog
            </a>
          </li>
          <li>
            <a
              href="/formulas"
              onClick={(e) => handleInternalNav(e, 'formulas')}
              className="text-blue-700 font-semibold underline underline-offset-2"
            >
              Open the CEE formula library for revision
            </a>
          </li>
          <li>
            <a
              href="/help"
              onClick={(e) => handleInternalNav(e, 'policies')}
              className="text-blue-700 font-semibold underline underline-offset-2"
            >
              Read PrepX Nepal help, terms, and support FAQs
            </a>
          </li>
          <li>
            <a
              href="https://www.mec.gov.np/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 font-semibold underline underline-offset-2"
            >
              Medical Education Commission (MEC) Nepal — official site
            </a>
          </li>
        </ul>
      </section>
    </article>
  );

  if (pastReports.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
        {guideBlock}
        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl text-center max-w-md mx-auto space-y-4">
          <div className="text-slate-900 font-semibold text-lg">No mock attempts yet</div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Finish a timed mock from the catalog to unlock personal score trends and chapter reports
            on this page.
          </p>
          <a
            href="/catalog"
            onClick={(e) => handleInternalNav(e, 'catalog')}
            className="inline-flex min-h-11 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Open mock catalog
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {guideBlock}

      <section className="space-y-6" aria-labelledby="your-analytics">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-full mb-2 border border-blue-100">
              <AppIcon icon={ClipboardList} size="btn" />
              <span>Your PrepX analytics</span>
            </div>
            <h2 id="your-analytics" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Your mock score trend and attempt history
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Track score trends across completed mocks, then open any attempt for a full scored
              report{userProfile.name ? ` for ${userProfile.name}` : ''}.
            </p>
          </div>
          {summary && (
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div className="px-3 py-2 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-sans font-semibold block text-[9px] uppercase">
                  Mocks
                </span>
                <span className="font-bold text-slate-900">{summary.count}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-sans font-semibold block text-[9px] uppercase">
                  Avg
                </span>
                <span className="font-bold text-slate-900">{summary.avg}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5">
                <AppIcon icon={Award} size="btn" className="text-amber-500" />
                <div>
                  <span className="text-slate-500 font-sans font-semibold block text-[9px] uppercase">
                    Best
                  </span>
                  <span className="font-bold text-emerald-700">{summary.best}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <MockScoreTrendChart
          reports={pastReports}
          targetScore={userProfile.targetScore}
          selectedReportId={selected?.id}
          onSelectReport={onSelectReport}
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Attempt history checklist</h3>
            <span className="text-[10px] text-slate-500 font-semibold">
              {pastReports.length} reports
            </span>
          </div>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {pastReports.map((report) => {
              const isActive = selected?.id === report.id;
              return (
                <li key={report.id}>
                  <button
                    type="button"
                    onClick={() => onSelectReport(report)}
                    className={`w-full text-left px-5 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isActive ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold truncate ${
                          isActive ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {report.mockTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {report.completedAt} · {report.accuracyPercentage}% accuracy · Rank #
                        {report.predictedRank}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {report.overallScore}
                        <span className="text-slate-400 font-normal text-[10px]">
                          /{report.maxScore}
                        </span>
                      </span>
                      <AppIcon
                        icon={ChevronRight}
                        size="btn"
                        className={isActive ? 'text-blue-600' : 'text-slate-300'}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {selected && (
          <div className="border-t border-slate-200 pt-2">
            <ReportView report={selected} onNavigate={onNavigate} />
          </div>
        )}
      </section>
    </div>
  );
};
