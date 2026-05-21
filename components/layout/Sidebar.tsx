"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TableProperties,
  ScrollText,
  Mail,
  Users,
  Camera,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Logo from "./Logo";
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

const STORAGE_KEY = "af-sidebar-collapsed";

export default function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const items = navItems.filter((i) => i.roles.includes(user.role));

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col bg-white border-r border-gray-100 h-screen sticky top-0 transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 py-5 border-b border-gray-100",
          collapsed ? "px-3 justify-center" : "px-5",
        )}
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
          <Logo size={40} className="w-10 h-10" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-af-navy leading-none truncate">
              AF Dashboard
            </p>
            <p className="text-[11px] text-af-gray-dark mt-1">
              ติดตามยอดวิวรายวัน
            </p>
          </div>
        )}
      </div>

      <button
        onClick={toggle}
        aria-label={collapsed ? "ขยาย sidebar" : "พับ sidebar"}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm hover:border-af-pink text-af-gray-dark hover:text-af-pink flex items-center justify-center transition-colors z-10"
      >
        {collapsed ? (
          <ChevronsRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronsLeft className="w-3.5 h-3.5" />
        )}
      </button>

      <nav
        className={cn(
          "flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-colors",
                collapsed
                  ? "justify-center w-12 h-12 mx-auto"
                  : "gap-3 px-3 py-2.5",
                active
                  ? "bg-af-pink text-white shadow-sm"
                  : "text-af-navy hover:bg-gray-100",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-gray-100",
          collapsed ? "p-2" : "p-4",
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-af-pink to-af-orange text-white flex items-center justify-center font-bold text-sm"
              title={`${user.name ?? user.email} — ${roleLabel(user.role)}`}
            >
              {(user.name?.[0] ?? user.email[0] ?? "?").toUpperCase()}
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-10 h-10 rounded-xl text-af-navy hover:bg-gray-100 flex items-center justify-center"
                aria-label="ออกจากระบบ"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-af-pink to-af-orange text-white flex items-center justify-center font-bold text-sm shrink-0">
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
          </>
        )}
      </div>
    </aside>
  );
}
