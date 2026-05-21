import LoginForm from "./LoginForm";
import Logo from "@/components/layout/Logo";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-af-pink-light via-white to-af-orange-light px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-af-card mb-4 overflow-hidden">
            <Logo size={64} className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-af-navy">AF Dashboard</h1>
          <p className="text-sm text-af-gray-dark mt-1">
            เข้าสู่ระบบเพื่อจัดการข้อมูลยอดวิว
          </p>
        </div>

        <div className="af-card">
          <LoginForm
            redirectTo={searchParams.redirect ?? "/dashboard"}
            initialError={searchParams.error}
          />
        </div>

        <p className="text-center text-xs text-af-gray-dark mt-6">
          © {new Date().getFullYear()} AF Dashboard — Powered by Supabase
        </p>
      </div>
    </div>
  );
}
