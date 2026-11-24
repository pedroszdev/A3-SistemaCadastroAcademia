import { TelaHistorico } from "@/features/historico/tela-historico";

export const metadata = { title: "Histórico · Academia" };

export default function AtividadesPage() {
  return (
    <TelaHistorico
      cabecalho={{
        titulo: "Histórico de atividades",
        descricao: "Cada execução de treino registrada pelos instrutores.",
      }}
    />
  );
}
