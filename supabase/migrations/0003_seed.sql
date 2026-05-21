-- ============================================================
-- Seed: ค่าเริ่มต้นสำหรับ snapshot_schedule
-- หมายเหตุ: ไม่ insert daily_metrics — ระบบจะดึงจริงจาก Supabase เท่านั้น
-- ============================================================

insert into public.snapshot_schedule (schedule_time, is_active, timezone)
values ('08:00', true, 'Asia/Bangkok')
on conflict do nothing;
