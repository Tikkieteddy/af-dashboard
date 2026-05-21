import { Resend } from "resend";
import { renderDashboardEmailHtml } from "./email-template";
import type { DailyMetric } from "./types";

interface ResendAttachment {
  filename: string;
  content: string;
}

/** URL ที่ public/AF.png เข้าถึงได้จากภายนอก (ใช้ใน <img> ของอีเมล) */
function getAppUrl(): string | null {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return null;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendDashboardEmail({
  rows,
  recipients,
  attachmentDataUrl,
}: {
  rows: DailyMetric[];
  recipients: string[];
  attachmentDataUrl: string | null;
}): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY ไม่ได้ตั้งค่า" };
  }
  if (recipients.length === 0) {
    return { ok: false, error: "ยังไม่มีรายชื่อผู้รับที่ active" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from =
    process.env.RESEND_FROM_EMAIL ?? "AF Dashboard <onboarding@resend.dev>";

  const attachments: ResendAttachment[] = [];

  // โลโก้ AF: ใช้ absolute URL ผ่าน NEXT_PUBLIC_APP_URL หรือ VERCEL_URL
  const appUrl = getAppUrl();
  const logoUrl = appUrl ? `${appUrl}/AF.png` : null;

  // ภาพสแนป dashboard (ถ้ามี) เป็น attachment
  let snapshotCid: string | null = null;
  if (attachmentDataUrl && attachmentDataUrl.startsWith("data:image/")) {
    const base64 = attachmentDataUrl.split(",")[1];
    if (base64) {
      snapshotCid = "dashboard-snapshot";
      attachments.push({
        filename: "dashboard.png",
        content: base64,
      });
    }
  }

  const html = renderDashboardEmailHtml({
    rows,
    attachmentCid: snapshotCid,
    logoUrl,
  });
  const subject = `AF Dashboard — สรุปยอดวิว ${new Date().toLocaleDateString("th-TH")}`;

  try {
    const result = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
