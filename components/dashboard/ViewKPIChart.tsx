"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import type { DailyMetricRow } from "@/lib/types";
import { formatNumber, formatThaiDate } from "@/lib/utils";

export default function ViewKPIChart({ rows }: { rows: DailyMetricRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-af-gray-dark text-sm">
        ยังไม่มีข้อมูล — กรุณาเข้าหน้า กรอกข้อมูล เพื่อเริ่มต้น
      </div>
    );
  }

  const data = rows.map((r) => ({
    date: r.date,
    label: formatThaiDate(r.date, false),
    View: r.view_count,
    "Daily KPI": r.daily_kpi,
  }));

  return (
    <div className="w-full h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 30, right: 24, left: 0, bottom: 8 }}
        >
          <CartesianGrid stroke="#F1F1F4" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#8E8E93" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#8E8E93" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatNumber(v)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#8E8E93" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatNumber(v)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #F1F1F4",
              fontSize: 12,
            }}
            formatter={(v: number) => formatNumber(v)}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.date
                ? formatThaiDate(payload[0].payload.date)
                : ""
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="View"
            stroke="#E91E8C"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#E91E8C" }}
            activeDot={{ r: 6 }}
          >
            <LabelList
              dataKey="View"
              position="top"
              fontSize={10}
              fill="#E91E8C"
              formatter={(v: number) => formatNumber(v)}
            />
          </Line>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Daily KPI"
            stroke="#FF6B35"
            strokeWidth={2.5}
            strokeDasharray="6 3"
            dot={{ r: 4, fill: "#FF6B35" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
