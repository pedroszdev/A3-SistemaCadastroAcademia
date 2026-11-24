import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import { CartaoUsuario } from "@/components/layout/cartao-usuario";
import { Marca } from "@/components/layout/marca";
import { MenuLateral } from "@/components/layout/menu-lateral";
import { ToastProvider } from "@/components/ui/toast";
import { BotaoSair } from "@/features/auth/botao-sair";
import { UsuarioProvider } from "@/features/auth/usuario";
import { ROTA_LOGIN, destinoForaDaArea, sessaoDaArea } from "@/lib/protecao-rotas";
import { COOKIE_TOKEN } from "@/lib/sessao";

// Toda tela autenticada depende do usuário, então o conteúdo inteiro espera a
// leitura do cookie dentro do Suspense (exigido pelo cacheComponents).
async function AreaAutenticada({ children }: { children: ReactNode }) {
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  // A validade do token usa Date.now(); o connection() deixa essa leitura só para
  // a hora do request, fora do prerender (senão o Next acusa "Blocking Route").
  await connection();
  const sessao = sessaoDaArea(token);
  if (!sessao) redirect(ROTA_LOGIN);
  const destino = destinoForaDaArea("FUNCIONARIO", sessao.usuario);
  if (destino) redirect(destino);
  const { usuario, cargo } = sessao;

  return (
    <UsuarioProvider usuario={usuario}>
      <div className="flex min-h-full flex-1 flex-col md:flex-row">
        <aside className="flex shrink-0 flex-col gap-8 bg-tinta px-4 py-6 md:sticky md:top-0 md:h-screen md:w-[248px] md:overflow-y-auto">
          <div className="px-1.5">
            <Marca />
          </div>
          <MenuLateral cargo={cargo} />
          {cargo ? <CartaoUsuario cargo={cargo} acao={<BotaoSair compacto />} /> : <BotaoSair />}
        </aside>
        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 pt-8 pb-12 md:px-10">
          {children}
        </main>
      </div>
    </UsuarioProvider>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <Suspense fallback={<p className="p-6 text-sm text-suave">Carregando…</p>}>
        <AreaAutenticada>{children}</AreaAutenticada>
      </Suspense>
    </ToastProvider>
  );
}
