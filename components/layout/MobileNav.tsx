"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TableProperties,
  ScrollText,
  Users,
  Camera,
} from "lucide-react";
import type { AuthUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "editor", "viewer"],
  },
  {
    href: "/admin/data-entry",
    label: "กรอก",
    icon: TableProperties,
    roles: ["admin", "editor"],
  },
  {
    href: "/admin/reports",
    label: "รายงาน",
    icon: ScrollText,
    roles: ["admin", "editor"],
  },
  {
    href: "/admin/settings",
    label: "Snapshot",
    icon: Camera,
    roles: ["admin"],
  },
  {
    href: "/admin/users",
    label: "ผู้ใช้",
    icon: Users,
    roles: ["admin"],
  },
] as const;

export default function MobileNav({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const visible = items.filter((i) =>
    (i.roles as readonly string[]).includes(user.role),
  );

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-100">
      <ul className="grid grid-cols-5">
        {visible.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
                  active ? "text-af-pink" : "text-af-gray-dark",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
