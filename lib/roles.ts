import type { Role } from "./types";

/** ใช้ได้ทั้ง client + server — ไม่ import next/headers */
export function roleLabel(role: Role): string {
  return {
    admin: "ผู้ดูแลระบบ",
    editor: "ผู้บันทึกข้อมูล",
    viewer: "ผู้ชมข้อมูล",
  }[role];
}

export function roleBadgeClass(role: Role): string {
  return {
    admin: "af-badge-pink",
    editor: "af-badge-orange",
    viewer: "af-badge-gray",
  }[role];
}

export function canEdit(role: Role | null | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === "admin";
}
