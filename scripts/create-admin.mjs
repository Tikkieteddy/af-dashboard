/**
 * สร้าง / promote user เป็น admin
 *
 * วิธีใช้:
 *   ADMIN_EMAIL=x@y.com ADMIN_PASSWORD=secret node scripts/create-admin.mjs
 *   หรือ: node scripts/create-admin.mjs <email> <password> [full_name]
 *
 * ต้องมี .env.local ที่มี NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "❌ ไม่พบ NEXT_PUBLIC_SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ใน .env.local",
  );
  process.exit(1);
}

const email = process.env.ADMIN_EMAIL || process.argv[2];
const password = process.env.ADMIN_PASSWORD || process.argv[3];
const fullName = process.env.ADMIN_NAME || process.argv[4] || "Admin";

if (!email || !password) {
  console.error(
    "❌ ต้องระบุ email/password\nวิธีใช้: node scripts/create-admin.mjs <email> <password> [name]",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId;
const { data: created, error: createErr } =
  await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

if (createErr) {
  if (/already (been registered|registered|exists)/i.test(createErr.message)) {
    const { data: list, error: listErr } =
      await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      console.error("❌ listUsers:", listErr.message);
      process.exit(1);
    }
    const found = list.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!found) {
      console.error("❌ createUser:", createErr.message);
      process.exit(1);
    }
    userId = found.id;
    console.log(`ℹ️  user มีอยู่แล้ว (id=${userId}) — ใช้ user เดิม`);
  } else {
    console.error("❌ createUser:", createErr.message);
    process.exit(1);
  }
} else {
  userId = created.user.id;
  console.log(`✅ สร้าง user สำเร็จ (id=${userId})`);
}

const { error: roleErr } = await supabase
  .from("user_roles")
  .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });

if (roleErr) {
  console.error("❌ upsert role:", roleErr.message);
  process.exit(1);
}

console.log(`✅ ตั้ง role เป็น admin ให้ ${email}`);
console.log("\n🎉 เสร็จเรียบร้อย — เปิด http://localhost:3000 แล้ว login ได้เลย");
