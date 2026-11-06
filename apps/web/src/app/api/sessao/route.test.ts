import { describe, expect, it, vi } from "vitest";
import { criarSessao, encerrarSessao } from "@/lib/sessao-api";
import * as rota from "./route";

vi.mock("@/lib/sessao-api", () => ({
  criarSessao: vi.fn(),
  encerrarSessao: vi.fn(),
}));

describe("route /api/sessao", () => {
  it("POST cria a sessão e DELETE encerra", () => {
    expect(rota.POST).toBe(criarSessao);
    expect(rota.DELETE).toBe(encerrarSessao);
  });
});
