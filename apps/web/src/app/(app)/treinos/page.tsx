import { TelaTreinos } from "@/features/treinos/tela-treinos";

export const metadata = { title: "Treinos · Academia" };

export default function TreinosPage() {
  return (
    <TelaTreinos
      cabecalho={{
        titulo: "Treinos",
        descricao: "Fichas de treino dos membros, criadas pelos instrutores.",
      }}
    />
  );
}
