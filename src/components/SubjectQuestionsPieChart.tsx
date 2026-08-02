import React, { useMemo } from 'react';
import type { SubjectQuestionCount } from '../lib/questionsApi';

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#2563eb',
  Chemistry: '#0d9488',
  Zoology: '#ca8a04',
  Botany: '#16a34a',
  MAT: '#e11d48',
};

interface SubjectQuestionsPieChartProps {
  bySubject: SubjectQuestionCount[];
  total: number;
  loading?: boolean;
  error?: string | null;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${end.x} ${end.y} A ${r} ${r} 0 ${largeArc} 1 ${start.x} ${start.y} Z`;
}

export const SubjectQuestionsPieChart: React.FC<SubjectQuestionsPieChartProps> = ({
  bySubject,
  total,
  loading,
  error,
}) => {
  const slices = useMemo(() => {
    const active = bySubject.filter((s) => s.count > 0);
    let angle = 0;
    return active.map((row) => {
      const sweep = total > 0 ? (row.count / total) * 360 : 0;
      const startAngle = angle;
      const endAngle = angle + sweep;
      angle = endAngle;
      return { ...row, startAngle, endAngle, color: SUBJECT_COLORS[row.subject] || '#64748b' };
    });
  }, [bySubject, total]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-xs text-slate-500">
        Loading subject distribution…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-5 items-center">
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 180 180" className="w-40 h-40" role="img" aria-label="Questions by subject pie chart">
          {total === 0 ? (
            <circle cx="90" cy="90" r="70" fill="#e2e8f0" />
          ) : slices.length === 1 ? (
            <circle cx="90" cy="90" r="70" fill={slices[0].color} />
          ) : (
            slices.map((slice) => (
              <path
                key={slice.subject}
                d={describeSlice(90, 90, 70, slice.startAngle, slice.endAngle)}
                fill={slice.color}
                stroke="#fff"
                strokeWidth="1.5"
              >
                <title>
                  {slice.subject}: {slice.count}
                </title>
              </path>
            ))
          )}
          <circle cx="90" cy="90" r="38" fill="#fff" />
          <text x="90" y="86" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 18, fontWeight: 800 }}>
            {total}
          </text>
          <text x="90" y="104" textAnchor="middle" className="fill-slate-500" style={{ fontSize: 9, fontWeight: 600 }}>
            questions
          </text>
        </svg>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-900">Questions by subject</h4>
        <p className="text-[11px] text-slate-500">Live inventory from the question database.</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
          {bySubject.map((row) => (
            <li
              key={row.subject}
              className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-100"
            >
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: SUBJECT_COLORS[row.subject] || '#64748b' }}
                />
                {row.subject}
              </span>
              <span className="font-mono font-bold text-slate-900">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
