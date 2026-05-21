import LoginForm from "./LoginForm";
import Logo from "@/components/layout/Logo";
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
          <div className="inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-white shadow-af-card mb-4">
            <Logo
              variant="full"
              width={220}
              height={92}
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-af-navy mt-2">
            AF Dashboard
          </h1>
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
