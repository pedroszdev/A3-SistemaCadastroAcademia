import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginacaoPrisma, paginate } from '../common/utils/paginate';
import type { Prisma } from '../generated/prisma/client';
import { MembrosService } from '../membros/membros.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtividadeAlunoDto } from './dto/create-atividade-aluno.dto';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import {
  QueryAtividadeDto,
  QueryAtividadeMembroDto,
  QueryMinhasAtividadesDto,
} from './dto/query-atividade.dto';

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

// HIS-05: o aluno vê do funcionário só o nome; o membro é ele mesmo.
export const ATIVIDADE_DO_ALUNO_SELECT = {
  id: true,
  treinoId: true,
  atividade: true,
  data: true,
  tempoExecucao: true,
  funcionario: { select: { nome: true } },
  treino: { select: { id: true, tipo: true } },
} as const satisfies Prisma.HistoricoAtividadeSelect;

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

  /**
   * RN19: o aluno registra a própria atividade, sem funcionário. O treino é
   * obrigatório e precisa ser dele; o de outro membro dá 404, como se não existisse
   * (RN16). Valem as mesmas RN04, RN09 e RN10 do registro pelo funcionário.
   */
  async registrarDoAluno(dto: CreateAtividadeAlunoDto, membroId: string) {
    await this.membros.assertMembroAtivo(
      membroId,
      'Membro inativo não pode registrar atividade',
    );
    await this.pagamentos.assertMembroAdimplente(membroId);
    const treino = await this.prisma.treino.findFirst({
      where: { id: dto.treinoId, membroId },
      select: { descricao: true },
    });
    if (!treino) {
      throw new NotFoundException('Treino não encontrado');
    }

    return this.prisma.historicoAtividade.create({
      data: {
        membroId,
        funcionarioId: null,
        treinoId: dto.treinoId,
        atividade: dto.atividade ?? treino.descricao.slice(0, 120),
        data: dto.data,
        tempoExecucao: dto.tempoExecucao,
      },
      select: ATIVIDADE_DO_ALUNO_SELECT,
    });
  }

  findAll(query: QueryAtividadeDto) {
    const where: Prisma.HistoricoAtividadeWhereInput = {
      membroId: query.membroId,
      funcionarioId: query.funcionarioId,
      data: { gte: query.dataDe, lte: query.dataAte },
    };
    return this.paginar(where, query, ATIVIDADE_SELECT);
  }

  async findAllDoMembro(membroId: string, query: QueryAtividadeMembroDto) {
    await this.membros.findOne(membroId);
    return this.findAll({ ...query, membroId });
  }

  findAllDoAluno(membroId: string, query: QueryMinhasAtividadesDto) {
    // RN16: membroId vem do token; o filtro fica no where.
    const where: Prisma.HistoricoAtividadeWhereInput = {
      membroId,
      data: { gte: query.dataDe, lte: query.dataAte },
    };
    return this.paginar(where, query, ATIVIDADE_DO_ALUNO_SELECT);
  }

  findOne(id: string) {
    return this.buscarAtividade({ id }, ATIVIDADE_SELECT);
  }

  findOneDoAluno(id: string, membroId: string) {
    // RN16: a atividade de outro membro dá 404, como se não existisse.
    return this.buscarAtividade({ id, membroId }, ATIVIDADE_DO_ALUNO_SELECT);
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

  private async buscarAtividade<S extends Prisma.HistoricoAtividadeSelect>(
    where: Prisma.HistoricoAtividadeWhereUniqueInput,
    select: S,
  ) {
    const atividade = await this.prisma.historicoAtividade.findUnique({
      where,
      select,
    });
    if (!atividade) {
      throw new NotFoundException('Atividade não encontrada');
    }
    return atividade;
  }

  private async paginar<S extends Prisma.HistoricoAtividadeSelect>(
    where: Prisma.HistoricoAtividadeWhereInput,
    query: PaginationQueryDto,
    select: S,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.historicoAtividade.findMany({
        where,
        select,
        // id (UUIDv7) desempata datas iguais, com a registrada por último primeiro,
        // e a paginação não repete nem pula
        orderBy: [{ data: 'desc' }, { id: 'desc' }],
        ...paginacaoPrisma(query),
      }),
      this.prisma.historicoAtividade.count({ where }),
    ]);
    return paginate(data, total, query);
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
