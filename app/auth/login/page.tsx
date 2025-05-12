import { LoginForm } from "@/components/auth/login-form";

export default function Page() {
  return (
    <div className="flex justify-center items-center p-6 md:p-10 w-full min-h-svh">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
