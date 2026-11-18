import { validarSenha } from "@/features/funcionarios/validacao";
import { api } from "@/lib/api";
import type { Membro } from "./api";

function caminhoDoAcesso(membroId: string) {
  return `/membros/${encodeURIComponent(membroId)}/acesso`;
}

// Libera ou redefine o acesso ao portal (MEM-07). A API responde 422 se o membro está inativo.
export function liberarAcesso(membroId: string, senha: string) {
  return api<Membro>(caminhoDoAcesso(membroId), {
    method: "PATCH",
    body: JSON.stringify({ senha }),
  });
}

// Revoga o acesso; vale também para o membro inativo.
export function revogarAcesso(membroId: string) {
  return api<Membro>(caminhoDoAcesso(membroId), { method: "DELETE" });
}

export type ErrosAcesso = Partial<Record<"senha" | "confirmacao", string>>;

// Mesmas regras do LiberarAcessoDto da API: mínimo 8 caracteres e máximo 72 bytes.
export function validarSenhaDeAcesso(senha: string, confirmacao: string): ErrosAcesso {
  const erros: ErrosAcesso = {};
  const erroSenha = validarSenha(senha);
  if (erroSenha) erros.senha = erroSenha;
  if (confirmacao !== senha) erros.confirmacao = "as senhas não conferem";
  return erros;
}
