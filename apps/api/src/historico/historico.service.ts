import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { paginacaoPrisma, paginate } from '../common/utils/paginate';
import type { Prisma } from '../generated/prisma/client';
import { MembrosService } from '../membros/membros.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { QueryAtividadeDto } from './dto/query-atividade.dto';

export const ATIVIDADE_SELECT = {
  id: true,
  membroId: true,
  funcionarioId: true,
  treinoId: true,
  atividade: true,
  data: true,
  tempoExecucao: true,
  membro: { select: { id: true, nome: true } },
  funcionario: { select: { id: true, nome: true } },
  treino: { select: { id: true, tipo: true } },
} as const;

@Injectable()
export class HistoricoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membros: MembrosService,
    private readonly pagamentos: PagamentosService,
  ) {}

  async registrar(dto: CreateAtividadeDto, funcionarioId: string) {
    await this.membros.assertMembroAtivo(
      dto.membroId,
      'Membro inativo não pode registrar atividade',
    );
    await this.pagamentos.assertMembroAdimplente(dto.membroId);
    if (dto.treinoId) {
      await this.assertTreinoDoMembro(dto.treinoId, dto.membroId);
    }

    return this.prisma.historicoAtividade.create({
      data: {
        membroId: dto.membroId,
        // RN11: funcionarioId vem do token, nunca do body
        funcionarioId,
        treinoId: dto.treinoId,
        atividade: dto.atividade,
        data: dto.data,
        tempoExecucao: dto.tempoExecucao,
      },
      select: ATIVIDADE_SELECT,
    });
  }

  async findAll(query: QueryAtividadeDto) {
    const where: Prisma.HistoricoAtividadeWhereInput = {
      membroId: query.membroId,
      funcionarioId: query.funcionarioId,
      data: { gte: query.dataDe, lte: query.dataAte },
    };
    const [data, total] = await Promise.all([
      this.prisma.historicoAtividade.findMany({
        where,
        select: ATIVIDADE_SELECT,
        // id (UUIDv7) desempata datas iguais, com a registrada por último primeiro,
        // e a paginação não repete nem pula
        orderBy: [{ data: 'desc' }, { id: 'desc' }],
        ...paginacaoPrisma(query),
      }),
      this.prisma.historicoAtividade.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  // RN16: com membroId (o do token, na rota do aluno), a atividade de outro membro dá 404.
  async findOne(id: string, membroId?: string) {
    const atividade = await this.prisma.historicoAtividade.findUnique({
      where: { id, membroId },
      select: ATIVIDADE_SELECT,
    });
    if (!atividade) {
      throw new NotFoundException('Atividade não encontrada');
    }
    return atividade;
  }

  async resumoMembro(
    membroId: string,
    de?: Date,
    ate?: Date,
  ): Promise<{ totalAtividades: number; totalMinutos: number }> {
    const { _count, _sum } = await this.prisma.historicoAtividade.aggregate({
      where: { membroId, data: { gte: de, lte: ate } },
      _count: { _all: true },
      _sum: { tempoExecucao: true },
    });
    return {
      totalAtividades: _count._all,
      totalMinutos: _sum.tempoExecucao ?? 0,
    };
  }

  // RN10: o treino informado precisa ser do próprio membro.
  private async assertTreinoDoMembro(treinoId: string, membroId: string) {
    const treino = await this.prisma.treino.findUnique({
      where: { id: treinoId },
      select: { membroId: true },
    });
    if (!treino) {
      throw new NotFoundException('Treino não encontrado');
    }
    if (treino.membroId !== membroId) {
      throw new UnprocessableEntityException('Treino não pertence ao membro');
    }
  }
}
