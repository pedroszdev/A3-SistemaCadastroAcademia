import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { hoje } from '../common/utils/date';
import type { Prisma } from '../generated/prisma/client';
import { StatusPagamento } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { mesDe, proximoVencimento } from './vencimento';

// A rotina é idempotente: rodar de hora em hora só cria o que ainda falta, e a virada
// do dia no fuso da academia é pega na primeira execução depois dela.
export const INTERVALO_ROTINA_MS = 60 * 60 * 1000;

type Cliente = Pick<Prisma.TransactionClient, 'membro' | 'pagamento'>;

export type PlanoDoMembro = {
  id: string;
  valorMensalidade: Prisma.Decimal | number | null;
  diaVencimento: number | null;
};

/**
 * RN18: todo membro ativo com valor de mensalidade tem sempre uma cobrança com o
 * próximo vencimento. A primeira nasce no cadastro; quando um vencimento passa, a
 * do mês seguinte é criada. Cobrança já vencida nunca é gerada, então definir o
 * valor de um membro antigo ou reativá-lo não o deixa inadimplente de cara.
 */
@Injectable()
export class MensalidadesService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(MensalidadesService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap() {
    void this.rodarRotina();
    this.timer = setInterval(
      () => void this.rodarRotina(),
      INTERVALO_ROTINA_MS,
    );
    // Não segura o processo (testes, scripts) só por causa da rotina.
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  /**
   * Garante a próxima cobrança do membro, se ele tem plano. Devolve true quando
   * criou uma. Não cria se já existe alguma cobrança no mês do próximo vencimento,
   * cancelada ou não: a recepção pode ter cancelado de propósito. A reativação é a
   * exceção (`ignorarCanceladas`): a do mês foi cancelada pela desativação, então só
   * as não canceladas contam.
   */
  async garantirProxima(
    membro: PlanoDoMembro,
    referencia: Date = hoje(),
    cliente: Cliente = this.prisma,
    opcoes: { ignorarCanceladas?: boolean } = {},
  ): Promise<boolean> {
    const { valorMensalidade, diaVencimento } = membro;
    if (valorMensalidade === null || diaVencimento === null) {
      return false;
    }
    const vencimento = proximoVencimento(referencia, diaVencimento);
    const { inicio, fim } = mesDe(vencimento);
    const existente = await cliente.pagamento.findFirst({
      where: {
        membroId: membro.id,
        dataVencimento: { gte: inicio, lt: fim },
        ...(opcoes.ignorarCanceladas && {
          status: { not: StatusPagamento.CANCELADO },
        }),
      },
      select: { id: true },
    });
    if (existente) {
      return false;
    }
    // skipDuplicates: se duas execuções correrem juntas, o índice único parcial
    // (uma cobrança não cancelada por vencimento) segura a segunda.
    const { count } = await cliente.pagamento.createMany({
      data: [
        {
          membroId: membro.id,
          valor: valorMensalidade,
          dataVencimento: vencimento,
        },
      ],
      skipDuplicates: true,
    });
    return count > 0;
  }

  /**
   * RN18: ao desativar, as cobranças que ainda não venceram (vencimento hoje ou
   * depois, sem pagamento) são canceladas: o membro parado não acumula dívida. As
   * já vencidas continuam, porque são dívida de quando ele estava ativo.
   */
  async cancelarFuturas(
    membroId: string,
    referencia: Date,
    cliente: Cliente = this.prisma,
  ): Promise<number> {
    const { count } = await cliente.pagamento.updateMany({
      where: {
        membroId,
        status: StatusPagamento.PENDENTE,
        dataPagamento: null,
        dataVencimento: { gte: referencia },
      },
      data: { status: StatusPagamento.CANCELADO },
    });
    return count;
  }

  /** Passa por todos os membros ativos com plano. Devolve quantas cobranças criou. */
  async gerarPendentes(referencia: Date = hoje()): Promise<number> {
    const membros = await this.prisma.membro.findMany({
      where: {
        ativo: true,
        valorMensalidade: { not: null },
        diaVencimento: { not: null },
      },
      select: { id: true, valorMensalidade: true, diaVencimento: true },
    });
    let criadas = 0;
    for (const membro of membros) {
      if (await this.garantirProxima(membro, referencia)) {
        criadas += 1;
      }
    }
    return criadas;
  }

  async rodarRotina(): Promise<void> {
    try {
      const criadas = await this.gerarPendentes();
      if (criadas > 0) {
        this.logger.log(`${criadas} mensalidade(s) gerada(s)`);
      }
    } catch (erro) {
      // A rotina tenta de novo na próxima hora; um erro aqui não derruba a API.
      this.logger.error('Falha ao gerar mensalidades', erro as Error);
    }
  }
}
