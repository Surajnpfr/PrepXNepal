import React, { useMemo, useState } from 'react';
import type { AttemptReport } from '../types';

interface MockScoreTrendChartProps {
  reports: AttemptReport[];
  targetScore?: number;
  selectedReportId?: string;
  onSelectReport?: (report: AttemptReport) => void;
}

function shortDate(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  // localeString fallback: take leading date token if present
  const token = value.split(',')[0]?.trim();
  return token && token.length <= 18 ? token : `Attempt`;
}

function truncate(label: string, max = 14): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/**
 * Line chart of mock attempt scores over time (chronological).
 * Domain source: AttemptReport.overallScore / maxScore from past reports.
 */
export const MockScoreTrendChart: React.FC<MockScoreTrendChartProps> = ({
  reports,
  targetScore,
  selectedReportId,
  onSelectReport,
}) => {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const points = useMemo(() => {
    const chronological = [...reports].reverse();
    return chronological.map((r, index) => ({
      report: r,
      index,
      score: r.overallScore,
      maxScore: r.maxScore || 200,
      label: shortDate(r.completedAt),
      title: r.mockTitle,
    }));
  }, [reports]);

  const stats = useMemo(() => {
    if (points.length === 0) {
      return { avg: 0, best: 0, delta: 0, latest: 0 };
    }
    const scores = points.map((p) => p.score);
    const latest = scores[scores.length - 1];
    const first = scores[0];
    return {
      avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      best: Math.max(...scores),
      delta: Math.round((latest - first) * 10) / 10,
      latest,
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-2">
        <h3 className="font-bold text-slate-900 text-base">Mock Score Analytics</h3>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-md mx-auto">
          Complete mock tests to see your score trend line here.
        </p>
      </div>
    );
  }

  const width = 640;
  const height = 260;
  const pad = { top: 24, right: 20, bottom: 44, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const yMax = Math.max(200, ...points.map((p) => p.maxScore), targetScore || 0);
  const yMin = 0;

  const xAt = (i: number) =>
    points.length === 1
      ? pad.left + plotW / 2
      : pad.left + (i / (points.length - 1)) * plotW;
  const yAt = (score: number) =>
    pad.top + plotH - ((score - yMin) / (yMax - yMin)) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p.score).toFixed(1)}`)
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${xAt(points.length - 1).toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`
      : '';

  const yTicks = [0, 50, 100, 150, 200].filter((t) => t <= yMax);
  const activeId = hoverId || selectedReportId;
  const activePoint = points.find((p) => p.report.id === activeId) || points[points.length - 1];
  const deltaLabel =
    stats.delta > 0 ? `+${stats.delta}` : stats.delta === 0 ? '0' : `${stats.delta}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Mock Score Analytics</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Score trend across {points.length} completed mock{points.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] font-mono">
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wide font-sans font-semibold">Latest</span>
            <span className="font-bold text-slate-900">{stats.latest}</span>
            <span className="text-slate-400"> / {activePoint.maxScore}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wide font-sans font-semibold">Average</span>
            <span className="font-bold text-slate-900">{stats.avg}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wide font-sans font-semibold">Best</span>
            <span className="font-bold text-emerald-700">{stats.best}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wide font-sans font-semibold">Trend</span>
            <span
              className={`font-bold ${
                stats.delta > 0 ? 'text-emerald-700' : stats.delta < 0 ? 'text-rose-700' : 'text-slate-700'
              }`}
            >
              {deltaLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[320px] h-auto"
          role="img"
          aria-label="Line graph of mock test scores over time"
        >
          <defs>
            <linearGradient id="mockScoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => {
            const y = yAt(tick);
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? undefined : '3 4'}
                />
                <text x={pad.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="ui-monospace, monospace">
                  {tick}
                </text>
              </g>
            );
          })}

          {typeof targetScore === 'number' && targetScore > 0 && targetScore <= yMax && (
            <g>
              <line
                x1={pad.left}
                y1={yAt(targetScore)}
                x2={width - pad.right}
                y2={yAt(targetScore)}
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={width - pad.right}
                y={yAt(targetScore) - 4}
                textAnchor="end"
                fontSize="8"
                fill="#b45309"
                fontFamily="ui-sans-serif, system-ui"
                fontWeight="600"
              >
                Target {targetScore}
              </text>
            </g>
          )}

          {points.length > 1 && (
            <>
              <path d={areaPath} fill="url(#mockScoreFill)" />
              <path d={linePath} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}

          {points.map((p) => {
            const cx = xAt(p.index);
            const cy = yAt(p.score);
            const selected = p.report.id === selectedReportId;
            const hovered = p.report.id === hoverId;
            const emphasize = selected || hovered;
            return (
              <g
                key={p.report.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoverId(p.report.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onSelectReport?.(p.report)}
              >
                <circle cx={cx} cy={cy} r={emphasize ? 12 : 10} fill="transparent" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={emphasize ? 5.5 : 4}
                  fill={emphasize ? '#1d4ed8' : '#2563EB'}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={height - 18}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#64748b"
                  fontFamily="ui-monospace, monospace"
                >
                  {truncate(p.label, points.length > 8 ? 8 : 12)}
                </text>
                {(emphasize || points.length <= 6) && (
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#0f172a"
                    fontFamily="ui-monospace, monospace"
                    fontWeight="700"
                  >
                    {p.score}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {activePoint && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="text-slate-600">
            <span className="font-bold text-slate-900">{truncate(activePoint.title, 40)}</span>
            <span className="text-slate-400"> · </span>
            <span className="font-mono">{activePoint.score}/{activePoint.maxScore}</span>
            <span className="text-slate-400"> · </span>
            <span>{activePoint.report.accuracyPercentage}% accuracy</span>
          </div>
          {onSelectReport && (
            <button
              type="button"
              onClick={() => onSelectReport(activePoint.report)}
              className="text-[#2563EB] font-bold hover:underline cursor-pointer self-start sm:self-auto"
            >
              View full report →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
