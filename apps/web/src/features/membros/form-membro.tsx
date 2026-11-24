"use client";

import { type FormEvent, useState } from "react";
import { Cartao } from "@/components/ui/cartao";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { ApiError } from "@/lib/api";
import { mascaraMoeda, mascaraMoedaColada, valorDaMascara } from "@/features/pagamentos/moeda";
import {
  apenasDigitos,
  formatarMoeda,
  hojeEmSaoPaulo,
  mascaraCpf,
  mascaraTelefone,
} from "@/lib/format";
import { atualizarMembro, criarMembro, type Membro } from "./api";
import { type ErrosMembro, validarMembro } from "./validacao";

type FormMembroProps = {
  membro?: Membro;
  onSalvo: () => void;
  onCancelar: () => void;
};

export function FormMembro({ membro, onSalvo, onCancelar }: FormMembroProps) {
  const modo = membro ? "editar" : "criar";
  const [cpf, setCpf] = useState(membro ? mascaraCpf(membro.cpf) : "");
  const [telefone, setTelefone] = useState(membro ? mascaraTelefone(membro.telefone) : "");
  const [valorMensalidade, setValorMensalidade] = useState(
    membro?.valorMensalidade ? formatarMoeda(membro.valorMensalidade) : "",
  );
  // No cadastro, o dia de hoje (o mesmo padrão da API); na edição, o salvo.
  const [diaVencimento, setDiaVencimento] = useState(() =>
    membro
      ? String(membro.diaVencimento ?? "")
      : String(Number(hojeEmSaoPaulo().slice(8))),
  );
  const [erros, setErros] = useState<ErrosMembro>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const valores = {
      nome: String(dados.get("nome") ?? ""),
      cpf,
      telefone,
      endereco: String(dados.get("endereco") ?? ""),
      valorMensalidade,
      diaVencimento,
    };

    const errosEncontrados = validarMembro(valores, modo);
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0) return;

    setEnviando(true);
    const campos = {
      nome: valores.nome.trim(),
      telefone: apenasDigitos(telefone),
      endereco: valores.endereco.trim(),
      // Em branco (só na edição) não vai: o membro fica como está.
      ...(valorMensalidade.trim() && { valorMensalidade: valorDaMascara(valorMensalidade) }),
      ...(diaVencimento.trim() && { diaVencimento: Number(diaVencimento) }),
    };
    try {
      if (membro) {
        await atualizarMembro(membro.id, campos);
      } else {
        await criarMembro({
          ...campos,
          valorMensalidade: valorDaMascara(valorMensalidade),
          cpf: apenasDigitos(cpf),
        });
      }
      onSalvo();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setErros({ cpf: e.message });
      } else {
        setErroApi((e as Error).message);
      }
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-5">
      <Cartao>
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-semibold">Dados pessoais</h2>
            <p className="mt-1 text-[13px] text-suave">Campos com * são obrigatórios.</p>
          </div>
          <Input
            rotulo="Nome completo"
            name="nome"
            obrigatorio
            placeholder="Ex.: Ana Souza"
            defaultValue={membro?.nome}
            erro={erros.nome}
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <Input
              rotulo="CPF"
              name="cpf"
              obrigatorio
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              ajuda="Não pode ser alterado depois do cadastro."
              value={cpf}
              onChange={(e) => setCpf(mascaraCpf(e.target.value))}
              disabled={modo === "editar"}
              erro={erros.cpf}
            />
            <Input
              rotulo="Telefone"
              name="telefone"
              obrigatorio
              type="tel"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              erro={erros.telefone}
            />
          </div>
          <Input
            rotulo="Endereço"
            name="endereco"
            obrigatorio
            placeholder="Rua, número, bairro, cidade"
            defaultValue={membro?.endereco}
            erro={erros.endereco}
          />
        </div>
      </Cartao>
      <Cartao>
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-semibold">Mensalidade</h2>
            <p className="mt-1 text-[13px] text-suave">
              {membro
                ? "Vale para as próximas cobranças; as já geradas ficam como estão."
                : "A primeira cobrança é gerada ao salvar, e as próximas todo mês, automaticamente."}
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <Input
              rotulo="Valor da mensalidade"
              name="valorMensalidade"
              obrigatorio={!membro}
              inputMode="numeric"
              placeholder="R$ 0,00"
              ajuda={membro && !membro.valorMensalidade ? "Sem mensalidade automática até definir o valor." : undefined}
              value={valorMensalidade}
              onChange={(e) => setValorMensalidade(mascaraMoeda(e.target.value))}
              onPaste={(e) => {
                e.preventDefault();
                setValorMensalidade(mascaraMoedaColada(e.clipboardData.getData("text")));
              }}
              erro={erros.valorMensalidade}
            />
            <Input
              rotulo="Dia do vencimento"
              name="diaVencimento"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              step={1}
              ajuda="De 1 a 31. Nos meses mais curtos, vence no último dia."
              value={diaVencimento}
              onChange={(e) => setDiaVencimento(e.target.value)}
              erro={erros.diaVencimento}
            />
          </div>
        </div>
      </Cartao>
      <RodapeFormulario
        erro={erroApi}
        enviando={enviando}
        onCancelar={onCancelar}
        rotuloSalvar="Salvar membro"
      />
    </form>
  );
}
