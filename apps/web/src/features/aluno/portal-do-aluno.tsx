import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { MenuAluno } from "@/components/layout/menu-aluno";
import { BotaoSair } from "@/features/auth/botao-sair";
import { SessaoEncerrada } from "@/features/auth/sessao-encerrada";
import { UsuarioProvider } from "@/features/auth/usuario";
import {
  ROTA_ALUNO,
  ROTA_LOGIN,
  destinoForaDaArea,
  sessaoDaArea,
} from "@/lib/protecao-rotas";
import { COOKIE_TOKEN } from "@/lib/sessao";
import { buscarPerfilDoAluno } from "./perfil";

// Fica fora do layout para poder ser testado: o layout só envolve isto no Suspense.
export async function PortalDoAluno({ children }: { children: ReactNode }) {
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
              <Link href={ROTA_ALUNO} className="text-xs text-zinc-600 hover:text-zinc-900">
                Academia · Portal do aluno
              </Link>
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
