import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MembrosService } from '../membros/membros.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { ATIVIDADE_SELECT, HistoricoService } from './historico.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';
const FUNCIONARIO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789a01';
const OUTRO_FUNCIONARIO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789a02';
const TREINO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789b01';
const OUTRO_MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789c01';

const atividade = (extra: Record<string, unknown> = {}) => ({
  id: ID,
  membroId: MEMBRO_ID,
  funcionarioId: FUNCIONARIO_ID,
  treinoId: null,
  atividade: 'Supino reto',
  data: new Date('2026-10-15'),
  tempoExecucao: 45,
  membro: { id: MEMBRO_ID, nome: 'João Pereira' },
  funcionario: { id: FUNCIONARIO_ID, nome: 'Marina Souza' },
  treino: null,
  ...extra,
});

function primeiroArg<T>(mock: jest.Mock): T {
  const [[arg]] = mock.mock.calls as [[T]];
  return arg;
}

describe('HistoricoService', () => {
  let prisma: {
    historicoAtividade: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      aggregate: jest.Mock;
    };
    treino: { findUnique: jest.Mock };
  };
  let membros: { assertMembroAtivo: jest.Mock };
  let pagamentos: { assertMembroAdimplente: jest.Mock };
  let service: HistoricoService;

  beforeEach(() => {
    prisma = {
      historicoAtividade: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        aggregate: jest.fn(),
      },
      treino: { findUnique: jest.fn() },
    };
    membros = { assertMembroAtivo: jest.fn() };
    pagamentos = { assertMembroAdimplente: jest.fn() };
    service = new HistoricoService(
      prisma as unknown as PrismaService,
      membros as unknown as MembrosService,
      pagamentos as unknown as PagamentosService,
    );
  });

  describe('registrar', () => {
    const dto: CreateAtividadeDto = {
      membroId: MEMBRO_ID,
      atividade: 'Supino reto',
      data: new Date('2026-10-15'),
      tempoExecucao: 45,
    };

    it('registra sem treino, checando membro ativo e adimplente antes de gravar', async () => {
      const criada = atividade();
      prisma.historicoAtividade.create.mockResolvedValue(criada);

      const resultado = await service.registrar(dto, FUNCIONARIO_ID);

      expect(membros.assertMembroAtivo).toHaveBeenCalledWith(
        MEMBRO_ID,
        'Membro inativo não pode registrar atividade',
      );
      expect(pagamentos.assertMembroAdimplente).toHaveBeenCalledWith(MEMBRO_ID);
      expect(prisma.treino.findUnique).not.toHaveBeenCalled();
      expect(prisma.historicoAtividade.create).toHaveBeenCalledWith({
        data: {
          membroId: MEMBRO_ID,
          funcionarioId: FUNCIONARIO_ID,
          treinoId: undefined,
          atividade: 'Supino reto',
          data: dto.data,
          tempoExecucao: 45,
        },
        select: ATIVIDADE_SELECT,
      });
      expect(
        membros.assertMembroAtivo.mock.invocationCallOrder[0],
      ).toBeLessThan(
        pagamentos.assertMembroAdimplente.mock.invocationCallOrder[0],
      );
      expect(
        pagamentos.assertMembroAdimplente.mock.invocationCallOrder[0],
      ).toBeLessThan(
        prisma.historicoAtividade.create.mock.invocationCallOrder[0],
      );
      expect(resultado).toBe(criada);
    });

    it('registra com treino do mesmo membro', async () => {
      prisma.treino.findUnique.mockResolvedValue({ membroId: MEMBRO_ID });
      prisma.historicoAtividade.create.mockResolvedValue(
        atividade({ treinoId: TREINO_ID }),
      );

      await service.registrar({ ...dto, treinoId: TREINO_ID }, FUNCIONARIO_ID);

      expect(prisma.treino.findUnique).toHaveBeenCalledWith({
        where: { id: TREINO_ID },
        select: { membroId: true },
      });
      expect(prisma.historicoAtividade.create).toHaveBeenCalledWith({
        data: {
          membroId: MEMBRO_ID,
          funcionarioId: FUNCIONARIO_ID,
          treinoId: TREINO_ID,
          atividade: 'Supino reto',
          data: dto.data,
          tempoExecucao: 45,
        },
        select: ATIVIDADE_SELECT,
      });
    });

    it('grava o funcionarioId recebido, mesmo que o dto traga outro (RN11)', async () => {
      prisma.historicoAtividade.create.mockResolvedValue(atividade());
      const dtoContrabandeado = {
        ...dto,
        funcionarioId: OUTRO_FUNCIONARIO_ID,
      } as CreateAtividadeDto;

      await service.registrar(dtoContrabandeado, FUNCIONARIO_ID);

      const { data } = primeiroArg<{ data: { funcionarioId: string } }>(
        prisma.historicoAtividade.create,
      );
      expect(data.funcionarioId).toBe(FUNCIONARIO_ID);
    });

    it('propaga 422 quando o membro está inativo (RN04), sem gravar', async () => {
      membros.assertMembroAtivo.mockRejectedValue(
        new UnprocessableEntityException(
          'Membro inativo não pode registrar atividade',
        ),
      );

      await expect(service.registrar(dto, FUNCIONARIO_ID)).rejects.toThrow(
        new UnprocessableEntityException(
          'Membro inativo não pode registrar atividade',
        ),
      );
      expect(pagamentos.assertMembroAdimplente).not.toHaveBeenCalled();
      expect(prisma.historicoAtividade.create).not.toHaveBeenCalled();
    });

    it('propaga 404 quando o membro não existe, sem gravar', async () => {
      membros.assertMembroAtivo.mockRejectedValue(
        new NotFoundException('Membro não encontrado'),
      );

      await expect(service.registrar(dto, FUNCIONARIO_ID)).rejects.toThrow(
        new NotFoundException('Membro não encontrado'),
      );
      expect(prisma.historicoAtividade.create).not.toHaveBeenCalled();
    });

    it('propaga 422 quando o membro está inadimplente (RN09), sem gravar', async () => {
      pagamentos.assertMembroAdimplente.mockRejectedValue(
        new UnprocessableEntityException('Membro com pagamento em atraso'),
      );

      await expect(service.registrar(dto, FUNCIONARIO_ID)).rejects.toThrow(
        'Membro com pagamento em atraso',
      );
      expect(prisma.historicoAtividade.create).not.toHaveBeenCalled();
    });

    it('lança 404 quando o treino não existe (RN10), sem gravar', async () => {
      prisma.treino.findUnique.mockResolvedValue(null);

      await expect(
        service.registrar({ ...dto, treinoId: TREINO_ID }, FUNCIONARIO_ID),
      ).rejects.toThrow(new NotFoundException('Treino não encontrado'));
      expect(prisma.historicoAtividade.create).not.toHaveBeenCalled();
    });

    it('lança 422 quando o treino é de outro membro (RN10), sem gravar', async () => {
      prisma.treino.findUnique.mockResolvedValue({ membroId: OUTRO_MEMBRO_ID });

      await expect(
        service.registrar({ ...dto, treinoId: TREINO_ID }, FUNCIONARIO_ID),
      ).rejects.toThrow(
        new UnprocessableEntityException('Treino não pertence ao membro'),
      );
      expect(prisma.historicoAtividade.create).not.toHaveBeenCalled();
    });
  });
});
