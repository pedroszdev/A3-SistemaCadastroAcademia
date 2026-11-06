import { Injectable } from '@nestjs/common';
import { hoje } from '../common/utils/date';
import { HistoricoService } from '../historico/historico.service';
import { MembrosService } from '../membros/membros.service';
import {
  type MembroInadimplente,
  PagamentosService,
} from '../pagamentos/pagamentos.service';

export interface ResumoDashboard {
  membrosAtivos: number;
  membrosInadimplentes: number;
  pagamentosAtrasados: number;
  receitaMes: number;
  atividadesHoje: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly membros: MembrosService,
    private readonly pagamentos: PagamentosService,
    private readonly historico: HistoricoService,
  ) {}

  async resumo(): Promise<ResumoDashboard> {
    const dia = hoje();
    const inicioMes = new Date(
      Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), 1),
    );
    const inicioProximoMes = new Date(
      Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth() + 1, 1),
    );

    // pageSize 1 porque só o total interessa; a regra fica nos services de origem.
    const [
      membrosAtivos,
      membrosInadimplentes,
      pagamentosAtrasados,
      receitaMes,
      atividadesHoje,
    ] = await Promise.all([
      this.membros.findAll({ ativo: true, page: 1, pageSize: 1 }),
      this.pagamentos.contarInadimplentes(),
      this.pagamentos.findAll({ status: 'ATRASADO', page: 1, pageSize: 1 }),
      this.pagamentos.receitaDoPeriodo(inicioMes, inicioProximoMes),
      this.historico.findAll({
        dataDe: dia,
        dataAte: dia,
        page: 1,
        pageSize: 1,
      }),
    ]);

    return {
      membrosAtivos: membrosAtivos.total,
      membrosInadimplentes,
      pagamentosAtrasados: pagamentosAtrasados.total,
      receitaMes,
      atividadesHoje: atividadesHoje.total,
    };
  }

  inadimplentes(): Promise<MembroInadimplente[]> {
    return this.pagamentos.listarInadimplentes();
  }
}
