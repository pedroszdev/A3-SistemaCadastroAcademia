import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MembrosService } from '../membros/membros.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTreinoDto } from './dto/create-treino.dto';
import { QueryTreinoDto } from './dto/query-treino.dto';
import {
  TREINO_DO_ALUNO_SELECT,
  TREINO_SELECT,
  TreinosService,
} from './treinos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';
const OUTRO_MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789c01';

const HOJE = new Date('2026-11-11T00:00:00.000Z');
const ONTEM = new Date('2026-11-10T00:00:00.000Z');
const AMANHA = new Date('2026-11-12T00:00:00.000Z');

const treino = (extra: Record<string, unknown> = {}) => ({
  id: ID,
  membroId: MEMBRO_ID,
  tipo: 'Musculação',
  descricao: 'Treino de peito e tríceps',
  duracao: 60,
  dataInicio: HOJE,
  membro: { id: MEMBRO_ID, nome: 'João Pereira' },
  ...extra,
});

const treinoDoAluno = (extra: Record<string, unknown> = {}) => ({
  id: ID,
  tipo: 'Musculação',
  descricao: 'Treino de peito e tríceps',
  duracao: 60,
  dataInicio: HOJE,
  ...extra,
});

function primeiroArg<T>(mock: jest.Mock): T {
  const [[arg]] = mock.mock.calls as [[T]];
  return arg;
}

describe('TreinosService', () => {
  let prisma: {
    treino: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let membros: { assertMembroAtivo: jest.Mock; findOne: jest.Mock };
  let service: TreinosService;

  // 15h UTC de 11/11/2026 é 12h em São Paulo: "hoje" é 2026-11-11
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-11T15:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    prisma = {
      treino: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    membros = { assertMembroAtivo: jest.fn(), findOne: jest.fn() };
    service = new TreinosService(
      prisma as unknown as PrismaService,
      membros as unknown as MembrosService,
    );
  });

  describe('create', () => {
    const dto: CreateTreinoDto = {
      membroId: MEMBRO_ID,
      tipo: 'Musculação',
      descricao: 'Treino de peito e tríceps',
      duracao: 60,
      dataInicio: HOJE,
    };

    it('cria o treino e devolve com o select', async () => {
      const criado = treino();
      prisma.treino.create.mockResolvedValue(criado);

      await expect(service.create(dto)).resolves.toBe(criado);

      expect(membros.assertMembroAtivo).toHaveBeenCalledWith(
        MEMBRO_ID,
        'Membro inativo não pode receber treino',
      );
      expect(prisma.treino.create).toHaveBeenCalledWith({
        data: {
          membroId: MEMBRO_ID,
          tipo: 'Musculação',
          descricao: 'Treino de peito e tríceps',
          duracao: 60,
          dataInicio: HOJE,
        },
        select: TREINO_SELECT,
      });
    });

    it('aceita dataInicio no futuro', async () => {
      prisma.treino.create.mockResolvedValue(treino());

      await service.create({ ...dto, dataInicio: AMANHA });

      expect(prisma.treino.create).toHaveBeenCalledTimes(1);
    });

    it('RN04: membro inativo → 422, sem criar', async () => {
      membros.assertMembroAtivo.mockRejectedValue(
        new UnprocessableEntityException(
          'Membro inativo não pode receber treino',
        ),
      );

      await expect(service.create(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(prisma.treino.create).not.toHaveBeenCalled();
    });

    it('membro inexistente → 404, sem criar', async () => {
      membros.assertMembroAtivo.mockRejectedValue(
        new NotFoundException('Membro não encontrado'),
      );

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(prisma.treino.create).not.toHaveBeenCalled();
    });

    it('RN05: dataInicio antes de hoje → 400, sem criar', async () => {
      await expect(
        service.create({ ...dto, dataInicio: ONTEM }),
      ).rejects.toThrow(
        new BadRequestException('dataInicio não pode ser anterior a hoje'),
      );
      expect(prisma.treino.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filtra por membro e tipo, ordena e pagina', async () => {
      const lista = [treino()];
      prisma.treino.findMany.mockResolvedValue(lista);
      prisma.treino.count.mockResolvedValue(25);
      const query = {
        membroId: MEMBRO_ID,
        tipo: 'Cardio',
        page: 2,
        pageSize: 10,
      } as QueryTreinoDto;

      await expect(service.findAll(query)).resolves.toEqual({
        data: lista,
        total: 25,
        page: 2,
        pageSize: 10,
      });

      const where = { membroId: MEMBRO_ID, tipo: 'Cardio' };
      expect(prisma.treino.findMany).toHaveBeenCalledWith({
        where,
        select: TREINO_SELECT,
        orderBy: [{ dataInicio: 'desc' }, { id: 'desc' }],
        skip: 10,
        take: 10,
      });
      expect(prisma.treino.count).toHaveBeenCalledWith({ where });
    });

    it('sem filtros lista todos desde a primeira página', async () => {
      prisma.treino.findMany.mockResolvedValue([]);
      prisma.treino.count.mockResolvedValue(0);

      await service.findAll({ page: 1, pageSize: 20 });

      const args = primeiroArg<{ where: object; skip: number; take: number }>(
        prisma.treino.findMany,
      );
      expect(args.where).toEqual({ membroId: undefined, tipo: undefined });
      expect(args.skip).toBe(0);
      expect(args.take).toBe(20);
    });
  });

  describe('findAllDoMembro', () => {
    it('confere o membro e filtra a lista por ele', async () => {
      prisma.treino.findMany.mockResolvedValue([]);
      prisma.treino.count.mockResolvedValue(0);

      await service.findAllDoMembro(MEMBRO_ID, {
        tipo: 'Cardio',
        page: 1,
        pageSize: 20,
      });

      expect(membros.findOne).toHaveBeenCalledWith(MEMBRO_ID);
      expect(
        primeiroArg<{ where: object }>(prisma.treino.findMany).where,
      ).toEqual({ membroId: MEMBRO_ID, tipo: 'Cardio' });
    });

    it('membro inexistente → 404, sem listar', async () => {
      membros.findOne.mockRejectedValue(
        new NotFoundException('Membro não encontrado'),
      );

      await expect(
        service.findAllDoMembro(MEMBRO_ID, { page: 1, pageSize: 20 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.treino.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('devolve o treino com o select', async () => {
      const encontrado = treino();
      prisma.treino.findUnique.mockResolvedValue(encontrado);

      await expect(service.findOne(ID)).resolves.toBe(encontrado);
      expect(prisma.treino.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: TREINO_SELECT,
      });
    });

    it('inexistente → 404', async () => {
      prisma.treino.findUnique.mockResolvedValue(null);

      await expect(service.findOne(ID)).rejects.toThrow(
        new NotFoundException('Treino não encontrado'),
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.treino.findUnique.mockResolvedValue(treino());
    });

    it('edita só os campos enviados', async () => {
      const editado = treino({ duracao: 50 });
      prisma.treino.update.mockResolvedValue(editado);

      await expect(service.update(ID, { duracao: 50 })).resolves.toBe(editado);

      expect(prisma.treino.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: {
          tipo: undefined,
          descricao: undefined,
          duracao: 50,
          dataInicio: undefined,
        },
        select: TREINO_SELECT,
      });
    });

    it('sem dataInicio não revalida a data, mesmo com treino antigo (RN05)', async () => {
      prisma.treino.findUnique.mockResolvedValue(
        treino({ dataInicio: new Date('2026-01-05T00:00:00.000Z') }),
      );
      prisma.treino.update.mockResolvedValue(treino());

      await service.update(ID, { descricao: 'Treino novo' });

      expect(prisma.treino.update).toHaveBeenCalledTimes(1);
    });

    it('dataInicio igual a hoje passa', async () => {
      prisma.treino.update.mockResolvedValue(treino());

      await service.update(ID, { dataInicio: HOJE });

      expect(prisma.treino.update).toHaveBeenCalledTimes(1);
    });

    it('RN05: dataInicio antes de hoje → 400, sem atualizar', async () => {
      await expect(service.update(ID, { dataInicio: ONTEM })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.treino.update).not.toHaveBeenCalled();
    });

    it('inexistente → 404, sem atualizar', async () => {
      prisma.treino.findUnique.mockResolvedValue(null);

      await expect(service.update(ID, { duracao: 50 })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.treino.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('apaga o treino e não devolve nada', async () => {
      prisma.treino.findUnique.mockResolvedValue(treino());

      await expect(service.remove(ID)).resolves.toBeUndefined();
      expect(prisma.treino.delete).toHaveBeenCalledWith({ where: { id: ID } });
    });

    it('inexistente → 404, sem apagar', async () => {
      prisma.treino.findUnique.mockResolvedValue(null);

      await expect(service.remove(ID)).rejects.toThrow(NotFoundException);
      expect(prisma.treino.delete).not.toHaveBeenCalled();
    });
  });

  describe('findDoMembro (aluno)', () => {
    it('RN16: o membroId do token vai no where e o select não expõe o membro', async () => {
      const lista = [treinoDoAluno()];
      prisma.treino.findMany.mockResolvedValue(lista);
      prisma.treino.count.mockResolvedValue(1);

      await expect(
        service.findDoMembro(MEMBRO_ID, {
          tipo: 'Musculação',
          page: 1,
          pageSize: 20,
        }),
      ).resolves.toEqual({ data: lista, total: 1, page: 1, pageSize: 20 });

      const where = { membroId: MEMBRO_ID, tipo: 'Musculação' };
      expect(prisma.treino.findMany).toHaveBeenCalledWith({
        where,
        select: TREINO_DO_ALUNO_SELECT,
        orderBy: [{ dataInicio: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 20,
      });
      expect(prisma.treino.count).toHaveBeenCalledWith({ where });
      expect(membros.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findOneDoMembro (aluno)', () => {
    it('busca pelo id e pelo membro do token', async () => {
      const encontrado = treinoDoAluno();
      prisma.treino.findUnique.mockResolvedValue(encontrado);

      await expect(service.findOneDoMembro(MEMBRO_ID, ID)).resolves.toBe(
        encontrado,
      );
      expect(prisma.treino.findUnique).toHaveBeenCalledWith({
        where: { id: ID, membroId: MEMBRO_ID },
        select: TREINO_DO_ALUNO_SELECT,
      });
    });

    it('RN16: treino de outro membro → 404', async () => {
      prisma.treino.findUnique.mockResolvedValue(null);

      await expect(
        service.findOneDoMembro(OUTRO_MEMBRO_ID, ID),
      ).rejects.toThrow(new NotFoundException('Treino não encontrado'));
      expect(prisma.treino.findUnique).toHaveBeenCalledWith({
        where: { id: ID, membroId: OUTRO_MEMBRO_ID },
        select: TREINO_DO_ALUNO_SELECT,
      });
    });

    it('inexistente → 404', async () => {
      prisma.treino.findUnique.mockResolvedValue(null);

      await expect(service.findOneDoMembro(MEMBRO_ID, ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
