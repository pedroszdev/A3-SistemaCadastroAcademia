import { TelaMembros } from "@/features/membros/tela-membros";

export const metadata = { title: "Membros · Academia" };

export default function MembrosPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Membros</h1>
      <TelaMembros />
    </div>
  );
}
