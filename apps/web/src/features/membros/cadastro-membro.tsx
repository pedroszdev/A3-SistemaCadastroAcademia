"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cartao, DuasColunas } from "@/components/ui/cartao";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useUsuario } from "@/features/auth/usuario";
import { ApiError } from "@/lib/api";
import { buscarMembro, type Membro } from "./api";
import { FormMembro } from "./form-membro";
import { podeGerenciarMembros } from "./permissoes";

type Carga =
  | { tipo: "carregando" }
  | { tipo: "carregado"; membro: Membro }
  | { tipo: "nao-encontrado" }
  | { tipo: "erro"; mensagem: string };

function AcessoRestrito() {
  return (
    <EmptyState
      titulo="Acesso restrito"
      descricao="Só o administrador e a recepção cadastram e editam membros."
    />
  );
}

export function NovoMembro() {
  const usuario = useUsuario();
  const router = useRouter();
  const { mostrar } = useToast();

  if (!podeGerenciarMembros(usuario)) return <AcessoRestrito />;

  return (
    <DuasColunas
      larguraLateral="280px"
      principal={
        <div className="max-w-[820px]">
          <FormMembro
            onSalvo={() => {
              mostrar("Membro cadastrado.");
              router.push("/membros");
            }}
            onCancelar={() => router.push("/membros")}
          />
        </div>
      }
      lateral={<DepoisDeSalvar />}
    />
  );
}

function DepoisDeSalvar() {
  return (
    <Cartao titulo="Depois de salvar" espaco="compacto">
      <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-sm leading-relaxed">
        <li>
          Monte a ficha de treino em{" "}
          <Link href="/treinos" className="underline">
            Treinos
          </Link>
          .
        </li>
        <li>
          Lance a primeira mensalidade em{" "}
          <Link href="/pagamentos" className="underline">
            Pagamentos
          </Link>
          .
        </li>
        <li>
          O instrutor registra cada atividade em{" "}
          <Link href="/atividades" className="underline">
            Histórico
          </Link>
          .
        </li>
      </ol>
      <p className="mt-4 rounded-xl bg-fundo p-3.5 text-[13px] leading-relaxed text-suave">
        Data de cadastro é preenchida automaticamente com a data de hoje.
      </p>
    </Cartao>
  );
}

export function EditarMembro({ id }: { id: string }) {
  const usuario = useUsuario();

  if (!podeGerenciarMembros(usuario)) return <AcessoRestrito />;

  return <CarregarMembro key={id} id={id} />;
}

function CarregarMembro({ id }: { id: string }) {
  const router = useRouter();
  const { mostrar } = useToast();
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  // Volta para a lista: a ficha /membros/<id> só existe com a WEB-G3.
  const voltar = () => router.push("/membros");

  useEffect(() => {
    let ativo = true;
    buscarMembro(id).then(
      (membro) => {
        if (ativo) setCarga({ tipo: "carregado", membro });
      },
      (e: unknown) => {
        if (!ativo) return;
        // O id que não é UUID dá 400 no ParseUUIDPipe da API: para quem abriu o
        // link, é o mesmo que um membro inexistente.
        setCarga(
          e instanceof ApiError && (e.status === 404 || e.status === 400)
            ? { tipo: "nao-encontrado" }
            : { tipo: "erro", mensagem: (e as Error).message },
        );
      },
    );
    return () => {
      ativo = false;
    };
  }, [id, tentativa]);

  switch (carga.tipo) {
    case "carregando":
      return <p className="text-sm text-suave">Carregando…</p>;
    case "nao-encontrado":
      return <EmptyState titulo="Membro não encontrado" />;
    case "erro":
      return (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-sm text-red-600">
            {carga.mensagem}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setCarga({ tipo: "carregando" });
                setTentativa((n) => n + 1);
              }}
            >
              Tentar de novo
            </Button>
            <Button variante="secundario" onClick={voltar}>
              Voltar
            </Button>
          </div>
        </div>
      );
    case "carregado":
      return (
        <div className="max-w-[820px]">
        <FormMembro
          membro={carga.membro}
          onSalvo={() => {
            mostrar("Membro atualizado.");
            voltar();
          }}
          onCancelar={voltar}
        />
        </div>
      );
  }
}
