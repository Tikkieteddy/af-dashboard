import { redirect } from "next/navigation";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SpreadsheetTable from "./SpreadsheetTable";
import type { DailyMetric } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DataEntryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canEdit(user)) redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("daily_metrics")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-af-navy">
          กรอกข้อมูลรายวัน
        </h1>
        <p className="text-sm text-af-gray-dark mt-0.5">
          คลิกที่ช่องเพื่อแก้ไข กด Enter ที่แถวสุดท้ายเพื่อเพิ่มแถวใหม่ —
          ระบบจะคำนวณ % แบบ real-time
        </p>
      </div>
      <SpreadsheetTable
        initialRows={(data ?? []) as DailyMetric[]}
        currentUserId={user.id}
      />
    </div>
  );
}
