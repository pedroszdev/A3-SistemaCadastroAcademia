import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembroDto } from './dto/create-membro.dto';
import { QueryMembroDto } from './dto/query-membro.dto';
import { UpdateMembroDto } from './dto/update-membro.dto';
import { MEMBRO_SELECT, MembrosService, filtroBusca } from './membros.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

// CPF gerado para testes, não pertence a ninguém.
const membro = (extra: Record<string, unknown> = {}) => ({
  id: ID,
  nome: 'Ana Pereira',
  cpf: '52998224725',
  telefone: '48999991234',
  endereco: 'Rua das Flores, 100',
  ativo: true,
  dataCadastro: new Date('2026-10-01T12:00:00.000Z'),
  ...extra,
});

function primeiroArg<T>(mock: jest.Mock): T {
  const [[arg]] = mock.mock.calls as [[T]];
  return arg;
}

describe('filtroBusca', () => {
  it.each([
    [undefined, {}],
    ['', {}],
    ['ana', { nome: { contains: 'ana', mode: 'insensitive' } }],
    ['Ana Pereira', { nome: { contains: 'Ana Pereira', mode: 'insensitive' } }],
    ['52998224725', { cpf: { startsWith: '52998224725' } }],
    ['529.982', { cpf: { startsWith: '529982' } }],
    ['529.982.247-25', { cpf: { startsWith: '52998224725' } }],
    ['ana1', { nome: { contains: 'ana1', mode: 'insensitive' } }],
  ])('"%s" → %o', (busca, esperado) => {
    expect(filtroBusca(busca)).toEqual(esperado);
  });
});

describe('MembrosService', () => {
  let prisma: {
    membro: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: MembrosService;

  beforeEach(() => {
    prisma = {
      membro: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new MembrosService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    const dto: CreateMembroDto = {
      nome: 'Ana Pereira',
      cpf: '52998224725',
      telefone: '48999991234',
      endereco: 'Rua das Flores, 100',
    };

    it('cria o membro com os dados do dto', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);
      prisma.membro.create.mockResolvedValue(membro());

      await expect(service.create(dto)).resolves.toEqual(membro());
      expect(prisma.membro.findUnique).toHaveBeenCalledWith({
        where: { cpf: '52998224725' },
        select: { id: true },
      });
      expect(prisma.membro.create).toHaveBeenCalledWith({
        data: { ...dto },
        select: MEMBRO_SELECT,
      });
    });

    it('lança 409 quando o CPF já está cadastrado (RN02)', async () => {
      prisma.membro.findUnique.mockResolvedValue({ id: 'outro' });

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException('CPF já cadastrado'),
      );
      expect(prisma.membro.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      prisma.membro.findMany.mockResolvedValue([membro()]);
      prisma.membro.count.mockResolvedValue(41);
    });

    it('pagina, ordena por nome e devolve no formato padrão', async () => {
      const query = { page: 3, pageSize: 20 } as QueryMembroDto;

      await expect(service.findAll(query)).resolves.toEqual({
        data: [membro()],
        total: 41,
        page: 3,
        pageSize: 20,
      });
      expect(prisma.membro.findMany).toHaveBeenCalledWith({
        where: { ativo: undefined },
        select: MEMBRO_SELECT,
        orderBy: [{ nome: 'asc' }, { id: 'asc' }],
        skip: 40,
        take: 20,
      });
      expect(prisma.membro.count).toHaveBeenCalledWith({
        where: { ativo: undefined },
      });
    });

    it('busca por nome parcial e filtra por ativo', async () => {
      const query = {
        page: 1,
        pageSize: 10,
        busca: 'ana',
        ativo: false,
      } as QueryMembroDto;

      await service.findAll(query);

      const where = {
        ativo: false,
        nome: { contains: 'ana', mode: 'insensitive' },
      };
      expect(
        primeiroArg<{ where: unknown }>(prisma.membro.findMany).where,
      ).toEqual(where);
      expect(prisma.membro.count).toHaveBeenCalledWith({ where });
    });

    it('busca pelo CPF com máscara', async () => {
      const query = {
        page: 1,
        pageSize: 20,
        busca: '529.982.247-25',
      } as QueryMembroDto;

      await service.findAll(query);

      expect(
        primeiroArg<{ where: unknown }>(prisma.membro.findMany).where,
      ).toEqual({
        ativo: undefined,
        cpf: { startsWith: '52998224725' },
      });
    });
  });

  describe('findOne', () => {
    it('devolve o membro', async () => {
      prisma.membro.findUnique.mockResolvedValue(membro());

      await expect(service.findOne(ID)).resolves.toEqual(membro());
      expect(prisma.membro.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: MEMBRO_SELECT,
      });
    });

    it('lança 404 quando não existe', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(service.findOne(ID)).rejects.toThrow(
        new NotFoundException('Membro não encontrado'),
      );
    });
  });

  describe('update', () => {
    it('atualiza só nome, telefone e endereço', async () => {
      prisma.membro.findUnique.mockResolvedValue(membro());
      prisma.membro.update.mockResolvedValue(membro({ nome: 'Ana Paula' }));
      const dto = { nome: 'Ana Paula' } as UpdateMembroDto;

      await expect(service.update(ID, dto)).resolves.toEqual(
        membro({ nome: 'Ana Paula' }),
      );
      expect(prisma.membro.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { nome: 'Ana Paula', telefone: undefined, endereco: undefined },
        select: MEMBRO_SELECT,
      });
    });

    it('não repassa o CPF ao Prisma (RN02)', async () => {
      prisma.membro.findUnique.mockResolvedValue(membro());
      const dto = { cpf: '11144477735' } as unknown as UpdateMembroDto;

      await service.update(ID, dto);

      const args = primeiroArg<{ data: object }>(prisma.membro.update);
      expect(args.data).not.toHaveProperty('cpf');
    });

    it('lança 404 sem tentar atualizar quando não existe', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(service.update(ID, {})).rejects.toThrow(NotFoundException);
      expect(prisma.membro.update).not.toHaveBeenCalled();
    });
  });

  describe.each([
    ['desativar', false],
    ['reativar', true],
  ] as const)('%s (RN03)', (metodo, ativo) => {
    it(`grava ativo = ${ativo}`, async () => {
      prisma.membro.findUnique.mockResolvedValue(membro({ ativo: !ativo }));
      prisma.membro.update.mockResolvedValue(membro({ ativo }));

      await expect(service[metodo](ID)).resolves.toEqual(membro({ ativo }));
      expect(prisma.membro.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { ativo },
        select: MEMBRO_SELECT,
      });
    });

    it('lança 404 quando não existe', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(service[metodo](ID)).rejects.toThrow(NotFoundException);
      expect(prisma.membro.update).not.toHaveBeenCalled();
    });
  });

  describe('assertMembroAtivo (RN04)', () => {
    it('passa quando o membro está ativo', async () => {
      prisma.membro.findUnique.mockResolvedValue({ ativo: true });

      await expect(service.assertMembroAtivo(ID)).resolves.toBeUndefined();
      expect(prisma.membro.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: { ativo: true },
      });
    });

    it('lança 404 quando o membro não existe', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(service.assertMembroAtivo(ID)).rejects.toThrow(
        new NotFoundException('Membro não encontrado'),
      );
    });

    it('lança 422 quando o membro está inativo', async () => {
      prisma.membro.findUnique.mockResolvedValue({ ativo: false });

      await expect(service.assertMembroAtivo(ID)).rejects.toThrow(
        new UnprocessableEntityException('Membro inativo'),
      );
    });

    it('usa a mensagem de quem chama no 422', async () => {
      prisma.membro.findUnique.mockResolvedValue({ ativo: false });

      await expect(
        service.assertMembroAtivo(
          ID,
          'Membro inativo não pode receber novo treino',
        ),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'Membro inativo não pode receber novo treino',
        ),
      );
    });
  });
});
