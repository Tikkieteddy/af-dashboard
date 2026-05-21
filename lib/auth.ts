import "server-only";
import { createSupabaseServerClient } from "./supabase/server";
import type { AuthUser, Role } from "./types";
import { canEdit as canEditRole, isAdminRole } from "./roles";

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
  return canEditRole(user?.role);
}

export function isAdmin(user: AuthUser | null): boolean {
  return isAdminRole(user?.role);
}

export { roleLabel, roleBadgeClass } from "./roles";
