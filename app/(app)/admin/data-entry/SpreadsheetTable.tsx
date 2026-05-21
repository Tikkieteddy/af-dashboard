"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Save, Loader2, AlertCircle } from "lucide-react";
import type { DailyMetric } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { calculateMetrics } from "@/lib/calculations";
import {
  formatNumber,
  formatPercent,
  formatThaiDate,
  todayISO,
  cn,
} from "@/lib/utils";

type DraftRow = {
  id: string;
  date: string;
  view_count: number;
  daily_kpi: number;
  kpi_view: number;
  source: string;
  notes: string;
  dirty: boolean;
  isNew: boolean;
  originalId?: string;
};

function toDraft(r: DailyMetric): DraftRow {
  return {
    id: r.id,
    originalId: r.id,
    date: r.date,
    view_count: Number(r.view_count),
    daily_kpi: Number(r.daily_kpi),
    kpi_view: Number(r.kpi_view),
    source: r.source ?? "",
    notes: r.notes ?? "",
    dirty: false,
    isNew: false,
  };
}

function newDraftRow(prefillKpi = 0, prefillKpiView = 0): DraftRow {
  return {
    id: `new-${crypto.randomUUID()}`,
    date: todayISO(),
    view_count: 0,
    daily_kpi: prefillKpi,
    kpi_view: prefillKpiView,
    source: "",
    notes: "",
    dirty: true,
    isNew: true,
  };
}

export default function SpreadsheetTable({
  initialRows,
  currentUserId,
}: {
  initialRows: DailyMetric[];
  currentUserId: string;
}) {
  const [drafts, setDrafts] = useState<DraftRow[]>(initialRows.map(toDraft));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const computed = useMemo(() => {
    const asMetrics: DailyMetric[] = drafts.map((d) => ({
      id: d.id,
      date: d.date,
      view_count: d.view_count,
      daily_kpi: d.daily_kpi,
      kpi_view: d.kpi_view,
      source: d.source || null,
      notes: d.notes || null,
      created_at: "",
      updated_at: "",
      created_by: null,
    }));
    const enriched = calculateMetrics(asMetrics);
    const byId = new Map(enriched.map((r) => [r.id, r]));
    return drafts.map((d) => ({ draft: d, calc: byId.get(d.id) }));
  }, [drafts]);

  const hasDirty = drafts.some((d) => d.dirty);
  const dirtyCount = drafts.filter((d) => d.dirty).length;

  function update<K extends keyof DraftRow>(
    id: string,
    key: K,
    value: DraftRow[K],
  ) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, [key]: value, dirty: true } : d,
      ),
    );
  }

  function addRow() {
    const last = drafts[0];
    setDrafts((prev) => [
      newDraftRow(last?.daily_kpi ?? 0, last?.kpi_view ?? 0),
      ...prev,
    ]);
  }

  function removeRow(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setConfirmDelete(null);
  }

  function validate(): string | null {
    const dates = new Set<string>();
    for (const d of drafts) {
      if (!d.date) return "มีแถวที่ยังไม่ได้ใส่วันที่";
      if (dates.has(d.date))
        return `พบวันที่ซ้ำ: ${d.date} — กรุณาตรวจสอบ`;
      dates.add(d.date);
      if (d.view_count < 0 || d.daily_kpi < 0 || d.kpi_view < 0)
        return "ค่าตัวเลขต้องไม่ติดลบ";
    }
    return null;
  }

  async function handleSave() {
    setMessage(null);
    const err = validate();
    if (err) {
      setMessage({ kind: "err", text: err });
      return;
    }

    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const dirtyDrafts = drafts.filter((d) => d.dirty);

    const payload = dirtyDrafts.map((d) => {
      const base = {
        date: d.date,
        view_count: d.view_count,
        daily_kpi: d.daily_kpi,
        kpi_view: d.kpi_view,
        source: d.source || null,
        notes: d.notes || null,
        created_by: currentUserId,
      };
      return d.isNew ? base : { id: d.originalId, ...base };
    });

    const { error, data } = await supabase
      .from("daily_metrics")
      .upsert(payload, { onConflict: "date" })
      .select();

    // log
    await supabase.from("system_logs").insert({
      log_type: "data_entry",
      status: error ? "failed" : "success",
      message: error
        ? `บันทึกข้อมูลล้มเหลว: ${error.message}`
        : `บันทึกข้อมูล ${dirtyDrafts.length} รายการ สำเร็จ`,
      metadata: { count: dirtyDrafts.length },
    });

    setSaving(false);

    if (error) {
      setMessage({ kind: "err", text: `บันทึกล้มเหลว: ${error.message}` });
      return;
    }

    // reload list
    const fresh = await supabase
      .from("daily_metrics")
      .select("*")
      .order("date", { ascending: false });
    if (fresh.data) setDrafts(fresh.data.map(toDraft));

    setMessage({
      kind: "ok",
      text: `บันทึก ${data?.length ?? dirtyDrafts.length} รายการเรียบร้อย`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={addRow} className="af-btn-secondary">
          <Plus className="w-4 h-4" /> เพิ่มแถวใหม่
        </button>
        <button
          onClick={handleSave}
          disabled={!hasDirty || saving}
          className="af-btn-primary"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          บันทึกข้อมูล {dirtyCount > 0 && `(${dirtyCount})`}
        </button>
        {message && (
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-sm flex items-center gap-2",
              message.kind === "ok"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700",
            )}
          >
            {message.kind === "err" && <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </div>

      <div className="af-card overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="text-left text-xs text-af-gray-dark border-b border-gray-100">
              <th className="px-2 py-2 font-medium w-[150px]">วันที่</th>
              <th className="px-2 py-2 font-medium w-[120px] text-right">
                View
              </th>
              <th className="px-2 py-2 font-medium w-[120px] text-right">
                Daily KPI
              </th>
              <th className="px-2 py-2 font-medium w-[140px] text-right">
                KPI View
              </th>
              <th className="px-2 py-2 font-medium w-[120px] text-right">
                % ถึงเป้า
              </th>
              <th className="px-2 py-2 font-medium w-[140px] text-right">
                Total View
              </th>
              <th className="px-2 py-2 font-medium w-[100px] text-right">%</th>
              <th className="px-2 py-2 font-medium w-[140px]">Source</th>
              <th className="px-2 py-2 font-medium">Notes</th>
              <th className="px-2 py-2 font-medium w-[60px]"></th>
            </tr>
          </thead>
          <tbody>
            {computed.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-10 text-af-gray-dark">
                  ยังไม่มีข้อมูล — กดปุ่ม &quot;เพิ่มแถวใหม่&quot; ด้านบน
                </td>
              </tr>
            )}
            {computed.map(({ draft, calc }, idx) => (
              <tr
                key={draft.id}
                className={cn(
                  "border-b border-gray-50",
                  draft.dirty && "bg-yellow-50",
                )}
              >
                <td className="px-2 py-1.5">
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) => update(draft.id, "date", e.target.value)}
                    className="af-input !py-1.5 text-xs"
                    title={
                      draft.date ? formatThaiDate(draft.date) : undefined
                    }
                  />
                </td>
                <NumCell
                  value={draft.view_count}
                  onChange={(v) => update(draft.id, "view_count", v)}
                  onEnter={() => idx === 0 && addRow()}
                />
                <NumCell
                  value={draft.daily_kpi}
                  onChange={(v) => update(draft.id, "daily_kpi", v)}
                />
                <NumCell
                  value={draft.kpi_view}
                  onChange={(v) => update(draft.id, "kpi_view", v)}
                />
                <td
                  className={cn(
                    "px-2 py-1.5 text-right tabular-nums text-xs font-medium",
                    (calc?.pct_meet_target ?? 0) >= 0
                      ? "text-green-600"
                      : "text-red-500",
                  )}
                >
                  {calc ? formatPercent(calc.pct_meet_target) : "—"}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-xs text-af-navy font-medium">
                  {calc ? formatNumber(calc.total_view) : "—"}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-xs text-af-pink font-medium">
                  {calc ? `${calc.pct_total_view.toFixed(2)}%` : "—"}
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={draft.source}
                    onChange={(e) =>
                      update(draft.id, "source", e.target.value)
                    }
                    className="af-input !py-1.5 text-xs"
                    placeholder="เช่น YouTube"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={draft.notes}
                    onChange={(e) =>
                      update(draft.id, "notes", e.target.value)
                    }
                    className="af-input !py-1.5 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  {confirmDelete === draft.id ? (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => removeRow(draft.id)}
                        className="text-xs text-red-600 font-medium hover:underline"
                      >
                        ยืนยัน
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-af-gray-dark hover:underline"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(draft.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                      aria-label="ลบแถว"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NumCell({
  value,
  onChange,
  onEnter,
}: {
  value: number;
  onChange: (v: number) => void;
  onEnter?: () => void;
}) {
  return (
    <td className="px-2 py-1.5">
      <input
        type="number"
        min="0"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}
        className="af-input !py-1.5 text-xs text-right"
      />
    </td>
  );
}
