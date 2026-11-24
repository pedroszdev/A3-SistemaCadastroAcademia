import { hojeEmSaoPaulo, tamanho } from "@/lib/format";
import { FORMATO_DATA, validarMinutos } from "@/lib/validacao";

export type ErrosMinhaAtividade = Partial<
  Record<"treino" | "atividade" | "data" | "tempoExecucao", string>
>;

type Valores = { treinoId: string; atividade: string; data: string; tempoExecucao: string };

// RN19: espelha create-atividade-aluno.dto.ts. O treino é obrigatório e o texto, opcional.
export function validarMinhaAtividade(
  valores: Valores,
  hoje: string = hojeEmSaoPaulo(),
): ErrosMinhaAtividade {
  const erros: ErrosMinhaAtividade = {};
  if (!valores.treinoId) erros.treino = "Escolha um dos seus treinos";

  const tamanhoAtividade = tamanho(valores.atividade.trim());
  if (tamanhoAtividade > 0 && (tamanhoAtividade < 3 || tamanhoAtividade > 120)) {
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
