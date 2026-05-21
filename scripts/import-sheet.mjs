/**
 * Import ข้อมูลจาก Google Sheet (public) เข้า daily_metrics
 *
 * วิธีใช้:
 *   SHEET_ID=<id> node scripts/import-sheet.mjs [--baseline <number>] [--kpi-view <number>]
 *
 * Required env (จาก .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(process.cwd(), ".env.local"));

const SHEET_ID =
  process.env.SHEET_ID || "173augU2w8qfSzZSNwmVJ1pEzmOyOVZgiZ6eKkqz52bU";

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}

const BASELINE_VIEW = Number(arg("baseline", "301682700"));
const KPI_VIEW = Number(arg("kpi-view", "1000000000"));
const BASELINE_DATE = arg("baseline-date", "2026-05-10");
const DEFAULT_SOURCE = arg("source", "True Academy Fantasia");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("❌ ไม่พบ env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- CSV parser ---
function parseCsv(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else if (ch === "\r") {
        // skip
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

// --- Date parser: "11 May 26" → "2026-05-11" ---
const monthMap = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function parseDate(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const parts = s.split(/\s+/);
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const m = monthMap[parts[1].toLowerCase()];
  let year = Number(parts[2]);
  if (year < 100) year += 2000;
  if (!day || m === undefined || !year) return null;
  return `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseNum(raw) {
  if (raw === undefined || raw === null) return 0;
  const s = String(raw).replace(/,/g, "").trim();
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

// --- Fetch CSV ---
const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
console.log(`📥 ดึงข้อมูลจาก ${csvUrl}`);

const res = await fetch(csvUrl, { redirect: "follow" });
if (!res.ok) {
  console.error(`❌ fetch ล้มเหลว: HTTP ${res.status}`);
  process.exit(1);
}
const text = await res.text();
const rows = parseCsv(text);
console.log(`✓ อ่าน ${rows.length} แถว (รวม header)`);

const header = rows[0].map((h) => h.trim());
const dataRows = rows
  .slice(1)
  .filter((r) => r.some((c) => String(c).trim() !== ""));

// Map columns by name
const idx = {
  date: header.findIndex((h) => /date/i.test(h)),
  view: header.findIndex((h) => /^view$/i.test(h)),
  dailyKpi: header.findIndex((h) => /daily.*kpi/i.test(h)),
  kpiView: header.findIndex((h) => /kpi.*view/i.test(h)),
};
console.log("📊 column map:", idx);

if (idx.date < 0 || idx.view < 0) {
  console.error("❌ ไม่พบ column Date หรือ View ใน header");
  process.exit(1);
}

// Transform rows
const records = [];
for (const r of dataRows) {
  const date = parseDate(r[idx.date]);
  if (!date) continue;
  const view = parseNum(r[idx.view]);
  if (view <= 0) continue; // ข้ามแถวว่าง (อนาคต)
  const dailyKpi = idx.dailyKpi >= 0 ? parseNum(r[idx.dailyKpi]) : 0;
  records.push({
    date,
    view_count: view,
    daily_kpi: dailyKpi,
    kpi_view: KPI_VIEW,
    source: DEFAULT_SOURCE,
    notes: null,
  });
}

// Prepend baseline row
if (BASELINE_VIEW > 0) {
  records.unshift({
    date: BASELINE_DATE,
    view_count: BASELINE_VIEW,
    daily_kpi: 0,
    kpi_view: KPI_VIEW,
    source: "Historical Baseline",
    notes: `ยอดสะสมก่อนเริ่มติดตามที่ ${BASELINE_DATE} (${BASELINE_VIEW.toLocaleString()} วิว)`,
  });
}

console.log(`📝 เตรียม ${records.length} แถว`);
records.forEach((r) =>
  console.log(
    `  ${r.date} | view=${r.view_count.toLocaleString().padStart(15)} | daily=${r.daily_kpi.toLocaleString().padStart(11)} | src=${r.source}`,
  ),
);

const { error } = await supabase
  .from("daily_metrics")
  .upsert(records, { onConflict: "date" });

if (error) {
  console.error("❌ upsert ล้มเหลว:", error.message);
  process.exit(1);
}

await supabase.from("system_logs").insert({
  log_type: "data_entry",
  status: "success",
  message: `Import ${records.length} แถวจาก Google Sheet`,
  metadata: { source: "google-sheet", sheet_id: SHEET_ID, baseline: BASELINE_VIEW },
});

console.log(`\n✅ Import สำเร็จ ${records.length} แถว`);
console.log("🎉 รีเฟรช Dashboard เพื่อดูผล");
