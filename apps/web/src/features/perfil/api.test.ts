import { beforeEach, describe, expect, it, vi } from "vitest";
import { atualizarMeusDados, buscarMeusDados, ehAluno, trocarSenha } from "./api";

const fetchMock = vi.fn<typeof fetch>();

describe("api de meus dados (RN20)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("busca em GET /auth/me", async () => {
    await buscarMeusDados();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/me");
  });

  it("atualiza em PATCH /auth/me", async () => {
    await atualizarMeusDados({ telefone: "48999990000" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/me");
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(String(init?.body))).toEqual({ telefone: "48999990000" });
  });

  it("troca a senha em PATCH /auth/me/senha", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(trocarSenha("atual-123", "nova-senha-1")).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/me/senha");
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(String(init?.body))).toEqual({
      senhaAtual: "atual-123",
      novaSenha: "nova-senha-1",
    });
  });

  it("ehAluno separa o membro do funcionário", () => {
    expect(ehAluno({ cpf: "52998224725" } as never)).toBe(true);
    expect(ehAluno({ login: "admin" } as never)).toBe(false);
  });
});
