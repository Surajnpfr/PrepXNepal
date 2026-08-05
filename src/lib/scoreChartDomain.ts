/**
 * Relative Y-domain for mock score charts.
 * Zooms to the user's score band so progress feels visible,
 * while axis labels remain absolute marks (not % of 200).
 */

export type ScoreDomain = {
  yMin: number;
  yMax: number;
  ticks: number[];
  /** True when target is above the zoomed band (shown as caption, not a line). */
  targetAboveBand: boolean;
};

function niceStep(range: number): number {
  if (range <= 40) return 5;
  if (range <= 80) return 10;
  if (range <= 160) return 20;
  return 25;
}

function floorTo(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

function ceilTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

/**
 * Build a zoomed Y domain from attempt scores (+ optional target).
 * Absolute score numbers are unchanged — only the plot window changes.
 */
export function computeRelativeScoreDomain(
  scores: number[],
  opts?: { targetScore?: number; examMax?: number; minSpan?: number }
): ScoreDomain {
  const examMax = opts?.examMax ?? 200;
  const minSpan = opts?.minSpan ?? 40;
  const target =
    typeof opts?.targetScore === 'number' && opts.targetScore > 0
      ? opts.targetScore
      : undefined;

  if (scores.length === 0) {
    return { yMin: 0, yMax: examMax, ticks: [0, 50, 100, 150, 200], targetAboveBand: false };
  }

  const dataMin = Math.min(...scores);
  const dataMax = Math.max(...scores);

  // Include target in the band only when it is near the user's scores
  // (otherwise a far target re-flattens the chart against ~200).
  const nearTarget =
    target !== undefined && target <= Math.max(dataMax * 1.35, dataMax + 40);

  const focusMax = nearTarget && target !== undefined ? Math.max(dataMax, target) : dataMax;
  const focusMin = dataMin;

  const rawSpan = Math.max(focusMax - focusMin, 1);
  const pad = Math.max(8, rawSpan * 0.22);

  let yMin = focusMin - pad;
  let yMax = focusMax + pad;

  let span = yMax - yMin;
  if (span < minSpan) {
    const mid = (focusMin + focusMax) / 2;
    yMin = mid - minSpan / 2;
    yMax = mid + minSpan / 2;
    span = minSpan;
  }

  const step = niceStep(span);
  yMin = Math.max(0, floorTo(yMin, step));
  yMax = Math.min(examMax, ceilTo(yMax, step));

  if (yMax <= yMin) {
    yMax = Math.min(examMax, yMin + step);
  }

  // Guarantee at least a few ticks
  const ticks: number[] = [];
  for (let t = yMin; t <= yMax + 1e-9; t += step) {
    ticks.push(Math.round(t * 10) / 10);
  }
  if (ticks.length < 2) {
    ticks.push(yMax);
  }

  const targetAboveBand =
    target !== undefined && !nearTarget && target > yMax;

  return { yMin, yMax, ticks, targetAboveBand };
}
