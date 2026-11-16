import { TelaTreinos } from "@/features/treinos/tela-treinos";

export const metadata = { title: "Treinos · Academia" };

export default function TreinosPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Treinos</h1>
      <TelaTreinos />
    </div>
  );
}
