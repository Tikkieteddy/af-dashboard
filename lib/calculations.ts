import type { DailyMetric, DailyMetricRow } from "./types";

/**
 * คำนวณ cumulative + % ของแต่ละแถวเรียงตามวันที่
 * - total_view: ยอดวิวสะสม
 * - pct_meet_target: (view/daily_kpi - 1) * 100
 * - pct_overall: (total_view/kpi_view - 1) * 100
 * - pct_total_view: total_view/kpi_view * 100
 */
export function calculateMetrics(rows: DailyMetric[]): DailyMetricRow[] {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;

  return sorted.map((row) => {
    cumulative += Number(row.view_count) || 0;
    const dailyKpi = Number(row.daily_kpi) || 0;
    const kpiView = Number(row.kpi_view) || 0;

    const pctMeetTarget =
      dailyKpi > 0 ? (Number(row.view_count) / dailyKpi - 1) * 100 : 0;
    const pctOverall = kpiView > 0 ? (cumulative / kpiView - 1) * 100 : 0;
    const pctTotalView = kpiView > 0 ? (cumulative / kpiView) * 100 : 0;

    return {
      ...row,
      view_count: Number(row.view_count),
      daily_kpi: dailyKpi,
      kpi_view: kpiView,
      total_view: cumulative,
      pct_meet_target: pctMeetTarget,
      pct_overall: pctOverall,
      pct_total_view: pctTotalView,
    };
  });
}

export interface DashboardSummary {
  kpiView: number;
  totalView: number;
  pctOverall: number;
  pctTotalView: number;
  latestRow: DailyMetricRow | null;
  rowsCount: number;
}

export function summarize(rows: DailyMetricRow[]): DashboardSummary {
  if (rows.length === 0) {
    return {
      kpiView: 0,
      totalView: 0,
      pctOverall: -100,
      pctTotalView: 0,
      latestRow: null,
      rowsCount: 0,
    };
  }
  const latest = rows[rows.length - 1];
  return {
    kpiView: latest.kpi_view,
    totalView: latest.total_view,
    pctOverall: latest.pct_overall,
    pctTotalView: latest.pct_total_view,
    latestRow: latest,
    rowsCount: rows.length,
  };
}
