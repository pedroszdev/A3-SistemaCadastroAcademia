import { describe, expect, it } from "vitest";
import { lerCookie, lerUsuarioDoToken } from "./sessao";

function jwt(payload: unknown) {
  const base64url = btoa(JSON.stringify(payload))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return `cabecalho.${base64url}.assinatura`;
}

describe("lerUsuarioDoToken", () => {
  it("devolve o cargo de um funcionário", () => {
    expect(
      lerUsuarioDoToken(jwt({ sub: "1", tipo: "FUNCIONARIO", cargo: "ADMIN" })),
    ).toEqual({ tipo: "FUNCIONARIO", cargo: "ADMIN" });
  });

  it("devolve ALUNO para o token de aluno", () => {
    expect(lerUsuarioDoToken(jwt({ sub: "2", tipo: "ALUNO" }))).toEqual({
      tipo: "ALUNO",
    });
  });

  it("decodifica payload com caracteres que usam base64url", () => {
    expect(
      lerUsuarioDoToken(
        jwt({ nome: "ção??>>", tipo: "FUNCIONARIO", cargo: "INSTRUTOR" }),
      ),
    ).toEqual({ tipo: "FUNCIONARIO", cargo: "INSTRUTOR" });
  });

  it("devolve null para cargo desconhecido", () => {
    expect(
      lerUsuarioDoToken(jwt({ tipo: "FUNCIONARIO", cargo: "DONO" })),
    ).toBeNull();
  });

  it("devolve null para tipo desconhecido", () => {
    expect(lerUsuarioDoToken(jwt({ tipo: "OUTRO" }))).toBeNull();
  });

  it("devolve null para payload que não é objeto", () => {
    expect(lerUsuarioDoToken(jwt("texto"))).toBeNull();
    expect(lerUsuarioDoToken(jwt(null))).toBeNull();
  });

  it.each([undefined, null, "", "semponto", "a.%%%.c", "a.bm90LWpzb24.c"])(
    "devolve null para token ausente ou malformado (%s)",
    (token) => {
      expect(lerUsuarioDoToken(token)).toBeNull();
    },
  );
});

describe("lerCookie", () => {
  it("extrai o valor entre vários cookies", () => {
    expect(lerCookie("a=1; token=abc; b=2", "token")).toBe("abc");
  });

  it("devolve undefined quando o cookie não existe", () => {
    expect(lerCookie("a=1; b=2", "token")).toBeUndefined();
  });

  it("devolve undefined para header nulo", () => {
    expect(lerCookie(null, "token")).toBeUndefined();
  });

  it("decodifica valores com %-encoding", () => {
    expect(lerCookie("token=a%20b%3D", "token")).toBe("a b=");
  });

  it("devolve undefined para valor malformado", () => {
    expect(lerCookie("token=%E0", "token")).toBeUndefined();
  });
});
