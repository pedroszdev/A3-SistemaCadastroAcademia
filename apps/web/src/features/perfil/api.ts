import type { Membro } from "@/features/membros/api";
import { api } from "@/lib/api";
import type { Cargo } from "@/lib/sessao";

// GET /auth/me: o aluno recebe o próprio Membro; o funcionário, os próprios dados.
export type FuncionarioDoPerfil = {
  id: string;
  nome: string;
  login: string;
  cargo: Cargo;
  ativo: boolean;
};

export type MeusDados = Membro | FuncionarioDoPerfil;

export function ehAluno(dados: MeusDados): dados is Membro {
  return "cpf" in dados;
}

// RN20: o aluno manda telefone e endereço; o funcionário, o nome.
export type DadosAtualizaveis = { nome?: string; telefone?: string; endereco?: string };

export function buscarMeusDados() {
  return api<MeusDados>("/auth/me");
}

export function atualizarMeusDados(dados: DadosAtualizaveis) {
  return api<MeusDados>("/auth/me", { method: "PATCH", body: JSON.stringify(dados) });
}

export function trocarSenha(senhaAtual: string, novaSenha: string) {
  return api<void>("/auth/me/senha", {
    method: "PATCH",
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
}
