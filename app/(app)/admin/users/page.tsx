import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import UserManagementView from "./UserManagementView";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  return <UserManagementView currentUserId={user.id} />;
}
