import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MembrosService } from '../membros/membros.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtividadeAlunoDto } from './dto/create-atividade-aluno.dto';
import {
  ATIVIDADE_DO_ALUNO_SELECT,
  HistoricoService,
} from './historico.service';

const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';
const TREINO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789b01';

// RN19: o aluno registra a própria atividade, num treino dele.
describe('HistoricoService.registrarDoAluno', () => {
  let prisma: {
    historicoAtividade: { create: jest.Mock };
    treino: { findFirst: jest.Mock };
  };
  let membros: { assertMembroAtivo: jest.Mock };
  let pagamentos: { assertMembroAdimplente: jest.Mock };
  let service: HistoricoService;

  const dto: CreateAtividadeAlunoDto = {
    treinoId: TREINO_ID,
    data: new Date('2026-11-24'),
    tempoExecucao: 50,
  };

  beforeEach(() => {
    prisma = {
      historicoAtividade: { create: jest.fn().mockResolvedValue({ id: 'a1' }) },
      treino: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ descricao: 'Treino A: peito e tríceps' }),
      },
    };
    membros = { assertMembroAtivo: jest.fn() };
    pagamentos = { assertMembroAdimplente: jest.fn() };
    service = new HistoricoService(
      prisma as unknown as PrismaService,
      membros as unknown as MembrosService,
      pagamentos as unknown as PagamentosService,
    );
  });

  it('grava sem funcionário e com a descrição do treino como atividade', async () => {
    await expect(service.registrarDoAluno(dto, MEMBRO_ID)).resolves.toEqual({
      id: 'a1',
    });

    expect(prisma.treino.findFirst).toHaveBeenCalledWith({
      where: { id: TREINO_ID, membroId: MEMBRO_ID },
      select: { descricao: true },
    });
    expect(prisma.historicoAtividade.create).toHaveBeenCalledWith({
      data: {
        membroId: MEMBRO_ID,
        funcionarioId: null,
        treinoId: TREINO_ID,
        atividade: 'Treino A: peito e tríceps',
        data: dto.data,
        tempoExecucao: 50,
      },
      select: ATIVIDADE_DO_ALUNO_SELECT,
    });
  });

  it('usa o texto do aluno quando ele escreve um', async () => {
    await service.registrarDoAluno(
      { ...dto, atividade: 'Só peito hoje' },
      MEMBRO_ID,
    );

    const [[{ data }]] = prisma.historicoAtividade.create.mock.calls as [
      [{ data: { atividade: string } }],
    ];
    expect(data.atividade).toBe('Só peito hoje');
  });

  it('corta a descrição longa do treino em 120 caracteres', async () => {
    prisma.treino.findFirst.mockResolvedValue({ descricao: 'x'.repeat(300) });

    await service.registrarDoAluno(dto, MEMBRO_ID);

    const [[{ data }]] = prisma.historicoAtividade.create.mock.calls as [
      [{ data: { atividade: string } }],
    ];
    expect(data.atividade).toHaveLength(120);
  });

  it('treino de outro membro → 404, sem gravar (RN16)', async () => {
    prisma.treino.findFirst.mockResolvedValue(null);

    await expect(service.registrarDoAluno(dto, MEMBRO_ID)).rejects.toThrow(
      new NotFoundException('Treino não encontrado'),
    );
    expect(prisma.historicoAtividade.create).not.toHaveBeenCalled();
  });

  it('inadimplente → 422, sem gravar (RN09)', async () => {
    pagamentos.assertMembroAdimplente.mockRejectedValue(
      new UnprocessableEntityException('Membro com pagamento em atraso'),
    );

    await expect(service.registrarDoAluno(dto, MEMBRO_ID)).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(prisma.historicoAtividade.create).not.toHaveBeenCalled();
  });

  it('confere que o membro está ativo (RN04)', async () => {
    await service.registrarDoAluno(dto, MEMBRO_ID);

    expect(membros.assertMembroAtivo).toHaveBeenCalledWith(
      MEMBRO_ID,
      'Membro inativo não pode registrar atividade',
    );
  });
});
