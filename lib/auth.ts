import { createSupabaseServerClient } from "./supabase/server";
import type { AuthUser, Role } from "./types";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role: Role = (roleRow?.role as Role) ?? "viewer";

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    name: (user.user_metadata?.full_name as string | undefined) ?? undefined,
  };
}

export function canEdit(user: AuthUser | null): boolean {
  return user?.role === "admin" || user?.role === "editor";
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "admin";
}

export function roleLabel(role: Role): string {
  return { admin: "ผู้ดูแลระบบ", editor: "ผู้บันทึกข้อมูล", viewer: "ผู้ชมข้อมูล" }[
    role
  ];
}

export function roleBadgeClass(role: Role): string {
  return {
    admin: "af-badge-pink",
    editor: "af-badge-orange",
    viewer: "af-badge-gray",
  }[role];
}
