import { Injectable } from '@nestjs/common';
import { hoje } from '../common/utils/date';
import { HistoricoService } from '../historico/historico.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { TreinosService } from '../treinos/treinos.service';
import { MembrosService } from './membros.service';

const DIAS_DO_RESUMO = 30;

@Injectable()
export class MembrosResumoService {
  constructor(
    private readonly membros: MembrosService,
    private readonly pagamentos: PagamentosService,
    private readonly treinos: TreinosService,
    private readonly historico: HistoricoService,
  ) {}

  // A regra fica nos services de origem; aqui só se junta o que a ficha mostra.
  async resumo(id: string) {
    // Membro inexistente dá 404 antes de consultar o resto.
    const membro = await this.membros.findOne(id);

    // Mesma janela do "30 dias" do portal do aluno: hoje entra na conta.
    const ate = hoje();
    const de = new Date(ate);
    de.setUTCDate(de.getUTCDate() - (DIAS_DO_RESUMO - 1));

    const [situacaoFinanceira, treinos, atividades] = await Promise.all([
      this.pagamentos.situacaoMembro(id),
      // A ordem vem do TreinosService (dataInicio desc), então o primeiro é o mais recente.
      this.treinos.findAll({ membroId: id, page: 1, pageSize: 1 }),
      this.historico.resumoMembro(id, de, ate),
    ]);

    return {
      membro,
      situacaoFinanceira,
      treinoMaisRecente: treinos.data[0] ?? null,
      atividadesUltimos30Dias: atividades.totalAtividades,
    };
  }
}
