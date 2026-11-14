import { tamanho } from "@/features/funcionarios/validacao";
import { apenasDigitos } from "@/lib/format";
import { isCpfValido } from "./cpf";

export type ModoFormMembro = "criar" | "editar";
export type CampoMembro = "nome" | "cpf" | "telefone" | "endereco";
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

  return erros;
}
