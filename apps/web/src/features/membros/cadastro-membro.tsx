"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    <FormMembro
      onSalvo={() => {
        mostrar("Membro cadastrado.");
        router.push("/membros");
      }}
      onCancelar={() => router.push("/membros")}
    />
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
  const ficha = `/membros/${encodeURIComponent(id)}`;

  useEffect(() => {
    let ativo = true;
    buscarMembro(id).then(
      (membro) => {
        if (ativo) setCarga({ tipo: "carregado", membro });
      },
      (e: unknown) => {
        if (!ativo) return;
        setCarga(
          e instanceof ApiError && e.status === 404
            ? { tipo: "nao-encontrado" }
            : { tipo: "erro", mensagem: (e as Error).message },
        );
      },
    );
    return () => {
      ativo = false;
    };
  }, [id]);

  switch (carga.tipo) {
    case "carregando":
      return <p className="text-sm text-zinc-600">Carregando…</p>;
    case "nao-encontrado":
      return <EmptyState titulo="Membro não encontrado" />;
    case "erro":
      return (
        <p role="alert" className="text-sm text-red-600">
          {carga.mensagem}
        </p>
      );
    case "carregado":
      return (
        <FormMembro
          membro={carga.membro}
          onSalvo={() => {
            mostrar("Membro atualizado.");
            router.push(ficha);
          }}
          onCancelar={() => router.push(ficha)}
        />
      );
  }
}
