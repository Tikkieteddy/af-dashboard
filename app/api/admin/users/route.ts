import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

async function assertAdmin() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "unauthorized" };
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (roleRow?.role !== "admin") {
    return { ok: false as const, status: 403, error: "forbidden" };
  }
  return { ok: true as const, user };
}

export async function GET() {
  const guard = await assertAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const admin = createSupabaseAdminClient();
  const { data: usersList, error: usersErr } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }
  const { data: roles } = await admin.from("user_roles").select("*");
  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));

  const merged = usersList.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: (u.user_metadata?.full_name as string | undefined) ?? null,
    role: (roleMap.get(u.id) ?? "viewer") as Role,
    created_at: u.created_at,
    banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
  }));

  return NextResponse.json({ users: merged });
}

export async function POST(request: Request) {
  const guard = await assertAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { email, password, role, name } = (await request.json()) as {
    email: string;
    password?: string;
    role: Role;
    name?: string;
  };
  if (!email) {
    return NextResponse.json({ error: "ต้องระบุ email" }, { status: 400 });
  }
  const admin = createSupabaseAdminClient();

  if (password) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (data.user) {
      await admin.from("user_roles").upsert(
        { user_id: data.user.id, role },
        { onConflict: "user_id" },
      );
    }
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (data.user) {
      await admin.from("user_roles").upsert(
        { user_id: data.user.id, role },
        { onConflict: "user_id" },
      );
    }
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const guard = await assertAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { userId, role, action } = (await request.json()) as {
    userId: string;
    role?: Role;
    action?: "ban" | "unban";
  };
  if (!userId) {
    return NextResponse.json({ error: "ต้องระบุ userId" }, { status: 400 });
  }
  const admin = createSupabaseAdminClient();

  if (role) {
    await admin.from("user_roles").upsert(
      { user_id: userId, role },
      { onConflict: "user_id" },
    );
  }
  if (action === "ban") {
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    });
  } else if (action === "unban") {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  }
  return NextResponse.json({ ok: true });
}
