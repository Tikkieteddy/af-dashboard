import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendDashboardEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const attachmentDataUrl: string | null = body?.snapshotDataUrl ?? null;

  const [{ data: rows }, { data: recipients }] = await Promise.all([
    supabase.from("daily_metrics").select("*").order("date", { ascending: true }),
    supabase.from("email_recipients").select("*").eq("is_active", true),
  ]);

  if (!recipients || recipients.length === 0) {
    return NextResponse.json(
      { error: "ยังไม่มีรายชื่อผู้รับที่ active" },
      { status: 400 },
    );
  }

  const result = await sendDashboardEmail({
    rows: rows ?? [],
    recipients: recipients.map((r) => r.email),
    attachmentDataUrl,
  });

  await supabase.from("system_logs").insert({
    log_type: "email_sent",
    status: result.ok ? "success" : "failed",
    message: result.ok
      ? `ส่งอีเมลถึง ${recipients.length} คน สำเร็จ`
      : `ส่งอีเมลล้มเหลว: ${result.error}`,
    metadata: {
      triggered_by: user.email,
      manual: true,
      with_attachment: !!attachmentDataUrl,
      count: recipients.length,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
