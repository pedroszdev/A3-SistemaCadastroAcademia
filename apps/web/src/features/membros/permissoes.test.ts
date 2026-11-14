import { describe, expect, it } from "vitest";
import type { UsuarioDoToken } from "@/lib/sessao";
import { podeGerenciarMembros } from "./permissoes";

describe("podeGerenciarMembros", () => {
  it.each<[UsuarioDoToken, boolean]>([
    [{ tipo: "FUNCIONARIO", cargo: "ADMIN" }, true],
    [{ tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" }, true],
    [{ tipo: "FUNCIONARIO", cargo: "INSTRUTOR" }, false],
    [{ tipo: "ALUNO" }, false],
  ])("podeGerenciarMembros(%o) é %s", (usuario, esperado) => {
    expect(podeGerenciarMembros(usuario)).toBe(esperado);
  });
});
