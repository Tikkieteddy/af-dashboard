import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import MobileHeader from "./MobileHeader";
import Footer from "./Footer";
import type { AuthUser } from "@/lib/types";

export default function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader user={user} />
        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-7 pb-24 lg:pb-7 max-w-[1600px] mx-auto w-full">
          {children}
          <Footer />
        </main>
        <MobileNav user={user} />
      </div>
    </div>
  );
}
