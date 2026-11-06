import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import { MenuLateral } from "@/components/layout/menu-lateral";
import { ToastProvider } from "@/components/ui/toast";
import { BotaoSair } from "@/features/auth/botao-sair";
import { UsuarioProvider } from "@/features/auth/usuario";
import { ROTA_LOGIN, sessaoDaArea } from "@/lib/protecao-rotas";
import { COOKIE_TOKEN } from "@/lib/sessao";

// Toda tela autenticada depende do usuário, então o conteúdo inteiro espera a
// leitura do cookie dentro do Suspense (exigido pelo cacheComponents).
async function AreaAutenticada({ children }: { children: ReactNode }) {
  // A validade do token depende da hora atual (Date.now() no sessaoDaArea), que o
  // prerender do cacheComponents não aceita: a área só renderiza na requisição.
  await connection();
  const sessao = sessaoDaArea((await cookies()).get(COOKIE_TOKEN)?.value);
  if (!sessao) redirect(ROTA_LOGIN);
  const { usuario, cargo } = sessao;

  return (
    <UsuarioProvider usuario={usuario}>
      <div className="flex min-h-full flex-1">
        <aside className="flex w-56 shrink-0 flex-col gap-4 border-r border-zinc-200 p-4">
          <p className="text-lg font-semibold text-zinc-900">Academia</p>
          <MenuLateral cargo={cargo} />
          <div className="mt-auto">
            <BotaoSair />
          </div>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </UsuarioProvider>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <Suspense fallback={<p className="p-6 text-sm text-zinc-600">Carregando…</p>}>
        <AreaAutenticada>{children}</AreaAutenticada>
      </Suspense>
    </ToastProvider>
  );
}
