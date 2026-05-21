export type Role = "admin" | "editor" | "viewer";

export interface DailyMetric {
  id: string;
  date: string;
  view_count: number;
  daily_kpi: number;
  kpi_view: number;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface DailyMetricRow extends DailyMetric {
  total_view: number;
  pct_meet_target: number;
  pct_overall: number;
  pct_total_view: number;
}

export type LogType = "data_entry" | "email_sent" | "snapshot_taken" | "error";
export type LogStatus = "success" | "failed";

export interface SystemLog {
  id: string;
  log_type: LogType;
  status: LogStatus;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface EmailRecipient {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SnapshotSchedule {
  id: string;
  schedule_time: string;
  is_active: boolean;
  timezone: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
}
