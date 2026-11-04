import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MembrosService } from '../membros/membros.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';

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
