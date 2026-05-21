"use client";

import type { AuthUser } from "@/lib/types";
import { roleBadgeClass, roleLabel } from "@/lib/auth";
import { LogOut } from "lucide-react";
import Logo from "./Logo";

export default function MobileHeader({ user }: { user: AuthUser }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Logo size={32} className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-af-navy leading-none">
              AF Dashboard
            </p>
            <span className={roleBadgeClass(user.role)}>
              {roleLabel(user.role)}
            </span>
          </div>
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
