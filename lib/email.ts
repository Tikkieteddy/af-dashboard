import fs from "node:fs";
import path from "node:path";
import { Resend } from "resend";
import { renderDashboardEmailHtml } from "./email-template";
import type { DailyMetric } from "./types";

interface ResendAttachment {
  filename: string;
  content: string;
  content_id?: string;
}

function loadLogoBase64(): string | null {
  try {
    const file = path.join(process.cwd(), "public", "AF.png");
    if (!fs.existsSync(file)) return null;
    return fs.readFileSync(file).toString("base64");
  } catch {
    return null;
  }
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

  // โลโก้ AF เป็น inline attachment (cid:af-logo)
  let logoCid: string | null = null;
  const logoBase64 = loadLogoBase64();
  if (logoBase64) {
    logoCid = "af-logo";
    attachments.push({
      filename: "af-logo.png",
      content: logoBase64,
      content_id: logoCid,
    });
  }

  // ภาพสแนป dashboard (ถ้ามี) เป็น inline attachment ด้วย
  let snapshotCid: string | null = null;
  if (attachmentDataUrl && attachmentDataUrl.startsWith("data:image/")) {
    const base64 = attachmentDataUrl.split(",")[1];
    if (base64) {
      snapshotCid = "dashboard-snapshot";
      attachments.push({
        filename: "dashboard.png",
        content: base64,
        content_id: snapshotCid,
      });
    }
  }

  const html = renderDashboardEmailHtml({
    rows,
    attachmentCid: snapshotCid,
    logoCid,
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
