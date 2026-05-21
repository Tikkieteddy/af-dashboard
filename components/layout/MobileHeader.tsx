"use client";

import type { AuthUser } from "@/lib/types";
import { roleBadgeClass, roleLabel } from "@/lib/roles";
import { LogOut } from "lucide-react";

export default function MobileHeader({ user }: { user: AuthUser }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-bold text-af-navy leading-none">
            AF Dashboard
          </p>
          <span className={roleBadgeClass(user.role)}>
            {roleLabel(user.role)}
          </span>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="p-2 rounded-lg hover:bg-gray-100 text-af-navy"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
