import LoginForm from "./LoginForm";
import Footer from "@/components/layout/Footer";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-af-pink-light via-white to-af-orange-light px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
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

        <Footer />
      </div>
    </div>
  );
}
