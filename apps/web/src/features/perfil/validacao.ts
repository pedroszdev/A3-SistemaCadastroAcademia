import { apenasDigitos, tamanho } from "@/lib/format";
import { MENSAGEM_TELEFONE } from "@/features/membros/validacao";

// Espelha apps/api/src/auth/dto (atualizar-meus-dados e trocar-senha), com as mesmas mensagens.

export type ErrosDados = Partial<Record<"nome" | "telefone" | "endereco", string>>;

export function validarDadosDoAluno(telefone: string, endereco: string): ErrosDados {
  const erros: ErrosDados = {};
  if (!/^\d{10,11}$/.test(apenasDigitos(telefone))) erros.telefone = MENSAGEM_TELEFONE;
  const tamanhoEndereco = tamanho(endereco.trim());
  if (tamanhoEndereco < 5 || tamanhoEndereco > 200) {
    erros.endereco = "endereco deve ter entre 5 e 200 caracteres";
  }
  return erros;
}

export function validarDadosDoFuncionario(nome: string): ErrosDados {
  const tamanhoNome = tamanho(nome.trim());
  return tamanhoNome < 3 || tamanhoNome > 100
    ? { nome: "nome deve ter entre 3 e 100 caracteres" }
    : {};
}

export type ErrosSenha = Partial<Record<"senhaAtual" | "novaSenha" | "confirmacao", string>>;

const MAX_BYTES_SENHA = 72;

export function validarTrocaDeSenha(
  senhaAtual: string,
  novaSenha: string,
  confirmacao: string,
): ErrosSenha {
  const erros: ErrosSenha = {};
  if (senhaAtual === "") erros.senhaAtual = "senhaAtual é obrigatória";
  if (novaSenha.length < 8) {
    erros.novaSenha = "novaSenha deve ter no mínimo 8 caracteres";
  } else if (new TextEncoder().encode(novaSenha).length > MAX_BYTES_SENHA) {
    erros.novaSenha = "novaSenha deve ter no máximo 72 bytes";
  }
  if (confirmacao !== novaSenha) erros.confirmacao = "As senhas não conferem";
  return erros;
}
