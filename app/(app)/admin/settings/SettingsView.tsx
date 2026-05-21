"use client";

import { useState } from "react";
import {
  Camera,
  Mail,
  Plus,
  Trash2,
  Send,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { captureElementAsPng } from "@/lib/snapshot";
import type { EmailRecipient, SnapshotSchedule } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsView({
  initialSchedule,
  initialRecipients,
}: {
  initialSchedule: SnapshotSchedule | null;
  initialRecipients: EmailRecipient[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-af-navy">
          ตั้งค่า Snapshot &amp; อีเมล
        </h1>
        <p className="text-sm text-af-gray-dark mt-0.5">
          กำหนดเวลาส่ง snapshot และจัดการรายชื่อผู้รับ
        </p>
      </div>

      <SnapshotSection initialSchedule={initialSchedule} />
      <RecipientsSection initialRecipients={initialRecipients} />
    </div>
  );
}

function SnapshotSection({
  initialSchedule,
}: {
  initialSchedule: SnapshotSchedule | null;
}) {
  const [schedule, setSchedule] = useState<SnapshotSchedule | null>(
    initialSchedule,
  );
  const [saving, setSaving] = useState(false);
  const [taking, setTaking] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    if (!schedule) return;
    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("snapshot_schedule")
      .upsert({
        id: schedule.id,
        schedule_time: schedule.schedule_time,
        is_active: schedule.is_active,
        timezone: schedule.timezone,
      })
      .select()
      .single();
    setSaving(false);
    setMsg({
      ok: !error,
      text: error ? `บันทึกล้มเหลว: ${error.message}` : "บันทึกการตั้งค่าแล้ว",
    });
  }

  async function snapNow() {
    setTaking(true);
    setMsg(null);
    try {
      const target =
        (document.getElementById("dashboard-snapshot") as HTMLElement | null) ??
        document.body;
      const dataUrl = await captureElementAsPng(target);

      // log
      await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "success",
          message: "Manual snapshot สำเร็จ",
          manual: true,
        }),
      });

      // ดาวน์โหลดทันที
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `af-dashboard-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      setMsg({ ok: true, text: "ดาวน์โหลด snapshot เรียบร้อย" });
    } catch (err) {
      await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "failed",
          message: err instanceof Error ? err.message : String(err),
          manual: true,
        }),
      });
      setMsg({
        ok: false,
        text: `สแนปไม่สำเร็จ: ${err instanceof Error ? err.message : err}`,
      });
    }
    setTaking(false);
  }

  return (
    <div className="af-card">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-af-pink" />
        <h2 className="text-base font-semibold text-af-navy">Snapshot</h2>
      </div>

      {schedule ? (
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="af-label">เวลาส่งรายวัน</label>
            <input
              type="time"
              value={schedule.schedule_time.slice(0, 5)}
              onChange={(e) =>
                setSchedule({
                  ...schedule,
                  schedule_time: `${e.target.value}:00`,
                })
              }
              className="af-input"
            />
          </div>
          <div>
            <label className="af-label">Timezone</label>
            <input
              value={schedule.timezone}
              onChange={(e) =>
                setSchedule({ ...schedule, timezone: e.target.value })
              }
              className="af-input"
            />
          </div>
          <div>
            <label className="af-label">สถานะ</label>
            <button
              onClick={() =>
                setSchedule({ ...schedule, is_active: !schedule.is_active })
              }
              className="af-btn-secondary w-full"
            >
              {schedule.is_active ? (
                <>
                  <ToggleRight className="w-4 h-4 text-af-pink" /> เปิดใช้งาน
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-af-gray-dark" /> ปิดอยู่
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-af-gray-dark mb-3">
          ยังไม่มี schedule — กรุณารัน migration 0003_seed.sql ก่อน
        </p>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={save}
          disabled={!schedule || saving}
          className="af-btn-primary"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          บันทึกตั้งค่า
        </button>
        <button
          onClick={snapNow}
          disabled={taking}
          className="af-btn-secondary"
        >
          {taking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          สแนปทันที (ดาวน์โหลด)
        </button>
        <SendNowButton />
      </div>

      {msg && (
        <p
          className={cn(
            "text-xs mt-3",
            msg.ok ? "text-green-600" : "text-red-600",
          )}
        >
          {msg.text}
        </p>
      )}

      <p className="text-[11px] text-af-gray-dark mt-4">
        หมายเหตุ: หน้านี้สแนปจาก Dashboard ที่ id=&quot;dashboard-snapshot&quot;
        ของแอป — เปิดหน้า Dashboard ก่อนกดเพื่อให้ได้ภาพล่าสุด
      </p>
    </div>
  );
}

function SendNowButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function sendNow() {
    setLoading(true);
    setMsg(null);
    try {
      // เก็บภาพถ้ามี dashboard อยู่ในหน้า ไม่งั้นส่ง html อย่างเดียว
      let snapshotDataUrl: string | null = null;
      const target = document.getElementById("dashboard-snapshot");
      if (target) {
        try {
          snapshotDataUrl = await captureElementAsPng(target as HTMLElement);
        } catch {
          snapshotDataUrl = null;
        }
      }
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotDataUrl }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: body?.error ?? "ส่งล้มเหลว" });
      } else {
        setMsg({ ok: true, text: "ส่งอีเมลเรียบร้อย" });
      }
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof Error ? err.message : String(err),
      });
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={sendNow}
        disabled={loading}
        className="af-btn-secondary"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        ส่งอีเมลทันที
      </button>
      {msg && (
        <span
          className={cn(
            "text-xs",
            msg.ok ? "text-green-600" : "text-red-600",
          )}
        >
          {msg.text}
        </span>
      )}
    </>
  );
}

function RecipientsSection({
  initialRecipients,
}: {
  initialRecipients: EmailRecipient[];
}) {
  const [recipients, setRecipients] =
    useState<EmailRecipient[]>(initialRecipients);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("email_recipients")
      .select("*")
      .order("created_at");
    setRecipients((data ?? []) as EmailRecipient[]);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("email_recipients")
      .insert({ email, name: name || null, is_active: true });
    setEmail("");
    setName("");
    await refresh();
    setBusy(false);
  }

  async function toggle(r: EmailRecipient) {
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("email_recipients")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    await refresh();
  }

  async function remove(id: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("email_recipients").delete().eq("id", id);
    await refresh();
  }

  return (
    <div className="af-card">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-af-pink" />
        <h2 className="text-base font-semibold text-af-navy">
          รายชื่อผู้รับอีเมล
        </h2>
      </div>

      <form
        onSubmit={add}
        className="grid md:grid-cols-[1fr_1fr_auto] gap-3 mb-5"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="af-input"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อ (ทางเลือก)"
          className="af-input"
        />
        <button type="submit" disabled={busy} className="af-btn-primary">
          <Plus className="w-4 h-4" /> เพิ่ม
        </button>
      </form>

      <div className="space-y-2">
        {recipients.length === 0 && (
          <p className="text-sm text-af-gray-dark text-center py-6">
            ยังไม่มีผู้รับ — เพิ่มอีเมลด้านบนเพื่อเริ่มต้น
          </p>
        )}
        {recipients.map((r) => (
          <div
            key={r.id}
            className={cn(
              "flex items-center justify-between gap-3 p-3 rounded-xl border",
              r.is_active
                ? "border-af-pink-light bg-white"
                : "border-gray-100 bg-gray-50 opacity-60",
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-af-navy truncate">
                {r.email}
              </p>
              {r.name && (
                <p className="text-xs text-af-gray-dark">{r.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggle(r)}
                className="af-btn-ghost !py-1.5 !px-2 text-xs"
                aria-label={r.is_active ? "ปิดการส่ง" : "เปิดการส่ง"}
              >
                {r.is_active ? (
                  <ToggleRight className="w-4 h-4 text-af-pink" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-af-gray-dark" />
                )}
              </button>
              <button
                onClick={() => remove(r.id)}
                className="af-btn-ghost !py-1.5 !px-2 text-red-500"
                aria-label="ลบ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
