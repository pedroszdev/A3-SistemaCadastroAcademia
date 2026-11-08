import type { Cargo } from "./sessao";

export type ItemMenu = {
  rotulo: string;
  href: string;
  cargos: readonly Cargo[];
};

const TODOS: readonly Cargo[] = ["ADMIN", "RECEPCIONISTA", "INSTRUTOR"];

// Matriz 4.2: pagamentos e situação financeira são só do ADMIN e da RECEPCIONISTA.
export const CARGOS_FINANCEIRO: readonly Cargo[] = ["ADMIN", "RECEPCIONISTA"];

export const ITENS_MENU: readonly ItemMenu[] = [
  { rotulo: "Dashboard", href: "/dashboard", cargos: TODOS },
  { rotulo: "Membros", href: "/membros", cargos: TODOS },
  { rotulo: "Treinos", href: "/treinos", cargos: TODOS },
  { rotulo: "Pagamentos", href: "/pagamentos", cargos: CARGOS_FINANCEIRO },
  { rotulo: "Histórico", href: "/atividades", cargos: TODOS },
  { rotulo: "Funcionários", href: "/funcionarios", cargos: ["ADMIN"] },
];

export function itensDoMenu(cargo: Cargo | null): ItemMenu[] {
  if (!cargo) return [];
  return ITENS_MENU.filter((item) => item.cargos.includes(cargo));
}
