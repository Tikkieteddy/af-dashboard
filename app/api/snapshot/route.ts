import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * บันทึก log ว่ามีการสแนป (ภาพถ่ายฝั่ง client) — รับ metadata จาก client
 * client เป็นคนสร้างภาพและส่งอีเมล route นี้แค่บันทึก log
 */
export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const status: "success" | "failed" = body?.status === "failed" ? "failed" : "success";

  await supabase.from("system_logs").insert({
    log_type: "snapshot_taken",
    status,
    message: body?.message ?? "สร้าง snapshot สำเร็จ",
    metadata: {
      triggered_by: user.email,
      manual: body?.manual ?? true,
      ...(body?.metadata ?? {}),
    },
  });

  return NextResponse.json({ ok: true });
}
