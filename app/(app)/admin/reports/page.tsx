import { redirect } from "next/navigation";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ReportsView from "./ReportsView";
import type { SystemLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canEdit(user)) redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return <ReportsView initialLogs={(data ?? []) as SystemLog[]} />;
}
