import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Trilha } from "@/components/layout/trilha";
import { EditarMembro } from "@/features/membros/cadastro-membro";

export const metadata = { title: "Editar membro · Academia" };

export default async function EditarMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <CabecalhoPagina titulo="Editar membro" descricao="Atualize os dados do aluno." />
      <Trilha
        passos={[
          { rotulo: "Membros", href: "/membros" },
          { rotulo: "Ficha", href: `/membros/${encodeURIComponent(id)}` },
          { rotulo: "Editar membro" },
        ]}
      />
      <EditarMembro id={id} />
    </>
  );
}
