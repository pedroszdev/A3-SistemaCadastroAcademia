import type { Cargo, UsuarioDoToken } from "./sessao";

export type ItemMenu = {
  rotulo: string;
  href: string;
  cargos: readonly Cargo[];
};

const TODOS: readonly Cargo[] = ["ADMIN", "RECEPCIONISTA", "INSTRUTOR"];

// Matriz 4.2: pagamentos e situação financeira são só do ADMIN e da RECEPCIONISTA.
export const CARGOS_FINANCEIRO: readonly Cargo[] = ["ADMIN", "RECEPCIONISTA"];

// Matriz 4.2: criar, editar e excluir treinos e registrar atividades são do ADMIN e do INSTRUTOR.
export const CARGOS_INSTRUCAO: readonly Cargo[] = ["ADMIN", "INSTRUTOR"];

// Espelha a matriz 4.2 só para a interface; quem barra de verdade é a API.
export function temCargo(usuario: UsuarioDoToken, cargos: readonly Cargo[]): boolean {
  return usuario.tipo === "FUNCIONARIO" && cargos.includes(usuario.cargo);
}

// Quem gere pagamentos e vê a situação financeira dos membros.
export function temAcessoFinanceiro(usuario: UsuarioDoToken): boolean {
  return temCargo(usuario, CARGOS_FINANCEIRO);
}

export const ITENS_MENU: readonly ItemMenu[] = [
  { rotulo: "Dashboard", href: "/dashboard", cargos: TODOS },
  { rotulo: "Membros", href: "/membros", cargos: TODOS },
  { rotulo: "Treinos", href: "/treinos", cargos: TODOS },
  { rotulo: "Pagamentos", href: "/pagamentos", cargos: CARGOS_FINANCEIRO },
  { rotulo: "Histórico", href: "/atividades", cargos: TODOS },
  { rotulo: "Funcionários", href: "/funcionarios", cargos: ["ADMIN"] },
  // RN20: cada um vê e muda os próprios dados.
  { rotulo: "Meus dados", href: "/perfil", cargos: TODOS },
];

export function itensDoMenu(cargo: Cargo | null): ItemMenu[] {
  if (!cargo) return [];
  return ITENS_MENU.filter((item) => item.cargos.includes(cargo));
}

export type ItemMenuAluno = Pick<ItemMenu, "rotulo" | "href">;

export const ITENS_MENU_ALUNO: readonly ItemMenuAluno[] = [
  { rotulo: "Meus treinos", href: "/aluno/treinos" },
  { rotulo: "Meu histórico", href: "/aluno/historico" },
  { rotulo: "Pagamentos", href: "/aluno/pagamentos" },
  { rotulo: "Meus dados", href: "/aluno/dados" },
];

export function estaAtivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
