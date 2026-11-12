import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { compare, getRounds } from 'bcryptjs';
import { SALT_ROUNDS } from '../funcionarios/funcionarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembroDto } from './dto/create-membro.dto';
import { QueryMembroDto } from './dto/query-membro.dto';
import { UpdateMembroDto } from './dto/update-membro.dto';
import {
  MEMBRO_SELECT_COM_HASH,
  MembrosService,
  filtroBusca,
} from './membros.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

// A linha do banco; CPF gerado para testes, não pertence a ninguém.
const membro = (extra: Record<string, unknown> = {}) => ({
  id: ID,
  nome: 'Ana Pereira',
  cpf: '52998224725',
  telefone: '48999991234',
  endereco: 'Rua das Flores, 100',
  ativo: true,
  dataCadastro: new Date('2026-10-01T12:00:00.000Z'),
  senhaHash: null,
  ...extra,
});

// O que o service devolve: sem o hash, com o acessoLiberado.
const resposta = (extra: Record<string, unknown> = {}) => ({
  id: ID,
  nome: 'Ana Pereira',
  cpf: '52998224725',
  telefone: '48999991234',
  endereco: 'Rua das Flores, 100',
  ativo: true,
  dataCadastro: new Date('2026-10-01T12:00:00.000Z'),
  acessoLiberado: false,
  ...extra,
});

function erroPrisma(code: string) {
  return new PrismaClientKnownRequestError('erro do prisma', {
    code,
    clientVersion: 'test',
  });
}

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
    ['529 982', { cpf: { startsWith: '529982' } }],
    ['529 982 247 25', { cpf: { startsWith: '52998224725' } }],
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

      await expect(service.create(dto)).resolves.toEqual(resposta());
      expect(prisma.membro.findUnique).toHaveBeenCalledWith({
        where: { cpf: '52998224725' },
        select: { id: true },
      });
      expect(prisma.membro.create).toHaveBeenCalledWith({
        data: { ...dto },
        select: MEMBRO_SELECT_COM_HASH,
      });
    });

    it('lança 409 quando o CPF já está cadastrado (RN02)', async () => {
      prisma.membro.findUnique.mockResolvedValue({ id: 'outro' });

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException('CPF já cadastrado'),
      );
      expect(prisma.membro.create).not.toHaveBeenCalled();
    });

    it('lança 409 quando outro cadastro com o mesmo CPF entra antes (P2002)', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);
      prisma.membro.create.mockRejectedValue(erroPrisma('P2002'));

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException('CPF já cadastrado'),
      );
    });

    it('repassa os outros erros do Prisma', async () => {
      const erro = erroPrisma('P2003');
      prisma.membro.findUnique.mockResolvedValue(null);
      prisma.membro.create.mockRejectedValue(erro);

      await expect(service.create(dto)).rejects.toBe(erro);
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
        data: [resposta()],
        total: 41,
        page: 3,
        pageSize: 20,
      });
      expect(prisma.membro.findMany).toHaveBeenCalledWith({
        where: { ativo: undefined },
        select: MEMBRO_SELECT_COM_HASH,
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

      await expect(service.findOne(ID)).resolves.toEqual(resposta());
      expect(prisma.membro.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: MEMBRO_SELECT_COM_HASH,
      });
    });

    it('acessoLiberado vem do senhaHash, que não sai do service (RN12, RN15)', async () => {
      prisma.membro.findUnique.mockResolvedValue(
        membro({ senhaHash: '$2b$10$hashficticio' }),
      );

      const resultado = await service.findOne(ID);

      expect(resultado).toEqual(resposta({ acessoLiberado: true }));
      expect(resultado).not.toHaveProperty('senhaHash');
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
        resposta({ nome: 'Ana Paula' }),
      );
      expect(prisma.membro.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { nome: 'Ana Paula', telefone: undefined, endereco: undefined },
        select: MEMBRO_SELECT_COM_HASH,
      });
    });

    it('não repassa o CPF ao Prisma (RN02)', async () => {
      prisma.membro.findUnique.mockResolvedValue(membro());
      prisma.membro.update.mockResolvedValue(membro());
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

      await expect(service[metodo](ID)).resolves.toEqual(resposta({ ativo }));
      expect(prisma.membro.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { ativo },
        select: MEMBRO_SELECT_COM_HASH,
      });
    });

    it('lança 404 quando não existe', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(service[metodo](ID)).rejects.toThrow(NotFoundException);
      expect(prisma.membro.update).not.toHaveBeenCalled();
    });
  });

  describe('liberarAcesso (RN15)', () => {
    const MENSAGEM = 'Membro inativo não pode ter o acesso liberado';

    it('grava o hash bcrypt da senha com o SALT_ROUNDS do login e devolve sem o hash', async () => {
      prisma.membro.findUnique.mockResolvedValue({ ativo: true });
      prisma.membro.update.mockResolvedValue(
        membro({ senhaHash: 'hash-gravado' }),
      );

      const resultado = await service.liberarAcesso(ID, {
        senha: 'senha1234',
      });

      const args = primeiroArg<{
        where: unknown;
        select: unknown;
        data: { senhaHash: string };
      }>(prisma.membro.update);
      expect(args.where).toEqual({ id: ID });
      expect(args.select).toBe(MEMBRO_SELECT_COM_HASH);
      expect(args.data.senhaHash).not.toBe('senha1234');
      await expect(compare('senha1234', args.data.senhaHash)).resolves.toBe(
        true,
      );
      expect(getRounds(args.data.senhaHash)).toBe(SALT_ROUNDS);
      expect(resultado).toEqual(resposta({ acessoLiberado: true }));
      expect(resultado).not.toHaveProperty('senhaHash');
    });

    it('redefinir troca o hash', async () => {
      prisma.membro.findUnique.mockResolvedValue({ ativo: true });
      prisma.membro.update.mockResolvedValue(membro());

      await service.liberarAcesso(ID, { senha: 'senha-antiga-1' });
      await service.liberarAcesso(ID, { senha: 'senha-nova-123' });

      const [[primeira], [segunda]] = prisma.membro.update.mock.calls as [
        [{ data: { senhaHash: string } }],
        [{ data: { senhaHash: string } }],
      ];
      expect(segunda.data.senhaHash).not.toBe(primeira.data.senhaHash);
      await expect(
        compare('senha-nova-123', segunda.data.senhaHash),
      ).resolves.toBe(true);
      await expect(
        compare('senha-antiga-1', segunda.data.senhaHash),
      ).resolves.toBe(false);
    });

    it('membro inativo → 422 sem gravar', async () => {
      prisma.membro.findUnique.mockResolvedValue({ ativo: false });

      await expect(
        service.liberarAcesso(ID, { senha: 'senha1234' }),
      ).rejects.toThrow(new UnprocessableEntityException(MENSAGEM));
      expect(prisma.membro.update).not.toHaveBeenCalled();
    });

    it('inexistente → 404 sem gravar', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(
        service.liberarAcesso(ID, { senha: 'senha1234' }),
      ).rejects.toThrow(new NotFoundException('Membro não encontrado'));
      expect(prisma.membro.update).not.toHaveBeenCalled();
    });
  });

  describe('revogarAcesso', () => {
    it('grava senhaHash null e devolve acessoLiberado false', async () => {
      prisma.membro.findUnique.mockResolvedValue(membro({ senhaHash: 'hash' }));
      prisma.membro.update.mockResolvedValue(membro());

      await expect(service.revogarAcesso(ID)).resolves.toEqual(resposta());
      expect(prisma.membro.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { senhaHash: null },
        select: MEMBRO_SELECT_COM_HASH,
      });
    });

    it('revoga também o membro inativo', async () => {
      prisma.membro.findUnique.mockResolvedValue(
        membro({ ativo: false, senhaHash: 'hash' }),
      );
      prisma.membro.update.mockResolvedValue(membro({ ativo: false }));

      await expect(service.revogarAcesso(ID)).resolves.toEqual(
        resposta({ ativo: false }),
      );
    });

    it('inexistente → 404 sem gravar', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(service.revogarAcesso(ID)).rejects.toThrow(
        new NotFoundException('Membro não encontrado'),
      );
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
