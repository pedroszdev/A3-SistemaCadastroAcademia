import { TelaFuncionarios } from "@/features/funcionarios/tela-funcionarios";

export const metadata = { title: "Funcionários · Academia" };

export default function FuncionariosPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Funcionários</h1>
      <TelaFuncionarios />
    </div>
  );
}
