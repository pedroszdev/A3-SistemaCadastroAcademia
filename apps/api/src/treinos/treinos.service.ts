import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { hoje } from '../common/utils/date';
import { paginacaoPrisma, paginate } from '../common/utils/paginate';
import type { Prisma } from '../generated/prisma/client';
import { MembrosService } from '../membros/membros.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTreinoDto } from './dto/create-treino.dto';
import { QueryTreinoDto, QueryTreinoMembroDto } from './dto/query-treino.dto';
import { UpdateTreinoDto } from './dto/update-treino.dto';

export const TREINO_SELECT = {
  id: true,
  membroId: true,
  tipo: true,
  descricao: true,
  duracao: true,
  dataInicio: true,
  membro: { select: { id: true, nome: true } },
} as const;

// TRE-05: o aluno vê o treino sem o membro, que é ele mesmo.
export const TREINO_DO_ALUNO_SELECT = {
  id: true,
  tipo: true,
  descricao: true,
  duracao: true,
  dataInicio: true,
} as const satisfies Prisma.TreinoSelect;

// RN05: a data de início não pode ser anterior a hoje (dia corrente da academia).
export function assertDataNaoAnteriorAHoje(data: Date) {
  if (data.getTime() < hoje().getTime()) {
    throw new BadRequestException('dataInicio não pode ser anterior a hoje');
  }
}

@Injectable()
export class TreinosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membros: MembrosService,
  ) {}

  async create(dto: CreateTreinoDto) {
    // RN04: membro inativo não recebe treino.
    await this.membros.assertMembroAtivo(
      dto.membroId,
      'Membro inativo não pode receber treino',
    );
    assertDataNaoAnteriorAHoje(dto.dataInicio);

    return this.prisma.treino.create({
      data: {
        membroId: dto.membroId,
        tipo: dto.tipo,
        descricao: dto.descricao,
        duracao: dto.duracao,
        dataInicio: dto.dataInicio,
      },
      select: TREINO_SELECT,
    });
  }

  findAll(query: QueryTreinoDto) {
    const where: Prisma.TreinoWhereInput = {
      membroId: query.membroId,
      tipo: query.tipo,
    };
    return this.paginar(where, query, TREINO_SELECT);
  }

  async findAllDoMembro(membroId: string, query: QueryTreinoMembroDto) {
    await this.membros.findOne(membroId);
    return this.findAll({ ...query, membroId });
  }

  findOne(id: string) {
    return this.buscarTreino({ id }, TREINO_SELECT);
  }

  async update(id: string, dto: UpdateTreinoDto) {
    const atual = await this.findOne(id);
    // RN05 vale para a data nova: reenviar a já salva (um treino que começou no
    // passado) não é troca de data, e o formulário de edição manda todos os campos.
    if (
      dto.dataInicio !== undefined &&
      dto.dataInicio.getTime() !== atual.dataInicio.getTime()
    ) {
      assertDataNaoAnteriorAHoje(dto.dataInicio);
    }

    return this.prisma.treino.update({
      where: { id },
      data: {
        tipo: dto.tipo,
        descricao: dto.descricao,
        duracao: dto.duracao,
        dataInicio: dto.dataInicio,
      },
      select: TREINO_SELECT,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    // as atividades do treino ficam com treinoId = null pela FK (onDelete: SetNull)
    await this.prisma.treino.delete({ where: { id } });
  }

  findDoMembro(membroId: string, query: QueryTreinoMembroDto) {
    // RN16: membroId vem do token; o filtro fica no where.
    const where: Prisma.TreinoWhereInput = { membroId, tipo: query.tipo };
    return this.paginar(where, query, TREINO_DO_ALUNO_SELECT);
  }

  findOneDoMembro(membroId: string, id: string) {
    // RN16: o treino de outro membro dá 404, como se não existisse.
    return this.buscarTreino({ id, membroId }, TREINO_DO_ALUNO_SELECT);
  }

  private async buscarTreino<S extends Prisma.TreinoSelect>(
    where: Prisma.TreinoWhereUniqueInput,
    select: S,
  ) {
    const treino = await this.prisma.treino.findUnique({ where, select });
    if (!treino) {
      throw new NotFoundException('Treino não encontrado');
    }
    return treino;
  }

  private async paginar<S extends Prisma.TreinoSelect>(
    where: Prisma.TreinoWhereInput,
    query: PaginationQueryDto,
    select: S,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.treino.findMany({
        where,
        select,
        // id (UUIDv7) desempata datas iguais e a paginação não repete nem pula
        orderBy: [{ dataInicio: 'desc' }, { id: 'desc' }],
        ...paginacaoPrisma(query),
      }),
      this.prisma.treino.count({ where }),
    ]);
    return paginate(data, total, query);
  }
}
