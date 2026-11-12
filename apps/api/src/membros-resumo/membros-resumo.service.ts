import { Injectable } from '@nestjs/common';
import { hoje } from '../common/utils/date';
import { Cargo } from '../generated/prisma/enums';
import { HistoricoService } from '../historico/historico.service';
import { MembrosService } from '../membros/membros.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { PrismaService } from '../prisma/prisma.service';

// 30 dias contando hoje: de hoje - 29 até hoje.
const JANELA_ATIVIDADES_DIAS = 30;

// Matriz 4.2: a situação financeira é só de ADMIN e RECEPCIONISTA.
const CARGOS_COM_SITUACAO: readonly Cargo[] = [
  Cargo.ADMIN,
  Cargo.RECEPCIONISTA,
];

const TREINO_RESUMO_SELECT = {
  id: true,
  tipo: true,
  descricao: true,
  duracao: true,
  dataInicio: true,
} as const;

@Injectable()
export class MembrosResumoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membros: MembrosService,
    private readonly pagamentos: PagamentosService,
    private readonly historico: HistoricoService,
  ) {}

  async resumo(id: string, cargo?: Cargo) {
    // 404 antes de qualquer outra consulta
    const membro = await this.membros.findOne(id);

    const fim = hoje();
    const inicio = new Date(fim);
    inicio.setUTCDate(inicio.getUTCDate() - (JANELA_ATIVIDADES_DIAS - 1));

    const [situacaoFinanceira, treinoMaisRecente, atividades] =
      await Promise.all([
        cargo && CARGOS_COM_SITUACAO.includes(cargo)
          ? this.pagamentos.situacaoMembro(id)
          : null,
        this.prisma.treino.findFirst({
          where: { membroId: id },
          // id (UUIDv7) desempata datas iguais
          orderBy: [{ dataInicio: 'desc' }, { id: 'desc' }],
          select: TREINO_RESUMO_SELECT,
        }),
        this.historico.resumoMembro(id, inicio, fim),
      ]);

    return {
      membro,
      situacaoFinanceira,
      treinoMaisRecente,
      atividadesUltimos30Dias: atividades.totalAtividades,
    };
  }
}
