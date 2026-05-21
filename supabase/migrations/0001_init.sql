-- ============================================================
-- AF Dashboard — Supabase initial schema
-- รันไฟล์นี้ผ่าน Supabase SQL Editor หรือ supabase db push
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) daily_metrics : ข้อมูล view รายวัน
-- ------------------------------------------------------------
create table if not exists public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  view_count bigint not null default 0 check (view_count >= 0),
  daily_kpi bigint not null default 0 check (daily_kpi >= 0),
  kpi_view bigint not null default 0 check (kpi_view >= 0),
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists daily_metrics_date_idx on public.daily_metrics(date desc);

-- ------------------------------------------------------------
-- 2) system_logs : บันทึกกิจกรรม
-- ------------------------------------------------------------
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  log_type text not null check (log_type in ('data_entry','email_sent','snapshot_taken','error')),
  status text not null check (status in ('success','failed')),
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_logs_created_at_idx on public.system_logs(created_at desc);
create index if not exists system_logs_type_idx on public.system_logs(log_type);

-- ------------------------------------------------------------
-- 3) email_recipients
-- ------------------------------------------------------------
create table if not exists public.email_recipients (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4) snapshot_schedule
-- ------------------------------------------------------------
create table if not exists public.snapshot_schedule (
  id uuid primary key default gen_random_uuid(),
  schedule_time time not null default '08:00',
  is_active boolean not null default true,
  timezone text not null default 'Asia/Bangkok'
);

-- ------------------------------------------------------------
-- 5) user_roles
-- ------------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor','viewer')) default 'viewer',
  created_at timestamptz not null default now()
);

create index if not exists user_roles_user_id_idx on public.user_roles(user_id);

-- ------------------------------------------------------------
-- 6) Helper function: เช็ค role ของ user ปัจจุบัน
-- ------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin','editor'), false);
$$;

-- ------------------------------------------------------------
-- 7) Triggers : update updated_at
-- ------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_daily_metrics on public.daily_metrics;
create trigger set_updated_at_daily_metrics
  before update on public.daily_metrics
  for each row execute function public.tg_set_updated_at();

-- ------------------------------------------------------------
-- 8) Trigger : auto-assign role 'viewer' ตอน user สมัครใหม่
-- ------------------------------------------------------------
create or replace function public.tg_auto_assign_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'viewer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_auto_assign_role();
