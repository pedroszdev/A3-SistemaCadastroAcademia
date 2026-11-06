import type { Metadata } from "next";
import { FormLogin } from "@/features/auth/form-login";

export const metadata: Metadata = { title: "Entrar · Academia" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded border border-zinc-200 p-6">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900">Entrar</h1>
        <FormLogin />
      </div>
    </main>
  );
}
