import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendDashboardEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron: เรียกเวลา 08:00 (UTC+7) = 01:00 UTC
 * - บันทึก log "snapshot_taken"
 * - ส่งอีเมลสรุปไปยังผู้รับที่ active
 * Note: cron นี้ไม่สามารถ render หน้าจริงในฝั่ง server ได้
 * จึงสร้างอีเมล HTML แทนภาพ (ภาพจริงให้ใช้ปุ่ม "สแนปทันที" ในแอปเพื่อแนบ image)
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    // เช็คว่ามีการเปิดใช้งาน schedule ไหม
    const { data: schedule } = await supabase
      .from("snapshot_schedule")
      .select("*")
      .order("schedule_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!schedule?.is_active) {
      await supabase.from("system_logs").insert({
        log_type: "snapshot_taken",
        status: "success",
        message: "ข้าม snapshot เพราะปิดใช้งานใน schedule",
        metadata: { cron: true },
      });
      return NextResponse.json({ ok: true, skipped: true });
    }

    // ดึงข้อมูลล่าสุดสำหรับสรุปในเมล
    const { data: rows } = await supabase
      .from("daily_metrics")
      .select("*")
      .order("date", { ascending: true });

    const { data: recipients } = await supabase
      .from("email_recipients")
      .select("*")
      .eq("is_active", true);

    await supabase.from("system_logs").insert({
      log_type: "snapshot_taken",
      status: "success",
      message: "Cron snapshot สำเร็จ",
      metadata: { cron: true, rowCount: rows?.length ?? 0 },
    });

    // ส่งอีเมล
    if (recipients && recipients.length > 0) {
      const result = await sendDashboardEmail({
        rows: rows ?? [],
        recipients: recipients.map((r) => r.email),
        attachmentDataUrl: null,
      });

      await supabase.from("system_logs").insert({
        log_type: "email_sent",
        status: result.ok ? "success" : "failed",
        message: result.ok
          ? `ส่งอีเมลถึง ${recipients.length} คน สำเร็จ`
          : `ส่งอีเมลล้มเหลว: ${result.error}`,
        metadata: { cron: true, count: recipients.length },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("system_logs").insert({
      log_type: "error",
      status: "failed",
      message: `Cron snapshot ผิดพลาด: ${message}`,
      metadata: { cron: true },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
