import type { Cargo } from "./sessao";

export type ItemMenu = {
  rotulo: string;
  href: string;
  cargos: readonly Cargo[];
};

const TODOS: readonly Cargo[] = ["ADMIN", "RECEPCIONISTA", "INSTRUTOR"];

export const ITENS_MENU: readonly ItemMenu[] = [
  { rotulo: "Dashboard", href: "/dashboard", cargos: TODOS },
  { rotulo: "Membros", href: "/membros", cargos: TODOS },
  { rotulo: "Treinos", href: "/treinos", cargos: TODOS },
  {
    rotulo: "Pagamentos",
    href: "/pagamentos",
    cargos: ["ADMIN", "RECEPCIONISTA"],
  },
  { rotulo: "Histórico", href: "/atividades", cargos: TODOS },
  { rotulo: "Funcionários", href: "/funcionarios", cargos: ["ADMIN"] },
];

export function itensDoMenu(cargo: Cargo | null): ItemMenu[] {
  if (!cargo) return [];
  return ITENS_MENU.filter((item) => item.cargos.includes(cargo));
}

export type ItemMenuAluno = Pick<ItemMenu, "rotulo" | "href">;

export const ITENS_MENU_ALUNO: readonly ItemMenuAluno[] = [
  { rotulo: "Meus treinos", href: "/aluno/treinos" },
  { rotulo: "Meu histórico", href: "/aluno/historico" },
];

export function estaAtivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
