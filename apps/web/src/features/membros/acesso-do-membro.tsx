"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { useToast } from "@/components/ui/toast";
import { useUsuario } from "@/features/auth/usuario";
import { useFormDialog } from "@/lib/use-form-dialog";
import { liberarAcesso, revogarAcesso, type ErrosAcesso, validarSenhaDeAcesso } from "./acesso";
import type { Membro } from "./api";
import { podeGerenciarMembros } from "./permissoes";

type AcessoDoMembroProps = {
  membroId: string;
  // RF26: membro inativo não recebe acesso, mas um acesso já liberado pode ser revogado.
  ativo: boolean;
  acessoLiberado: boolean;
  // Chamado depois de liberar, redefinir ou revogar, para a ficha recarregar o membro.
  onAlterado?: () => void;
};

type FormSenhaDeAcessoProps = {
  membroId: string;
  onSalvo: (membro: Membro) => void;
  onCancelar: () => void;
  // Avisa quem abriu o formulário para não deixar fechá-lo durante o envio.
  onEnviando?: (enviando: boolean) => void;
};

function FormSenhaDeAcesso({ membroId, onSalvo, onCancelar, onEnviando }: FormSenhaDeAcessoProps) {
  const [erros, setErros] = useState<ErrosAcesso>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const senha = String(dados.get("senha") ?? "");
    const confirmacao = String(dados.get("confirmacao") ?? "");

    const errosEncontrados = validarSenhaDeAcesso(senha, confirmacao);
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0) return;

    setEnviando(true);
    onEnviando?.(true);
    let membro: Membro;
    try {
      membro = await liberarAcesso(membroId, senha);
    } catch (e) {
      setErroApi((e as Error).message);
      setEnviando(false);
      onEnviando?.(false);
      return;
    }
    // Fora do try: um erro depois de salvar não aparece como se a senha não tivesse sido gravada.
    onSalvo(membro);
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      <Input
        rotulo="Nova senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        erro={erros.senha}
      />
      <Input
        rotulo="Confirmar senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        erro={erros.confirmacao}
      />
      <RodapeFormulario erro={erroApi} enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}

// Acesso do membro ao portal, para a ficha (WEB-G3). Os botões são só para a interface;
// quem barra de verdade é a API.
export function AcessoDoMembro({ membroId, ativo, acessoLiberado, onAlterado }: AcessoDoMembroProps) {
  const podeGerenciar = podeGerenciarMembros(useUsuario());
  const { mostrar } = useToast();
  // O badge acompanha a resposta da API na hora, mesmo antes de a ficha recarregar o membro.
  const [liberado, setLiberado] = useState(acessoLiberado);
  const [anterior, setAnterior] = useState(acessoLiberado);
  if (anterior !== acessoLiberado) {
    setAnterior(acessoLiberado);
    setLiberado(acessoLiberado);
  }
  const dialogSenha = useFormDialog();
  const [confirmarRevogar, setConfirmarRevogar] = useState(false);
  const [revogando, setRevogando] = useState(false);

  function aoSalvar(membro: Membro) {
    mostrar(liberado ? "Senha redefinida." : "Acesso liberado.");
    setLiberado(membro.acessoLiberado);
    dialogSenha.concluir();
    onAlterado?.();
  }

  async function aoRevogar() {
    setRevogando(true);
    try {
      const membro = await revogarAcesso(membroId);
      setLiberado(membro.acessoLiberado);
      mostrar("Acesso revogado.");
      onAlterado?.();
    } catch (e) {
      mostrar((e as Error).message, "erro");
    } finally {
      setRevogando(false);
      setConfirmarRevogar(false);
    }
  }

  // Durante o DELETE a confirmação não fecha: senão dava para reabri-la e o fim do pedido
  // antigo fecharia a nova.
  function fecharConfirmacao() {
    if (!revogando) setConfirmarRevogar(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <span
        className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
          liberado ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-700"
        }`}
      >
        {liberado ? "Acesso liberado" : "Sem acesso"}
      </span>

      {podeGerenciar && (
        <div className="flex flex-wrap gap-2">
          {ativo && (
            <Button
              variante={liberado ? "secundario" : "primario"}
              onClick={() => dialogSenha.abrir()}
            >
              {liberado ? "Redefinir senha" : "Liberar acesso"}
            </Button>
          )}
          {liberado && (
            <Button variante="perigo" onClick={() => setConfirmarRevogar(true)}>
              Revogar acesso
            </Button>
          )}
        </div>
      )}

      {podeGerenciar && !ativo && (
        <p className="text-sm text-zinc-600">Membro inativo não pode receber acesso ao portal.</p>
      )}

      <Dialog
        aberto={dialogSenha.form.aberto}
        titulo={liberado ? "Redefinir senha" : "Liberar acesso"}
        onFechar={dialogSenha.fechar}
      >
        <FormSenhaDeAcesso
          key={dialogSenha.form.chave}
          membroId={membroId}
          onSalvo={aoSalvar}
          onCancelar={dialogSenha.fechar}
          onEnviando={dialogSenha.setOcupado}
        />
      </Dialog>

      <Dialog
        aberto={confirmarRevogar}
        titulo="Revogar acesso"
        onFechar={fecharConfirmacao}
        acoes={
          <>
            <Button variante="secundario" disabled={revogando} onClick={fecharConfirmacao}>
              Cancelar
            </Button>
            <Button variante="perigo" disabled={revogando} onClick={aoRevogar}>
              Confirmar
            </Button>
          </>
        }
      >
        <p>
          O aluno não vai mais conseguir entrar no portal. Para voltar, é preciso liberar o acesso
          de novo.
        </p>
      </Dialog>
    </div>
  );
}
