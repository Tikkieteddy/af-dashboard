"use client";

import { useMemo, useState } from "react";
import { Download, Filter, ScrollText } from "lucide-react";
import type { LogStatus, LogType, SystemLog } from "@/lib/types";
import { cn, formatThaiDateTime } from "@/lib/utils";

const LOG_TYPE_LABELS: Record<LogType, string> = {
  data_entry: "กรอกข้อมูล",
  email_sent: "ส่งอีเมล",
  snapshot_taken: "สแนปภาพ",
  error: "ข้อผิดพลาด",
};

export default function ReportsView({
  initialLogs,
}: {
  initialLogs: SystemLog[];
}) {
  const [logs] = useState(initialLogs);
  const [typeFilter, setTypeFilter] = useState<"" | LogType>("");
  const [statusFilter, setStatusFilter] = useState<"" | LogStatus>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (typeFilter && l.log_type !== typeFilter) return false;
      if (statusFilter && l.status !== statusFilter) return false;
      if (from && l.created_at < from) return false;
      if (to && l.created_at > to + "T23:59:59") return false;
      return true;
    });
  }, [logs, typeFilter, statusFilter, from, to]);

  // สรุป
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.created_at.startsWith(today));
  const todayCount = todayLogs.length;
  const successRate = (() => {
    const total = logs.length;
    if (!total) return 0;
    return (logs.filter((l) => l.status === "success").length / total) * 100;
  })();
  const lastSnapshot = logs.find(
    (l) => l.log_type === "snapshot_taken" && l.status === "success",
  );
  const lastEmail = logs.find(
    (l) => l.log_type === "email_sent" && l.status === "success",
  );

  function exportCsv() {
    const header = ["created_at", "log_type", "status", "message"];
    const rows = filtered.map((l) => [
      l.created_at,
      l.log_type,
      l.status,
      (l.message ?? "").replace(/[\r\n,]+/g, " "),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `af-dashboard-logs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-af-navy">
            รายงานระบบ
          </h1>
          <p className="text-sm text-af-gray-dark mt-0.5">
            บันทึกกิจกรรมและสถานะของระบบ
          </p>
        </div>
        <button onClick={exportCsv} className="af-btn-secondary">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="งานวันนี้"
          value={`${todayCount} ครั้ง`}
        />
        <SummaryCard
          label="Success rate (รวม)"
          value={`${successRate.toFixed(1)}%`}
        />
        <SummaryCard
          label="สแนปล่าสุด"
          value={
            lastSnapshot ? formatThaiDateTime(lastSnapshot.created_at) : "—"
          }
        />
        <SummaryCard
          label="อีเมลล่าสุด"
          value={lastEmail ? formatThaiDateTime(lastEmail.created_at) : "—"}
        />
      </div>

      {/* Filter */}
      <div className="af-card flex flex-wrap items-end gap-3">
        <Filter className="w-4 h-4 text-af-gray-dark" />
        <div>
          <label className="af-label">ประเภท</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as LogType | "")}
            className="af-input !py-2"
          >
            <option value="">ทั้งหมด</option>
            <option value="data_entry">กรอกข้อมูล</option>
            <option value="email_sent">ส่งอีเมล</option>
            <option value="snapshot_taken">สแนปภาพ</option>
            <option value="error">ข้อผิดพลาด</option>
          </select>
        </div>
        <div>
          <label className="af-label">สถานะ</label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as LogStatus | "")
            }
            className="af-input !py-2"
          >
            <option value="">ทั้งหมด</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
          </select>
        </div>
        <div>
          <label className="af-label">ตั้งแต่</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="af-input !py-2"
          />
        </div>
        <div>
          <label className="af-label">ถึง</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="af-input !py-2"
          />
        </div>
      </div>

      {/* Logs table */}
      <div className="af-card overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left text-xs text-af-gray-dark border-b border-gray-100">
              <th className="px-3 py-3 font-medium">เวลา</th>
              <th className="px-3 py-3 font-medium">ประเภท</th>
              <th className="px-3 py-3 font-medium">สถานะ</th>
              <th className="px-3 py-3 font-medium">ข้อความ</th>
              <th className="px-3 py-3 font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-12 text-center text-af-gray-dark"
                >
                  <ScrollText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  ไม่พบ log ตามเงื่อนไข
                </td>
              </tr>
            )}
            {filtered.map((l) => (
              <tr
                key={l.id}
                className="border-b border-gray-50 align-top hover:bg-af-pink-light/30"
              >
                <td className="px-3 py-3 text-af-navy whitespace-nowrap">
                  {formatThaiDateTime(l.created_at)}
                </td>
                <td className="px-3 py-3">
                  <span className="af-badge-gray">
                    {LOG_TYPE_LABELS[l.log_type]}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      l.status === "success"
                        ? "af-badge-success"
                        : "af-badge-error",
                    )}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-af-navy">{l.message}</td>
                <td className="px-3 py-3 text-xs text-af-gray-dark font-mono max-w-[280px] truncate">
                  {l.metadata ? JSON.stringify(l.metadata) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="af-card">
      <p className="text-xs text-af-gray-dark uppercase tracking-wide">
        {label}
      </p>
      <p className="text-lg font-bold text-af-navy mt-1.5 truncate">{value}</p>
    </div>
  );
}
