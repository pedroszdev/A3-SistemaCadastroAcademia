import { apenasDigitos, tamanho } from "@/lib/format";
import { valorDaMascara } from "@/features/pagamentos/moeda";
import { isCpfValido } from "./cpf";

export type ModoFormMembro = "criar" | "editar";
export type CampoMembro =
  | "nome"
  | "cpf"
  | "telefone"
  | "endereco"
  | "valorMensalidade"
  | "diaVencimento";
export type ErrosMembro = Partial<Record<CampoMembro, string>>;
export type ValoresMembro = Record<CampoMembro, string>;

export const MENSAGEM_TELEFONE = "telefone deve ter 10 ou 11 dígitos, com o DDD";

// Espelha apps/api/src/membros/dto/create-membro.dto.ts, com as mesmas mensagens.
export function validarMembro(valores: ValoresMembro, modo: ModoFormMembro): ErrosMembro {
  const erros: ErrosMembro = {};
  const tamanhoNome = tamanho(valores.nome.trim());
  const tamanhoEndereco = tamanho(valores.endereco.trim());

  if (tamanhoNome < 3 || tamanhoNome > 120) {
    erros.nome = "nome deve ter entre 3 e 120 caracteres";
  }

  if (modo === "criar" && !isCpfValido(valores.cpf)) {
    erros.cpf = "cpf deve ser um CPF válido";
  }

  if (!/^\d{10,11}$/.test(apenasDigitos(valores.telefone))) {
    erros.telefone = MENSAGEM_TELEFONE;
  }

  if (tamanhoEndereco < 5 || tamanhoEndereco > 200) {
    erros.endereco = "endereco deve ter entre 5 e 200 caracteres";
  }

  // RN18: obrigatório no cadastro. Na edição, em branco mantém o membro como está.
  const valor = valorDaMascara(valores.valorMensalidade);
  if (modo === "criar" || valores.valorMensalidade.trim() !== "") {
    if (valor < 0.01) {
      erros.valorMensalidade = "valorMensalidade deve ser no mínimo 0,01";
    } else if (valor > 10000) {
      erros.valorMensalidade = "valorMensalidade deve ser no máximo 10.000";
    }
  }

  const dia = valores.diaVencimento.trim();
  if (dia !== "" && !/^(?:[1-9]|[12]\d|3[01])$/.test(dia)) {
    erros.diaVencimento = "diaVencimento deve ser entre 1 e 31";
  }

  return erros;
}
