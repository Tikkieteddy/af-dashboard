import type { DailyMetricRow } from "./types";
import { formatThaiDate } from "./utils";

const headers = [
  "วันที่",
  "View",
  "Daily KPI",
  "% ถึงเป้า",
  "Total View",
  "KPI View",
  "%",
  "% Total View",
  "Source",
  "Notes",
];

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: DailyMetricRow[]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        formatThaiDate(r.date),
        r.view_count,
        r.daily_kpi,
        r.pct_meet_target.toFixed(2),
        r.total_view,
        r.kpi_view,
        r.pct_overall.toFixed(2),
        r.pct_total_view.toFixed(2),
        r.source ?? "",
        r.notes ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  // UTF-8 BOM ให้ Excel เปิดภาษาไทยได้
  return "﻿" + lines.join("\n");
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
