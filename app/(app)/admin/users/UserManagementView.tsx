"use client";

import { useEffect, useState } from "react";
import {
  UserPlus,
  Loader2,
  Mail,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { roleBadgeClass, roleLabel } from "@/lib/auth";
import { formatThaiDateTime } from "@/lib/utils";
import type { Role } from "@/lib/types";

type ApiUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
  created_at: string;
  banned: boolean;
};

export default function UserManagementView({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [mode, setMode] = useState<"invite" | "create">("create");

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/users");
    const body = await res.json();
    if (!res.ok) {
      setError(body?.error ?? "โหลดข้อมูลผู้ใช้ล้มเหลว");
    } else {
      setUsers(body.users as ApiUser[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload: Record<string, unknown> = {
      email: inviteEmail,
      role: inviteRole,
      name: inviteName || undefined,
    };
    if (mode === "create") payload.password = invitePassword;

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(body?.error ?? "ทำรายการล้มเหลว");
      return;
    }
    setInviteEmail("");
    setInviteName("");
    setInvitePassword("");
    setInviteRole("viewer");
    load();
  }

  async function changeRole(userId: string, role: Role) {
    setBusy(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setBusy(false);
    load();
  }

  async function setBan(userId: string, action: "ban" | "unban") {
    setBusy(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    setBusy(false);
    load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-af-navy">
          ผู้ใช้งาน
        </h1>
        <p className="text-sm text-af-gray-dark mt-0.5">
          จัดการผู้ใช้, role และสิทธิ์การเข้าถึง
        </p>
      </div>

      <div className="af-card">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-5 h-5 text-af-pink" />
          <h2 className="text-base font-semibold text-af-navy">
            เพิ่มผู้ใช้ใหม่
          </h2>
        </div>

        <div className="flex gap-2 mb-3 text-xs">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`af-btn-ghost !py-1.5 ${mode === "create" ? "bg-af-pink-light text-af-pink-dark" : ""}`}
          >
            สร้างพร้อมรหัสผ่าน
          </button>
          <button
            type="button"
            onClick={() => setMode("invite")}
            className={`af-btn-ghost !py-1.5 ${mode === "invite" ? "bg-af-pink-light text-af-pink-dark" : ""}`}
          >
            <Mail className="w-3.5 h-3.5" /> เชิญทางอีเมล
          </button>
        </div>

        <form onSubmit={add} className="grid md:grid-cols-5 gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            className="af-input md:col-span-2"
          />
          <input
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="ชื่อ"
            className="af-input"
          />
          {mode === "create" && (
            <input
              required
              type="password"
              minLength={6}
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              placeholder="รหัสผ่าน ≥ 6 ตัว"
              className="af-input"
            />
          )}
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            className="af-input"
          >
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
          <button
            disabled={busy}
            className="af-btn-primary md:col-span-5 md:w-auto md:justify-self-start"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {mode === "create" ? "สร้างผู้ใช้" : "ส่งคำเชิญ"}
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-600 mt-3">{error}</p>
        )}
      </div>

      <div className="af-card overflow-x-auto">
        <h2 className="text-base font-semibold text-af-navy mb-3">
          รายชื่อผู้ใช้
        </h2>
        {loading ? (
          <div className="text-center py-10 text-af-gray-dark">
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            <p className="text-sm mt-2">กำลังโหลด...</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-af-gray-dark border-b border-gray-100">
                <th className="px-3 py-3 font-medium">อีเมล</th>
                <th className="px-3 py-3 font-medium">ชื่อ</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">สร้างเมื่อ</th>
                <th className="px-3 py-3 font-medium">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 hover:bg-af-pink-light/30"
                  >
                    <td className="px-3 py-3 text-af-navy">
                      {u.email}{" "}
                      {isSelf && (
                        <span className="text-[10px] text-af-pink">(คุณ)</span>
                      )}
                      {u.banned && (
                        <span className="ml-2 af-badge-error">banned</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-af-gray-dark">
                      {u.name ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span className={roleBadgeClass(u.role)}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-af-gray-dark">
                      {formatThaiDateTime(u.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          disabled={isSelf || busy}
                          value={u.role}
                          onChange={(e) =>
                            changeRole(u.id, e.target.value as Role)
                          }
                          className="af-input !py-1.5 !px-2 text-xs w-auto"
                        >
                          <option value="viewer">viewer</option>
                          <option value="editor">editor</option>
                          <option value="admin">admin</option>
                        </select>
                        {u.banned ? (
                          <button
                            disabled={busy}
                            onClick={() => setBan(u.id, "unban")}
                            className="af-btn-ghost !py-1.5 !px-2 text-xs text-green-600"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> เปิดใช้
                          </button>
                        ) : (
                          <button
                            disabled={isSelf || busy}
                            onClick={() => setBan(u.id, "ban")}
                            className="af-btn-ghost !py-1.5 !px-2 text-xs text-red-600"
                          >
                            <Ban className="w-3.5 h-3.5" /> ปิดใช้
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-af-gray-dark"
                  >
                    ยังไม่มีผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
