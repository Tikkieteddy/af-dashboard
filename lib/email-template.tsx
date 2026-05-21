import { calculateMetrics, summarize } from "./calculations";
import type { DailyMetric } from "./types";
import { formatNumber, formatPercent, formatThaiDate } from "./utils";

/**
 * HTML template สำหรับอีเมลสรุปยอดวิวรายวัน
 * - ใช้ inline style เพื่อให้อีเมลแสดงผลตรง
 * - หาก attachmentCid ถูกส่ง จะแสดงรูปจาก cid:attachment
 */
export function renderDashboardEmailHtml({
  rows,
  attachmentCid,
  logoCid,
}: {
  rows: DailyMetric[];
  attachmentCid?: string | null;
  logoCid?: string | null;
}): string {
  const enriched = calculateMetrics(rows);
  const summary = summarize(enriched);
  const dateStr = formatThaiDate(new Date());
  const recentRows = enriched.slice(-7).reverse();

  return `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>AF Dashboard Daily</title>
  </head>
  <body style="margin:0;padding:24px;background:#fafafa;font-family:'Kanit','Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(233,30,140,0.08)">
      <div style="background:linear-gradient(135deg,#E91E8C,#FF6B35);color:#fff">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:24px 28px;vertical-align:middle">
              <p style="margin:0;font-size:12px;letter-spacing:1px;opacity:0.85">AF DASHBOARD</p>
              <h1 style="margin:6px 0 0;font-size:22px;font-weight:700">สรุปยอดวิวประจำวัน</h1>
              <p style="margin:6px 0 0;font-size:13px;opacity:0.9">${dateStr}</p>
            </td>
            ${
              logoCid
                ? `<td style="padding:18px 24px;text-align:right;vertical-align:middle;width:150px">
                <img src="cid:${logoCid}" alt="AF Logo" style="height:72px;width:auto;display:inline-block;border:0" />
              </td>`
                : ""
            }
          </tr>
        </table>
      </div>

      <div style="padding:24px 28px">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px">
          <div style="flex:1;min-width:160px;padding:14px;border-radius:12px;background:#FCE4F0">
            <p style="margin:0;font-size:11px;color:#8E8E93">Total View</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1a1a2e">${formatNumber(summary.totalView)}</p>
          </div>
          <div style="flex:1;min-width:160px;padding:14px;border-radius:12px;background:#FFE5DC">
            <p style="margin:0;font-size:11px;color:#8E8E93">KPI View Target</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1a1a2e">${formatNumber(summary.kpiView)}</p>
          </div>
          <div style="flex:1;min-width:160px;padding:14px;border-radius:12px;background:#F5F5F7">
            <p style="margin:0;font-size:11px;color:#8E8E93">Overall %</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:${summary.pctOverall >= 0 ? "#16a34a" : "#ef4444"}">${formatPercent(summary.pctOverall)}</p>
          </div>
        </div>

        ${
          attachmentCid
            ? `<div style="margin:0 -28px 18px;border-top:1px solid #f1f1f4;border-bottom:1px solid #f1f1f4;padding:14px;text-align:center;background:#fafafa">
                <img src="cid:${attachmentCid}" alt="Dashboard snapshot" style="max-width:100%;height:auto;border-radius:8px" />
              </div>`
            : ""
        }

        <h2 style="margin:18px 0 8px;font-size:14px;color:#1a1a2e">ข้อมูล 7 วันล่าสุด</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#FCE4F0;color:#C01876">
              <th style="text-align:left;padding:8px;border-radius:8px 0 0 8px">วันที่</th>
              <th style="text-align:right;padding:8px">View</th>
              <th style="text-align:right;padding:8px">Daily KPI</th>
              <th style="text-align:right;padding:8px">Total View</th>
              <th style="text-align:right;padding:8px;border-radius:0 8px 8px 0">%</th>
            </tr>
          </thead>
          <tbody>
            ${recentRows
              .map(
                (r) => `
              <tr style="border-bottom:1px solid #f1f1f4">
                <td style="padding:8px">${formatThaiDate(r.date)}</td>
                <td style="padding:8px;text-align:right">${formatNumber(r.view_count)}</td>
                <td style="padding:8px;text-align:right;color:#8E8E93">${formatNumber(r.daily_kpi)}</td>
                <td style="padding:8px;text-align:right;font-weight:600">${formatNumber(r.total_view)}</td>
                <td style="padding:8px;text-align:right;color:${r.pct_overall >= 0 ? "#16a34a" : "#ef4444"};font-weight:600">${formatPercent(r.pct_overall)}</td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>

        <p style="margin:22px 0 0;font-size:11px;color:#8E8E93;text-align:center">
          ระบบส่งโดยอัตโนมัติจาก AF Dashboard<br/>
          ดู dashboard เต็มได้ที่ <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "#"}/dashboard" style="color:#E91E8C">เปิด Dashboard</a>
        </p>
      </div>
    </div>
  </body>
</html>`;
}
