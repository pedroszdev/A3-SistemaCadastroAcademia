import { tamanho } from "@/features/funcionarios/validacao";
import { apenasDigitos } from "@/lib/format";
import { isCpfValido } from "./cpf";

export type ModoFormMembro = "criar" | "editar";

export type ErrosMembro = Partial<Record<"nome" | "cpf" | "telefone" | "endereco", string>>;

type Valores = { nome: string; cpf: string; telefone: string; endereco: string };

// Mesmas mensagens e limites do CreateMembroDto / UpdateMembroDto da API.
export const MENSAGEM_NOME = "nome deve ter entre 3 e 120 caracteres";
export const MENSAGEM_CPF = "CPF inválido";
export const MENSAGEM_TELEFONE = "telefone deve ter 10 ou 11 dígitos, com o DDD";
export const MENSAGEM_ENDERECO = "endereco deve ter entre 5 e 200 caracteres";

export function validarMembro(valores: Valores, modo: ModoFormMembro): ErrosMembro {
  const erros: ErrosMembro = {};

  const tamanhoNome = tamanho(valores.nome.trim());
  if (tamanhoNome < 3 || tamanhoNome > 120) erros.nome = MENSAGEM_NOME;

  // RN02: na edição o CPF não vai no body, então não há o que validar.
  if (modo === "criar" && !isCpfValido(valores.cpf)) erros.cpf = MENSAGEM_CPF;

  if (!/^\d{10,11}$/.test(apenasDigitos(valores.telefone))) erros.telefone = MENSAGEM_TELEFONE;

  const tamanhoEndereco = tamanho(valores.endereco.trim());
  if (tamanhoEndereco < 5 || tamanhoEndereco > 200) erros.endereco = MENSAGEM_ENDERECO;

  return erros;
}
