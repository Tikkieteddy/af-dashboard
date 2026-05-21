"use client";

import type { DailyMetricRow } from "@/lib/types";
import { formatNumber, formatPercent, formatThaiDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DataTable({ rows }: { rows: DailyMetricRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-af-gray-dark text-sm">
        ยังไม่มีข้อมูลในช่วงเวลาที่เลือก
      </div>
    );
  }

  const reversed = [...rows].reverse();

  return (
    <div className="overflow-x-auto -mx-5 lg:mx-0">
      <table className="w-full text-sm min-w-[860px]">
        <thead>
          <tr className="text-left text-xs text-af-gray-dark border-b border-gray-100">
            <th className="px-3 py-3 font-medium">วันที่</th>
            <th className="px-3 py-3 font-medium text-right">View</th>
            <th className="px-3 py-3 font-medium text-right">Daily KPI</th>
            <th className="px-3 py-3 font-medium text-right">% ถึงเป้า</th>
            <th className="px-3 py-3 font-medium text-right">Total View</th>
            <th className="px-3 py-3 font-medium text-right">KPI View</th>
            <th className="px-3 py-3 font-medium text-right">%</th>
            <th className="px-3 py-3 font-medium text-right">% Total View</th>
          </tr>
        </thead>
        <tbody>
          {reversed.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-50 hover:bg-af-pink-light/40 transition-colors"
            >
              <td className="px-3 py-3 text-af-navy whitespace-nowrap">
                {formatThaiDate(row.date)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {formatNumber(row.view_count)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-af-gray-dark">
                {formatNumber(row.daily_kpi)}
              </td>
              <td
                className={cn(
                  "px-3 py-3 text-right font-medium tabular-nums",
                  row.pct_meet_target >= 0 ? "text-green-600" : "text-red-500",
                )}
              >
                {formatPercent(row.pct_meet_target)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums font-medium text-af-navy">
                {formatNumber(row.total_view)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-af-gray-dark">
                {formatNumber(row.kpi_view)}
              </td>
              <td
                className={cn(
                  "px-3 py-3 text-right font-medium tabular-nums",
                  row.pct_overall >= 0 ? "text-green-600" : "text-red-500",
                )}
              >
                {formatPercent(row.pct_overall)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-af-pink font-medium">
                {row.pct_total_view.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
