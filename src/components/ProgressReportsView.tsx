import React, { useMemo } from 'react';
import { Award, ChevronRight, ClipboardList } from 'lucide-react';
import type { AttemptReport, UserProfile } from '../types';
import { MockScoreTrendChart } from './MockScoreTrendChart';
import { ReportView } from './ReportView';
import { AppIcon } from './ui';
interface ProgressReportsViewProps {
  pastReports: AttemptReport[];
  activeReport: AttemptReport | null;
  userProfile: UserProfile;
  onSelectReport: (report: AttemptReport) => void;
  onNavigate: (tab: string) => void;
}

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

  if (pastReports.length === 0) {
    return (
      <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl text-center max-w-md mx-4 sm:mx-auto my-12 space-y-4 font-sans">
        <div className="text-slate-900 font-semibold text-lg">No mock attempts yet</div>
        <p className="text-slate-600 text-sm leading-relaxed">
          Finish a timed mock from the catalog to see score trends and chapter reports here.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('catalog')}
          className="min-h-11 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          Open mock catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-full mb-2 border border-blue-100">
            <AppIcon icon={ClipboardList} size="btn" />
            <span>Progress Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Your Mock Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track score trends across all completed mocks, then open any attempt for a full scored report.
          </p>
        </div>
        {summary && (
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-500 font-sans font-semibold block text-[9px] uppercase">Mocks</span>
              <span className="font-bold text-slate-900">{summary.count}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-500 font-sans font-semibold block text-[9px] uppercase">Avg</span>
              <span className="font-bold text-slate-900">{summary.avg}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5">
              <AppIcon icon={Award} size="btn" className="text-amber-500" />
              <div>
                <span className="text-slate-500 font-sans font-semibold block text-[9px] uppercase">Best</span>
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
          <h3 className="font-bold text-slate-900 text-sm">Attempt History</h3>
          <span className="text-[10px] text-slate-500 font-semibold">{pastReports.length} reports</span>
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
                    <div className={`text-xs font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                      {report.mockTitle}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {report.completedAt} · {report.accuracyPercentage}% accuracy · Rank #{report.predictedRank}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-black text-slate-900">
                      {report.overallScore}
                      <span className="text-slate-400 font-normal text-[10px]">/{report.maxScore}</span>
                    </span>
                    <AppIcon icon={ChevronRight} size="btn" className={isActive ? 'text-blue-600' : 'text-slate-300'} />
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
    </div>
  );
};
