import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

const AGORA = new Date("2026-11-06T12:00:00.000Z");

function jwt(payload: unknown) {
  return `cabecalho.${btoa(JSON.stringify(payload)).replaceAll("=", "")}.assinatura`;
}

function requisicao(caminho: string, token?: string) {
  return new NextRequest(`http://localhost:3001${caminho}`, {
    headers: token ? { cookie: `token=${token}` } : {},
  });
}

describe("proxy", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: AGORA });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("redireciona para o login sem sessão", () => {
    const res = proxy(requisicao("/membros"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("deixa seguir com sessão válida", () => {
    const token = jwt({
      tipo: "FUNCIONARIO",
      cargo: "ADMIN",
      exp: AGORA.getTime() / 1000 + 60,
    });

    const res = proxy(requisicao("/membros", token));

    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("apaga o cookie do token expirado", () => {
    const token = jwt({
      tipo: "FUNCIONARIO",
      cargo: "ADMIN",
      exp: AGORA.getTime() / 1000 - 1,
    });

    const res = proxy(requisicao("/membros", token));

    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
    expect(res.cookies.get("token")?.value).toBe("");
  });
});
