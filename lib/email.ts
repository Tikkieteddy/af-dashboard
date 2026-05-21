import { Resend } from "resend";
import { renderDashboardEmailHtml } from "./email-template";
import type { DailyMetric } from "./types";

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

  let attachments: Array<{ filename: string; content: string }> | undefined;
  let cid: string | null = null;

  if (attachmentDataUrl && attachmentDataUrl.startsWith("data:image/")) {
    const base64 = attachmentDataUrl.split(",")[1];
    if (base64) {
      cid = "dashboard-snapshot";
      attachments = [
        {
          filename: "dashboard.png",
          content: base64,
        },
      ];
    }
  }

  const html = renderDashboardEmailHtml({ rows, attachmentCid: cid });
  const subject = `AF Dashboard — สรุปยอดวิว ${new Date().toLocaleDateString("th-TH")}`;

  try {
    const result = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
      attachments,
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
