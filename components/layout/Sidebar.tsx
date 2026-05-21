"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import {
  LayoutDashboard,
  TableProperties,
  ScrollText,
  Mail,
  Users,
  Camera,
  LogOut,
} from "lucide-react";
import type { AuthUser } from "@/lib/types";
import { roleBadgeClass, roleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Array<"admin" | "editor" | "viewer">;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "editor", "viewer"],
  },
  {
    href: "/admin/data-entry",
    label: "กรอกข้อมูล",
    icon: TableProperties,
    roles: ["admin", "editor"],
  },
  {
    href: "/admin/reports",
    label: "รายงานระบบ",
    icon: ScrollText,
    roles: ["admin", "editor"],
  },
  {
    href: "/admin/settings",
    label: "Snapshot & อีเมล",
    icon: Camera,
    roles: ["admin"],
  },
  {
    href: "/admin/users",
    label: "ผู้ใช้งาน",
    icon: Users,
    roles: ["admin"],
  },
];

export default function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const items = navItems.filter((i) => i.roles.includes(user.role));

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-gray-100 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl overflow-hidden">
          <Logo size={40} className="w-10 h-10" />
        </div>
        <div>
          <p className="text-sm font-bold text-af-navy leading-none">
            AF Dashboard
          </p>
          <p className="text-[11px] text-af-gray-dark mt-1">
            ติดตามยอดวิวรายวัน
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-af-pink text-white shadow-sm"
                  : "text-af-navy hover:bg-gray-100",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-af-pink to-af-orange text-white flex items-center justify-center font-bold text-sm">
            {(user.name?.[0] ?? user.email[0] ?? "?").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-af-navy truncate">
              {user.name ?? user.email.split("@")[0]}
            </p>
            <span className={roleBadgeClass(user.role)}>
              {roleLabel(user.role)}
            </span>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="af-btn-secondary w-full text-sm"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
