import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsuarioProvider } from "@/features/auth/usuario";
import type { UsuarioDoToken } from "@/lib/sessao";
import { buscarInadimplentes, buscarResumo } from "./api";
import { PainelDashboard } from "./painel-dashboard";

vi.mock("./api", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("./api")>()),
  buscarResumo: vi.fn(),
  buscarInadimplentes: vi.fn(),
}));

const resumo = {
  membrosAtivos: 12,
  membrosInadimplentes: 1,
  pagamentosAtrasados: 2,
  receitaMes: 900,
  atividadesHoje: 4,
};

function renderizar(usuario: UsuarioDoToken) {
  return render(
    <UsuarioProvider usuario={usuario}>
      <PainelDashboard />
    </UsuarioProvider>,
  );
}

describe("PainelDashboard", () => {
  beforeEach(() => {
    vi.mocked(buscarResumo).mockReset();
    vi.mocked(buscarInadimplentes).mockReset();
  });

  it("mostra Carregando… enquanto espera a API", () => {
    vi.mocked(buscarResumo).mockReturnValue(new Promise(() => {}));
    vi.mocked(buscarInadimplentes).mockReturnValue(new Promise(() => {}));

    renderizar({ tipo: "FUNCIONARIO", cargo: "ADMIN" });

    expect(screen.getByText("Carregando…")).toBeInTheDocument();
  });

  it("ADMIN vê os cards e a lista de inadimplentes", async () => {
    vi.mocked(buscarResumo).mockResolvedValue(resumo);
    vi.mocked(buscarInadimplentes).mockResolvedValue([
      { id: "m1", nome: "Maria Souza", maiorAtrasoDias: 15 },
    ]);

    renderizar({ tipo: "FUNCIONARIO", cargo: "ADMIN" });

    expect(await screen.findByText("Membros ativos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Maria Souza" })).toHaveAttribute(
      "href",
      "/membros/m1",
    );
    expect(screen.queryByText("Carregando…")).toBeNull();
  });

  it("INSTRUTOR vê só os cards e não busca os inadimplentes", async () => {
    vi.mocked(buscarResumo).mockResolvedValue(resumo);

    renderizar({ tipo: "FUNCIONARIO", cargo: "INSTRUTOR" });

    expect(await screen.findByText("Membros ativos")).toBeInTheDocument();
    expect(buscarInadimplentes).not.toHaveBeenCalled();
    expect(screen.queryByText("Membros inadimplentes")).toBeNull();
  });

  it("mostra a mensagem de erro da API", async () => {
    vi.mocked(buscarResumo).mockRejectedValue(new Error("API fora do ar"));
    vi.mocked(buscarInadimplentes).mockResolvedValue([]);

    renderizar({ tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" });

    expect(await screen.findByRole("alert")).toHaveTextContent("API fora do ar");
  });

  it("se só a lista falhar, mostra os cards e o erro da lista", async () => {
    vi.mocked(buscarResumo).mockResolvedValue(resumo);
    vi.mocked(buscarInadimplentes).mockRejectedValue(new Error("Lista indisponível"));

    renderizar({ tipo: "FUNCIONARIO", cargo: "ADMIN" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Lista indisponível");
    expect(screen.getByText("Membros ativos")).toBeInTheDocument();
    expect(screen.queryByText("Membros inadimplentes")).toBeNull();
  });

  it("descarta a resposta antiga quando o usuário muda antes dela chegar", async () => {
    let resolverPrimeira: (r: typeof resumo) => void = () => {};
    let resolverSegunda: (r: typeof resumo) => void = () => {};
    vi.mocked(buscarResumo)
      .mockReturnValueOnce(
        new Promise((ok) => {
          resolverPrimeira = ok;
        }),
      )
      .mockReturnValueOnce(
        new Promise((ok) => {
          resolverSegunda = ok;
        }),
      );
    vi.mocked(buscarInadimplentes).mockResolvedValue([
      { id: "m1", nome: "Maria Souza", maiorAtrasoDias: 15 },
    ]);

    const { rerender } = render(
      <UsuarioProvider usuario={{ tipo: "FUNCIONARIO", cargo: "ADMIN" }}>
        <PainelDashboard />
      </UsuarioProvider>,
    );
    rerender(
      <UsuarioProvider usuario={{ tipo: "FUNCIONARIO", cargo: "INSTRUTOR" }}>
        <PainelDashboard />
      </UsuarioProvider>,
    );

    await act(async () => resolverSegunda(resumo));
    await act(async () => resolverPrimeira({ ...resumo, membrosAtivos: 99 }));

    expect(screen.getByText("Membros ativos").nextElementSibling?.textContent).toBe("12");
    expect(screen.queryByText("99")).toBeNull();
    expect(screen.queryByText("Membros inadimplentes")).toBeNull();
  });
});
