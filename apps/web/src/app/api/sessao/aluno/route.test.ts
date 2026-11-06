import { describe, expect, it, vi } from "vitest";
import { criarSessaoAluno } from "@/lib/sessao-api";
import * as rota from "./route";

vi.mock("@/lib/sessao-api", () => ({
  criarSessaoAluno: vi.fn(),
}));

describe("route /api/sessao/aluno", () => {
  it("POST cria a sessão do aluno", () => {
    expect(rota.POST).toBe(criarSessaoAluno);
  });
});
