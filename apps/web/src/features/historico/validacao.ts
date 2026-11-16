import { hojeEmSaoPaulo, tamanho } from "@/lib/format";
import { FORMATO_DATA, validarMinutos } from "@/lib/validacao";

export type ErrosAtividade = Partial<
  Record<"membro" | "atividade" | "data" | "tempoExecucao", string>
>;

type Valores = {
  membroId: string | null;
  atividade: string;
  data: string;
  tempoExecucao: string;
};

// Mensagens iguais às da API (create-atividade.dto.ts) onde ela tem uma.
export function validarAtividade(valores: Valores, hoje: string = hojeEmSaoPaulo()): ErrosAtividade {
  const erros: ErrosAtividade = {};
  if (!valores.membroId) erros.membro = "Selecione o membro";

  const tamanhoAtividade = tamanho(valores.atividade.trim());
  if (tamanhoAtividade < 3 || tamanhoAtividade > 120) {
    erros.atividade = "atividade deve ter entre 3 e 120 caracteres";
  }

  if (!FORMATO_DATA.test(valores.data)) {
    erros.data = "data deve ser uma data válida no formato AAAA-MM-DD";
  } else if (valores.data > hoje) {
    erros.data = "data não pode ser uma data futura";
  }

  const erroTempo = validarMinutos("tempoExecucao", valores.tempoExecucao, 1, 600);
  if (erroTempo) erros.tempoExecucao = erroTempo;

  return erros;
}
