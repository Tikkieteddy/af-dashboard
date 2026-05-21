-- ============================================================
-- Row Level Security policies
-- ============================================================

alter table public.daily_metrics enable row level security;
alter table public.system_logs enable row level security;
alter table public.email_recipients enable row level security;
alter table public.snapshot_schedule enable row level security;
alter table public.user_roles enable row level security;

-- ---------- daily_metrics ----------
drop policy if exists "metrics_select_all_authed" on public.daily_metrics;
create policy "metrics_select_all_authed"
  on public.daily_metrics for select
  to authenticated
  using (true);

drop policy if exists "metrics_insert_editor_admin" on public.daily_metrics;
create policy "metrics_insert_editor_admin"
  on public.daily_metrics for insert
  to authenticated
  with check (public.is_editor_or_admin());

drop policy if exists "metrics_update_editor_admin" on public.daily_metrics;
create policy "metrics_update_editor_admin"
  on public.daily_metrics for update
  to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

drop policy if exists "metrics_delete_admin" on public.daily_metrics;
create policy "metrics_delete_admin"
  on public.daily_metrics for delete
  to authenticated
  using (public.is_admin());

-- ---------- system_logs ----------
drop policy if exists "logs_select_all_authed" on public.system_logs;
create policy "logs_select_all_authed"
  on public.system_logs for select
  to authenticated
  using (true);

drop policy if exists "logs_insert_all_authed" on public.system_logs;
create policy "logs_insert_all_authed"
  on public.system_logs for insert
  to authenticated
  with check (true);

-- ---------- email_recipients ----------
drop policy if exists "recipients_select_authed" on public.email_recipients;
create policy "recipients_select_authed"
  on public.email_recipients for select
  to authenticated
  using (true);

drop policy if exists "recipients_modify_admin" on public.email_recipients;
create policy "recipients_modify_admin"
  on public.email_recipients for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- snapshot_schedule ----------
drop policy if exists "schedule_select_authed" on public.snapshot_schedule;
create policy "schedule_select_authed"
  on public.snapshot_schedule for select
  to authenticated
  using (true);

drop policy if exists "schedule_modify_admin" on public.snapshot_schedule;
create policy "schedule_modify_admin"
  on public.snapshot_schedule for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- user_roles ----------
drop policy if exists "roles_select_self_or_admin" on public.user_roles;
create policy "roles_select_self_or_admin"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "roles_modify_admin" on public.user_roles;
create policy "roles_modify_admin"
  on public.user_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
