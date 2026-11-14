import { NovoMembro } from "@/features/membros/cadastro-membro";

export const metadata = { title: "Novo membro · Academia" };

export default function NovoMembroPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Novo membro</h1>
      <NovoMembro />
    </div>
  );
}
