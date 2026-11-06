import { cookies } from "next/headers";
import { Suspense } from "react";
import { MenuLateral } from "@/components/layout/menu-lateral";
import { ToastProvider } from "@/components/ui/toast";
import { COOKIE_TOKEN, lerUsuarioDoToken } from "@/lib/sessao";

async function MenuDoUsuario() {
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  const usuario = lerUsuarioDoToken(token);
  const cargo = usuario?.tipo === "FUNCIONARIO" ? usuario.cargo : null;

  return <MenuLateral cargo={cargo} />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <div className="flex min-h-full flex-1">
        <aside className="w-56 shrink-0 border-r border-zinc-200 p-4">
          <p className="mb-4 text-lg font-semibold text-zinc-900">Academia</p>
          <Suspense fallback={null}>
            <MenuDoUsuario />
          </Suspense>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
