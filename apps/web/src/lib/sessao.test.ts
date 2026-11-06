import { describe, expect, it, vi } from "vitest";
import {
  cookieDoToken,
  lerCookie,
  lerUsuarioDoToken,
  segundosAteExpirar,
  sessaoValida,
} from "./sessao";

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

describe("segundosAteExpirar", () => {
  it("devolve quanto falta até o exp", () => {
    expect(segundosAteExpirar(jwt({ tipo: "ALUNO", exp: 1_000 }), 400)).toBe(600);
  });

  it("fica negativo depois do exp", () => {
    expect(segundosAteExpirar(jwt({ tipo: "ALUNO", exp: 1_000 }), 1_200)).toBe(-200);
  });

  it("devolve null sem exp numérico ou com token malformado", () => {
    expect(segundosAteExpirar(jwt({ tipo: "ALUNO" }), 0)).toBeNull();
    expect(segundosAteExpirar(jwt({ exp: "1000" }), 0)).toBeNull();
    expect(segundosAteExpirar("lixo", 0)).toBeNull();
  });
});

describe("sessaoValida", () => {
  const token = jwt({ tipo: "FUNCIONARIO", cargo: "ADMIN", exp: 1_000 });

  it("aceita token reconhecido e ainda não expirado", () => {
    expect(sessaoValida(token, 999)).toBe(true);
  });

  it("recusa token expirado", () => {
    expect(sessaoValida(token, 1_000)).toBe(false);
  });

  it("aceita token sem exp", () => {
    expect(sessaoValida(jwt({ tipo: "ALUNO" }), 0)).toBe(true);
  });

  it("recusa token ausente ou com usuário desconhecido", () => {
    expect(sessaoValida(undefined, 0)).toBe(false);
    expect(sessaoValida(jwt({ tipo: "OUTRO", exp: 9_999 }), 0)).toBe(false);
  });
});

describe("cookieDoToken", () => {
  it("grava o token httpOnly com o Max-Age do token", () => {
    expect(cookieDoToken("a.b.c", 28_800)).toBe(
      "token=a.b.c; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800",
    );
  });

  it("sem Max-Age vira cookie de sessão do navegador", () => {
    expect(cookieDoToken("a.b.c", null)).toBe(
      "token=a.b.c; Path=/; HttpOnly; SameSite=Lax",
    );
  });

  it("não usa Max-Age negativo", () => {
    expect(cookieDoToken("a.b.c", -5)).toContain("Max-Age=0");
  });

  it("marca Secure em produção", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(cookieDoToken("a.b.c", 10)).toMatch(/; Secure$/);
  });
});
