import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { hoje } from '../common/utils/date';
import { paginacaoPrisma, paginate } from '../common/utils/paginate';
import type { Prisma } from '../generated/prisma/client';
import { StatusPagamento } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import {
  QueryPagamentoDto,
  StatusFiltroPagamento,
} from './dto/query-pagamento.dto';
import { RegistrarPagamentoDto } from './dto/registrar-pagamento.dto';
import { calcularStatus, diasEmAtraso } from './pagamento-status';

export const PAGAMENTO_SELECT = {
  id: true,
  membroId: true,
  valor: true,
  dataVencimento: true,
  dataPagamento: true,
  status: true,
  membro: { select: { id: true, nome: true } },
} as const;

type PagamentoDoBanco = Prisma.PagamentoGetPayload<{
  select: typeof PAGAMENTO_SELECT;
}>;

// RN07: toda resposta troca o status gravado pelo calculado e traz os dias em atraso.
function apresentar(pagamento: PagamentoDoBanco, referencia: Date) {
  return {
    ...pagamento,
    valor: pagamento.valor.toNumber(),
    status: calcularStatus(pagamento, referencia),
    diasEmAtraso: diasEmAtraso(pagamento, referencia),
  };
}

// RN07: ATRASADO não existe no banco; vira PENDENTE, sem pagamento e já vencido.
function filtroStatus(
  status: StatusFiltroPagamento | undefined,
  referencia: Date,
): Prisma.PagamentoWhereInput {
  switch (status) {
    case undefined:
      return {};
    case 'ATRASADO':
      return {
        status: StatusPagamento.PENDENTE,
        dataPagamento: null,
        dataVencimento: { lt: referencia },
      };
    case 'PENDENTE':
      return {
        status: StatusPagamento.PENDENTE,
        dataPagamento: null,
        dataVencimento: { gte: referencia },
      };
    default:
      return { status };
  }
}

@Injectable()
export class PagamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePagamentoDto) {
    await this.assertMembroAtivo(dto.membroId);

    const criado = await this.prisma.pagamento.create({
      data: {
        membroId: dto.membroId,
        valor: dto.valor,
        dataVencimento: dto.dataVencimento,
      },
      select: PAGAMENTO_SELECT,
    });
    return apresentar(criado, hoje());
  }

  async findAll(query: QueryPagamentoDto) {
    const referencia = hoje();
    const where: Prisma.PagamentoWhereInput = {
      membroId: query.membroId,
      AND: [
        {
          dataVencimento: { gte: query.vencimentoDe, lte: query.vencimentoAte },
        },
        filtroStatus(query.status, referencia),
      ],
    };
    const [data, total] = await Promise.all([
      this.prisma.pagamento.findMany({
        where,
        select: PAGAMENTO_SELECT,
        // id desempata vencimentos iguais, para a paginação não repetir nem pular
        orderBy: [{ dataVencimento: 'desc' }, { id: 'asc' }],
        ...paginacaoPrisma(query),
      }),
      this.prisma.pagamento.count({ where }),
    ]);
    return paginate(
      data.map((pagamento) => apresentar(pagamento, referencia)),
      total,
      query,
    );
  }

  async findOne(id: string) {
    const pagamento = await this.prisma.pagamento.findUnique({
      where: { id },
      select: PAGAMENTO_SELECT,
    });
    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    return apresentar(pagamento, hoje());
  }

  async registrarPagamento(id: string, dto: RegistrarPagamentoDto) {
    // condicional no banco: sem janela entre ler o status e gravar (RN08)
    const { count } = await this.prisma.pagamento.updateMany({
      where: { id, status: StatusPagamento.PENDENTE },
      data: {
        status: StatusPagamento.PAGO,
        dataPagamento: dto.dataPagamento,
      },
    });
    if (count === 0) {
      await this.explicarFalha(id, 'pagar');
    }
    return this.findOne(id);
  }

  async cancelar(id: string) {
    const { count } = await this.prisma.pagamento.updateMany({
      where: { id, status: StatusPagamento.PENDENTE },
      data: { status: StatusPagamento.CANCELADO },
    });
    if (count === 0) {
      await this.explicarFalha(id, 'cancelar');
    }
    return this.findOne(id);
  }

  // RN08: a troca condicional não casou; descobre se foi 404 ou 409.
  private async explicarFalha(
    id: string,
    acao: 'pagar' | 'cancelar',
  ): Promise<never> {
    const atual = await this.prisma.pagamento.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!atual) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    if (atual.status === StatusPagamento.PAGO) {
      throw new ConflictException(
        acao === 'pagar'
          ? 'Pagamento já foi pago'
          : 'Pagamento já pago não pode ser cancelado',
      );
    }
    throw new ConflictException(
      acao === 'pagar'
        ? 'Pagamento cancelado não pode ser pago'
        : 'Pagamento já está cancelado',
    );
  }

  // Provisório até a MEM-03 exportar MembrosService.assertMembroAtivo (RN04).
  private async assertMembroAtivo(membroId: string) {
    const membro = await this.prisma.membro.findUnique({
      where: { id: membroId },
      select: { ativo: true },
    });
    if (!membro) {
      throw new NotFoundException('Membro não encontrado');
    }
    if (!membro.ativo) {
      throw new UnprocessableEntityException(
        'Membro inativo não pode receber novo pagamento',
      );
    }
  }
}
