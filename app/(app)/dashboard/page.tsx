import { createSupabaseServerClient } from "@/lib/supabase/server";
import DashboardView from "./DashboardView";
import type { DailyMetric } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("daily_metrics")
    .select("*")
    .order("date", { ascending: true });

  const rows = (data ?? []) as DailyMetric[];

  return (
    <DashboardView
      initialRows={rows}
      initialError={error?.message ?? null}
    />
  );
}
