"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { classesDoBotao } from "@/components/ui/button";
import { Cartao } from "@/components/ui/cartao";
import { Icone, type NomeIcone } from "@/components/ui/icone";
import { useUsuario } from "@/features/auth/usuario";
import { podeRegistrarAtividade } from "@/features/historico/api";
import { podeGerenciarMembros } from "@/features/membros/permissoes";
import { temAcessoFinanceiro } from "@/lib/menu";
import {
  type MembroInadimplente,
  type ResumoDashboard,
  buscarInadimplentes,
  buscarResumo,
} from "./api";
import { CardsResumo } from "./cards-resumo";
import { ListaInadimplentes } from "./lista-inadimplentes";

// A lista falha sozinha: um erro nela não pode esconder os cards do resumo.
type Lista = { membros: MembroInadimplente[] } | { erro: string };

type Estado =
  | { situacao: "carregando" }
  | { situacao: "erro"; mensagem: string }
  | {
      situacao: "pronto";
      resumo: ResumoDashboard;
      lista: Lista | null;
    };

type Atalho = { rotulo: string; href: string; icone: NomeIcone };

function Atalhos({ atalhos }: { atalhos: Atalho[] }) {
  return (
    <Cartao titulo="Atalhos" espaco="compacto">
      <div className="flex flex-col gap-2.5">
        {atalhos.map((atalho, i) => (
          <Link
            key={atalho.href}
            href={atalho.href}
            className={classesDoBotao(i === 0 ? "escuro" : "secundario")}
          >
            <Icone nome={atalho.icone} tamanho={16} />
            <span>{atalho.rotulo}</span>
          </Link>
        ))}
      </div>
    </Cartao>
  );
}

export function PainelDashboard() {
  const usuario = useUsuario();
  const verInadimplentes = temAcessoFinanceiro(usuario);
  const cadastraMembros = podeGerenciarMembros(usuario);
  const atalhos: Atalho[] = [
    ...(cadastraMembros ? [{ rotulo: "Novo membro", href: "/membros/novo", icone: "mais" as const }] : []),
    ...(verInadimplentes
      ? [{ rotulo: "Registrar pagamento", href: "/pagamentos", icone: "pagamentos" as const }]
      : []),
    ...(podeRegistrarAtividade(usuario)
      ? [{ rotulo: "Registrar atividade", href: "/atividades", icone: "relogio" as const }]
      : []),
  ];
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });

  useEffect(() => {
    let ativo = true;

    const buscaLista: Promise<Lista | null> = verInadimplentes
      ? buscarInadimplentes().then(
          (membros) => ({ membros }),
          (e: unknown) => ({ erro: (e as Error).message }),
        )
      : Promise.resolve(null);

    Promise.all([buscarResumo(), buscaLista])
      .then(([resumo, lista]) => {
        if (ativo) setEstado({ situacao: "pronto", resumo, lista });
      })
      .catch((e: unknown) => {
        if (ativo) setEstado({ situacao: "erro", mensagem: (e as Error).message });
      });

    return () => {
      ativo = false;
    };
  }, [verInadimplentes]);

  const cabecalho = (
    <CabecalhoPagina
      titulo="Dashboard"
      descricao="Resumo do dia na academia."
      acoes={
        cadastraMembros && (
          <Link href="/membros/novo" className={classesDoBotao("primario")}>
            <Icone nome="mais" tamanho={16} />
            <span>Novo membro</span>
          </Link>
        )
      }
    />
  );

  let conteudo;
  if (estado.situacao === "carregando") {
    conteudo = <p className="text-sm text-suave">Carregando…</p>;
  } else if (estado.situacao === "erro") {
    conteudo = (
      <p role="alert" className="text-sm text-red-600">
        {estado.mensagem}
      </p>
    );
  } else {
    const { lista } = estado;
    conteudo = (
      <>
        <CardsResumo resumo={estado.resumo} />
        <div className="grid items-start gap-5 lg:grid-cols-3">
          {lista && (
            <div className="min-w-0 lg:col-span-2">
              {"erro" in lista ? (
                <p role="alert" className="text-sm text-red-600">
                  {lista.erro}
                </p>
              ) : (
                <ListaInadimplentes membros={lista.membros} />
              )}
            </div>
          )}
          {atalhos.length > 0 && (
            <div className="min-w-0">
              <Atalhos atalhos={atalhos} />
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {cabecalho}
      {conteudo}
    </div>
  );
}
