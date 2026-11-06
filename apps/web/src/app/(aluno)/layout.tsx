import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import { MenuAluno } from "@/components/layout/menu-aluno";
import { ToastProvider } from "@/components/ui/toast";
import { BotaoSair } from "@/features/auth/botao-sair";
import { SessaoEncerrada } from "@/features/auth/sessao-encerrada";
import { UsuarioProvider } from "@/features/auth/usuario";
import { buscarPerfilDoAluno } from "@/features/aluno/perfil";
import { ROTA_LOGIN, destinoForaDaArea, sessaoDaArea } from "@/lib/protecao-rotas";
import { COOKIE_TOKEN } from "@/lib/sessao";

// Mesma estrutura da área do funcionário: o conteúdo espera a leitura do cookie
// dentro do Suspense (exigido pelo cacheComponents).
async function PortalDoAluno({ children }: { children: ReactNode }) {
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  // A validade do token usa Date.now(); o connection() deixa essa leitura só para
  // a hora do request, fora do prerender (senão o Next acusa "Blocking Route").
  await connection();
  const sessao = sessaoDaArea(token);
  if (!sessao || !token) redirect(ROTA_LOGIN);
  const destino = destinoForaDaArea("ALUNO", sessao.usuario);
  if (destino) redirect(destino);
  const { nome, semAcesso } = await buscarPerfilDoAluno(token);
  if (semAcesso) return <SessaoEncerrada />;

  return (
    <UsuarioProvider usuario={sessao.usuario}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="border-b border-zinc-200">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-3">
            <div className="min-w-0">
              <p className="text-xs text-zinc-600">Academia · Portal do aluno</p>
              <p className="truncate text-base font-semibold text-zinc-900">
                {nome ?? "Aluno"}
              </p>
            </div>
            <BotaoSair />
          </div>
          <div className="mx-auto w-full max-w-3xl px-4">
            <MenuAluno />
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 p-4">{children}</main>
      </div>
    </UsuarioProvider>
  );
}

export default function AlunoLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <Suspense fallback={<p className="p-4 text-sm text-zinc-600">Carregando…</p>}>
        <PortalDoAluno>{children}</PortalDoAluno>
      </Suspense>
    </ToastProvider>
  );
}
