"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Eye, Target, Activity, RefreshCw, Download } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { calculateMetrics, summarize } from "@/lib/calculations";
import { formatNumber, formatPercent, formatThaiDateTime } from "@/lib/utils";
import { rowsToCsv, downloadCsv } from "@/lib/export";
import type { DailyMetric } from "@/lib/types";
import GaugeChart from "@/components/dashboard/GaugeChart";
import MetricCard from "@/components/dashboard/MetricCard";
import ViewKPIChart from "@/components/dashboard/ViewKPIChart";
import DataTable from "@/components/dashboard/DataTable";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import SourceFilter from "@/components/dashboard/SourceFilter";
import Logo from "@/components/layout/Logo";

const REFRESH_INTERVAL = 30_000;

export default function DashboardView({
  initialRows,
  initialError,
}: {
  initialRows: DailyMetric[];
  initialError: string | null;
}) {
  const [rows, setRows] = useState<DailyMetric[]>(initialRows);
  const [error, setError] = useState<string | null>(initialError);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // filters
  const minDate = rows[0]?.date ?? new Date().toISOString().slice(0, 10);
  const maxDate =
    rows[rows.length - 1]?.date ?? new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(minDate);
  const [end, setEnd] = useState(maxDate);
  const [source, setSource] = useState("");

  useEffect(() => {
    // sync filter range when initial data arrives
    if (rows.length > 0) {
      setStart((s) => (s === "" || s < rows[0].date ? rows[0].date : s));
      setEnd((e) =>
        e === "" || e > rows[rows.length - 1].date
          ? rows[rows.length - 1].date
          : e,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRows = useCallback(async () => {
    setRefreshing(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error: err } = await supabase
      .from("daily_metrics")
      .select("*")
      .order("date", { ascending: true });
    setRefreshing(false);
    if (err) {
      setError(err.message);
      return;
    }
    setError(null);
    setRows((data ?? []) as DailyMetric[]);
    setLastUpdated(new Date());
  }, []);

  // auto refresh every 30s
  useEffect(() => {
    const t = setInterval(fetchRows, REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, [fetchRows]);

  const sources = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.source).filter((s): s is string => !!s)),
      ).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (start && r.date < start) return false;
      if (end && r.date > end) return false;
      if (source && r.source !== source) return false;
      return true;
    });
  }, [rows, start, end, source]);

  const computed = useMemo(() => calculateMetrics(filtered), [filtered]);
  const summary = useMemo(() => summarize(computed), [computed]);

  return (
    <div className="space-y-5">
      {/* Controls (refresh) — ไม่อยู่ใน snapshot */}
      <div className="flex items-center justify-end gap-2 text-xs text-af-gray-dark">
        <span>อัพเดทล่าสุด {formatThaiDateTime(lastUpdated)}</span>
        <button
          onClick={fetchRows}
          disabled={refreshing}
          className="af-btn-ghost !p-2"
          aria-label="รีเฟรชข้อมูล"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      <div id="dashboard-snapshot" className="space-y-5">
        {/* Heading: logo + title อยู่แนวเดียวกัน */}
        <div className="flex items-center gap-4">
          <Logo
            variant="full"
            width={160}
            height={68}
            className="h-14 lg:h-16 w-auto shrink-0"
          />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-af-navy leading-none">
              Dashboard
            </h1>
            <p className="text-sm text-af-gray-dark mt-1.5">
              ภาพรวมยอดวิวรายวัน เทียบเป้าหมาย KPI
            </p>
          </div>
        </div>

        {/* Gauge + 3 vertical stacked metric cards */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <div className="af-card flex flex-col">
            <h2 className="text-sm font-semibold text-af-navy mb-2 text-center">
              ความคืบหน้าเทียบ KPI
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <GaugeChart percent={summary.pctTotalView} label="% Achieved" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <MetricCard
              label="KPI View Target"
              value={formatNumber(summary.kpiView)}
              hint="เป้าหมายยอดวิวสะสม"
              accent="orange"
              icon={<Target className="w-5 h-5" />}
              centered
            />
            <MetricCard
              label="Total View"
              value={formatNumber(summary.totalView)}
              hint={`สะสมจากข้อมูล ${summary.rowsCount} วัน`}
              accent="pink"
              icon={<Eye className="w-5 h-5" />}
              centered
            />
            <MetricCard
              label="Overall %"
              value={formatPercent(summary.pctOverall)}
              hint={`คิดเป็น ${summary.pctTotalView.toFixed(2)}% ของเป้า`}
              accent="navy"
              icon={<Activity className="w-5 h-5" />}
              centered
            />
          </div>
        </div>

        {/* Latest daily stats */}
        {summary.latestRow && (
          <div className="af-card">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
              <h2 className="text-sm font-semibold text-af-navy text-center">
                ผลของวันล่าสุด ({summary.latestRow.date})
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DailyStat
                label="View"
                value={formatNumber(summary.latestRow.view_count)}
              />
              <DailyStat
                label="Daily KPI"
                value={formatNumber(summary.latestRow.daily_kpi)}
              />
              <DailyStat
                label="% ถึงเป้า"
                value={formatPercent(summary.latestRow.pct_meet_target)}
                tone={
                  summary.latestRow.pct_meet_target >= 0 ? "good" : "bad"
                }
              />
              <DailyStat
                label="Total View"
                value={formatNumber(summary.latestRow.total_view)}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="af-card flex flex-wrap items-center gap-4">
          <DateRangePicker start={start} end={end} onChange={(s, e) => {
            setStart(s);
            setEnd(e);
          }} />
          <SourceFilter sources={sources} value={source} onChange={setSource} />
        </div>

        {/* Chart */}
        <div className="af-card">
          <h2 className="text-sm font-semibold text-af-navy mb-2">
            View &amp; KPI
          </h2>
          <ViewKPIChart rows={computed} />
        </div>

        {/* Table */}
        <div className="af-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-af-navy">
              ข้อมูลรายวัน
            </h2>
            <button
              onClick={() => {
                const csv = rowsToCsv(computed);
                downloadCsv(
                  csv,
                  `af-dashboard-${new Date().toISOString().slice(0, 10)}.csv`,
                );
              }}
              disabled={computed.length === 0}
              className="af-btn-secondary !py-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <DataTable rows={computed} />
        </div>
      </div>
    </div>
  );
}

function DailyStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 flex flex-col items-center justify-center text-center min-h-[88px]">
      <p className="text-[11px] text-af-gray-dark uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-xl lg:text-2xl font-bold mt-1 ${
          tone === "good"
            ? "text-green-600"
            : tone === "bad"
              ? "text-red-500"
              : "text-af-navy"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
