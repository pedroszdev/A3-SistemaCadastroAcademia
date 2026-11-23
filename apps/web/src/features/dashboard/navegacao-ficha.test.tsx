import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsuarioProvider } from "@/features/auth/usuario";
import { areaDaRota } from "@/lib/protecao-rotas";
import type { Cargo } from "@/lib/sessao";
import { buscarInadimplentes, buscarResumo } from "./api";
import { PainelDashboard } from "./painel-dashboard";

vi.mock("./api", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("./api")>()),
  buscarResumo: vi.fn(),
  buscarInadimplentes: vi.fn(),
}));

// A ficha tem os testes dela (ficha-membro.test.tsx); aqui só importa qual membro a página abre.
vi.mock("@/features/membros/ficha-membro", () => ({
  FichaMembro: ({ id }: { id: string }) => <p>ficha do membro {id}</p>,
}));

const RAIZ_APP = resolve(import.meta.dirname, "../../app");

type Rota = { arquivo: string; params: Record<string, string> };

function subpastas(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name);
}

// Acha o page.tsx do App Router que atende a URL, como o Next: o segmento fixo
// ganha do dinâmico ([id]) e os grupos, como (app), não entram na URL.
function procurarPagina(
  pasta: string,
  segmentos: string[],
  params: Record<string, string>,
): Rota | null {
  const pastas = subpastas(pasta);
  const [atual, ...resto] = segmentos;

  if (atual === undefined) {
    const pagina = join(pasta, "page.tsx");
    if (existsSync(pagina)) return { arquivo: pagina, params };
  } else {
    if (pastas.includes(atual)) {
      const rota = procurarPagina(join(pasta, atual), resto, params);
      if (rota) return rota;
    }
    for (const dinamica of pastas.filter((nome) => /^\[\w+\]$/.test(nome))) {
      const nome = dinamica.slice(1, -1);
      const rota = procurarPagina(join(pasta, dinamica), resto, {
        ...params,
        [nome]: decodeURIComponent(atual),
      });
      if (rota) return rota;
    }
  }

  for (const grupo of pastas.filter((nome) => /^\(.+\)$/.test(nome))) {
    const rota = procurarPagina(join(pasta, grupo), segmentos, params);
    if (rota) return rota;
  }
  return null;
}

function resolverRota(href: string): Rota | null {
  return procurarPagina(RAIZ_APP, href.split("/").filter(Boolean), {});
}

type Pagina = (props: { params: Promise<Record<string, string>> }) => Promise<ReactElement>;

describe("navegação do dashboard para a ficha do membro (issue #78)", () => {
  beforeEach(() => {
    vi.mocked(buscarResumo).mockResolvedValue({
      membrosAtivos: 12,
      membrosInadimplentes: 1,
      pagamentosAtrasados: 2,
      receitaMes: 900,
      atividadesHoje: 4,
    });
    vi.mocked(buscarInadimplentes).mockResolvedValue([
      { id: "0193a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b", nome: "Maria Souza", maiorAtrasoDias: 15 },
    ]);
  });

  it.each<Cargo>(["ADMIN", "RECEPCIONISTA"])(
    "o link do inadimplente leva o %s à página da ficha dele",
    async (cargo) => {
      render(
        <UsuarioProvider usuario={{ tipo: "FUNCIONARIO", cargo }}>
          <PainelDashboard />
        </UsuarioProvider>,
      );
      const href = (await screen.findByRole("link", { name: "Maria Souza" })).getAttribute("href");

      expect(href).toBe("/membros/0193a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b");
      expect(areaDaRota(href!)).toBe("FUNCIONARIO");

      const rota = resolverRota(href!);
      expect(rota).not.toBeNull();
      expect(rota!.arquivo).toBe(join(RAIZ_APP, "(app)", "membros", "[id]", "page.tsx"));

      const { default: pagina } = (await import(/* @vite-ignore */ rota!.arquivo)) as {
        default: Pagina;
      };
      render(await pagina({ params: Promise.resolve(rota!.params) }));

      expect(screen.getByRole("heading", { level: 1, name: "Ficha do membro" })).toBeInTheDocument();
      expect(
        screen.getByText("ficha do membro 0193a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b"),
      ).toBeInTheDocument();
    },
  );

  it("não acha página para uma URL sem rota, então um link quebrado falha aqui", () => {
    expect(resolverRota("/membros/m1/inexistente")).toBeNull();
    expect(resolverRota("/inexistente")).toBeNull();
  });

  it("dá prioridade ao segmento fixo sobre o [id], como o Next", () => {
    expect(resolverRota("/membros/novo")?.arquivo).toBe(
      join(RAIZ_APP, "(app)", "membros", "novo", "page.tsx"),
    );
  });
});
