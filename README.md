# AF Dashboard

ระบบ Full-Stack Dashboard สำหรับติดตามยอดวิวรายวัน เปรียบเทียบกับเป้าหมาย KPI พร้อมระบบสรุปอีเมลและ snapshot อัตโนมัติ

- ⚡ **Next.js 14** (App Router) + **TypeScript strict**
- 🎨 **Tailwind CSS** + Brand AF (ชมพู #E91E8C / ส้ม #FF6B35)
- 🗄️ **Supabase** (PostgreSQL + Auth + RLS)
- 📊 **Recharts** + **html2canvas** (snapshot)
- ✉️ **Resend** (email)
- ☁️ **Vercel** (deploy + cron)

---

## 📁 โครงสร้างโปรเจกต์

```
af-dashboard/
├── app/
│   ├── (auth)/login/                หน้า Login
│   ├── (app)/
│   │   ├── layout.tsx               Auth guard + Shell
│   │   ├── dashboard/               หน้า Dashboard หลัก
│   │   └── admin/
│   │       ├── data-entry/          กรอกข้อมูล (spreadsheet)
│   │       ├── reports/             System Logs
│   │       ├── settings/            ตั้งค่า snapshot/email
│   │       └── users/               จัดการผู้ใช้
│   └── api/
│       ├── auth/signout/            logout
│       ├── snapshot/                บันทึก snapshot log
│       ├── email/                   ส่งอีเมลทันที
│       ├── cron/snapshot/           Vercel Cron endpoint
│       └── admin/users/             CRUD users (admin only)
├── components/
│   ├── dashboard/                   Gauge, MetricCard, Chart, Table
│   └── layout/                      Sidebar, MobileNav, Logo
├── lib/
│   ├── supabase/                    client/server/middleware/admin
│   ├── auth.ts                      role helpers
│   ├── calculations.ts              สูตรคำนวณ % และ cumulative
│   ├── email-template.tsx           HTML email
│   ├── email.ts                     Resend wrapper
│   ├── snapshot.ts                  html2canvas helper (client)
│   ├── types.ts
│   └── utils.ts
├── supabase/migrations/
│   ├── 0001_init.sql                schema
│   ├── 0002_rls_policies.sql        RLS
│   └── 0003_seed.sql                snapshot_schedule default
├── middleware.ts                    route protection
└── vercel.json                      cron config
```

---

## 🚀 ขั้นตอนการติดตั้ง

### 1) Clone และติดตั้ง dependencies

```bash
git clone https://github.com/Tikkieteddy/af-dashboard.git
cd af-dashboard
npm install
```

### 2) สร้างโปรเจกต์ Supabase

1. ไปที่ [supabase.com](https://supabase.com) → New Project (เลือก region Singapore)
2. ใน **SQL Editor** ให้รัน 3 ไฟล์ตามลำดับ:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_seed.sql`
3. ที่เมนู **Project Settings → API** จดค่า:
   - `Project URL`
   - `anon public key`
   - `service_role key`

### 3) ตั้งค่า Resend (อีเมล)

1. ไปที่ [resend.com](https://resend.com) → สมัครฟรี
2. ที่ **API Keys** สร้าง key ใหม่
3. (แนะนำ) เพิ่ม domain เพื่อให้ส่งจาก `noreply@yourdomain.com` แทน `onboarding@resend.dev`

### 4) สร้างไฟล์ `.env.local`

คัดลอกจาก `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=AF Dashboard <onboarding@resend.dev>

NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=สร้างคำสุ่มยาวๆ
```

### 5) สร้างผู้ใช้ admin คนแรก

หลังรัน migration แล้วระบบจะตั้ง `role = 'viewer'` ให้ user ใหม่อัตโนมัติ — ต้องเลื่อนเป็น `admin` เอง ทำได้ 2 วิธี

**วิธี A — สมัคร user แรกผ่าน Supabase Dashboard:**

1. Supabase → **Authentication → Users** → Add user → ใส่ email+password
2. ไปที่ **Table Editor → user_roles** หาแถวของ user → แก้ `role = 'admin'`

**วิธี B — สมัครผ่านหน้า /login ของแอป (หลัง dev server รัน):**

```sql
-- รันใน Supabase SQL Editor หลังสมัคร user แรกแล้ว
update public.user_roles
set role = 'admin'
where user_id = (select id from auth.users where email = 'your-email@example.com');
```

### 6) วางโลโก้ (ถ้ามี)

วาง `af-logo.png` ที่ `public/af-logo.png` (ไม่บังคับ — มี SVG fallback ให้แล้ว)

### 7) รัน dev server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) → เด้งไปหน้า `/login`

---

## 🔐 ระบบ Role

| Role     | สิทธิ์                                                    |
| -------- | --------------------------------------------------------- |
| `admin`  | ทำได้ทุกอย่าง: จัดการ user, อีเมล, snapshot, ลบข้อมูล      |
| `editor` | ดู Dashboard + กรอก/แก้ข้อมูล + ดู reports                |
| `viewer` | ดู Dashboard อย่างเดียว                                   |

RLS ใช้ฟังก์ชัน `public.current_user_role()` ในฝั่ง DB เป็น source of truth — แม้ middleware ถูก bypass ข้อมูลก็ปลอดภัย

---

## 📊 สูตรคำนวณ (lib/calculations.ts)

```ts
total_view         = cumulative sum ของ view_count เรียงตามวันที่
pct_meet_target    = (view_count / daily_kpi - 1) * 100
pct_overall        = (total_view / kpi_view - 1) * 100
pct_total_view     = (total_view / kpi_view) * 100
```

---

## ☁️ Deploy บน Vercel

1. Push repo ขึ้น GitHub (branch `main`)
2. ไปที่ [vercel.com/new](https://vercel.com/new) → import repo
3. ที่ **Environment Variables** ใส่ค่าเดียวกับ `.env.local`
   (อย่าลืม `NEXT_PUBLIC_APP_URL` เปลี่ยนเป็นโดเมน production)
4. Deploy
5. **Cron**: `vercel.json` ตั้งค่าให้รัน `/api/cron/snapshot` ทุกวัน 01:00 UTC (= 08:00 ตามเวลาไทย)
   - Vercel จะแนบ header `Authorization: Bearer ${CRON_SECRET}` ให้อัตโนมัติ

---

## ✉️ ระบบ Email

- ใช้ **Resend** (ฟรี 100 emails/วัน, 3,000/เดือน)
- จัดการรายชื่อผู้รับที่หน้า **/admin/settings**
- กด **"ส่งอีเมลทันที"** เพื่อยิงทดสอบ (แนบ snapshot ถ้าอยู่หน้า Dashboard)
- Cron จะส่งอีเมลรายวันถ้า `snapshot_schedule.is_active = true`

---

## 📸 ระบบ Snapshot

- ใช้ **html2canvas** ฝั่ง client จับภาพ `#dashboard-snapshot`
- ปุ่ม **"สแนปทันที"** ที่หน้า settings: capture + ดาวน์โหลด PNG + log
- Cron snapshot: บันทึก log + ส่งอีเมล (ไม่มีภาพแนบเพราะ render ฝั่ง server ไม่ได้)
- ถ้าอยากแนบภาพอัตโนมัติ: เปิดหน้า Dashboard แล้วกด **"ส่งอีเมลทันที"** เอง

---

## 🛠️ คำสั่งที่มีให้

```bash
npm run dev         # dev server
npm run build       # production build
npm run start       # start production server
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
```

---

## 📝 หมายเหตุสำคัญ

- โปรเจกต์นี้ **ไม่ใช้ mock data** — ทุกอย่างดึงจาก Supabase
- ใช้ **TypeScript strict mode** ตลอด
- รองรับ responsive: mobile 375px+, tablet 768px+, desktop 1280px+
- รองรับภาษาไทยทั้งหมด พร้อมฟอนต์ **Kanit** + **Inter**

---

© AF Dashboard — Built with Next.js 14 + Supabase
