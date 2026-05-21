import nodemailer from "nodemailer";
import { renderDashboardEmailHtml } from "./email-template";
import type { DailyMetric } from "./types";

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
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

function makeTransport() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT ?? "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "ขาด env: SMTP_HOST / SMTP_USER / SMTP_PASS — ตั้งใน .env.local และ Vercel",
    );
  }
  const port = Number(portRaw) || 587;
  const secure = port === 465; // 465 = SSL, 587 = STARTTLS

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
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
  if (recipients.length === 0) {
    return { ok: false, error: "ยังไม่มีรายชื่อผู้รับที่ active" };
  }

  let transporter: nodemailer.Transporter;
  try {
    transporter = makeTransport();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const attachments: MailAttachment[] = [];
  if (attachmentDataUrl && attachmentDataUrl.startsWith("data:image/")) {
    const base64 = attachmentDataUrl.split(",")[1];
    if (base64) {
      attachments.push({
        filename: `dashboard-${new Date().toISOString().slice(0, 10)}.png`,
        content: Buffer.from(base64, "base64"),
        contentType: "image/png",
      });
    }
  }

  const logoUrl = (() => {
    const app = getAppUrl();
    return app ? `${app}/AF.png` : null;
  })();

  const html = renderDashboardEmailHtml({
    rows,
    attachmentCid: attachments.length > 0 ? "snapshot" : null,
    logoUrl,
  });
  const subject = `AF Dashboard — สรุปยอดวิว ${new Date().toLocaleDateString("th-TH")}`;
  const from =
    process.env.SMTP_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    process.env.SMTP_USER ??
    "AF Dashboard <noreply@example.com>";

  try {
    const info = await transporter.sendMail({
      from,
      to: recipients,
      subject,
      html,
      attachments,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
