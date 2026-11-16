import type { UsuarioDoToken } from "@/lib/sessao";

// Matriz 4.2: criar, editar e desativar membro é do ADMIN e da RECEPCIONISTA. Espelha a
// matriz só para a interface; quem barra de verdade é a API.
export function podeGerenciarMembros(usuario: UsuarioDoToken): boolean {
  return (
    usuario.tipo === "FUNCIONARIO" &&
    (usuario.cargo === "ADMIN" || usuario.cargo === "RECEPCIONISTA")
  );
}
