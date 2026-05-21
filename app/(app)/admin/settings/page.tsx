import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SettingsView from "./SettingsView";
import type { EmailRecipient, SnapshotSchedule } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const [{ data: schedule }, { data: recipients }] = await Promise.all([
    supabase.from("snapshot_schedule").select("*").maybeSingle(),
    supabase.from("email_recipients").select("*").order("created_at"),
  ]);

  return (
    <SettingsView
      initialSchedule={(schedule ?? null) as SnapshotSchedule | null}
      initialRecipients={(recipients ?? []) as EmailRecipient[]}
    />
  );
}
