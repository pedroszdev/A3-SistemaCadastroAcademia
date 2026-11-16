import { EditarMembro } from "@/features/membros/cadastro-membro";

export const metadata = { title: "Editar membro · Academia" };

export default async function EditarMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Editar membro</h1>
      <EditarMembro id={id} />
    </div>
  );
}
