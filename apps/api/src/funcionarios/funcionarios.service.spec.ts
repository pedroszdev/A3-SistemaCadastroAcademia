import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { compare } from 'bcryptjs';
import { Cargo } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { QueryFuncionarioDto } from './dto/query-funcionario.dto';
import {
  FUNCIONARIO_SELECT,
  FuncionariosService,
} from './funcionarios.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

const funcionario = (extra: Record<string, unknown> = {}) => ({
  id: ID,
  nome: 'Maria Souza',
  cargo: Cargo.RECEPCIONISTA,
  login: 'maria01',
  ativo: true,
  ...extra,
});

function primeiroArg<T>(mock: jest.Mock): T {
  const [[arg]] = mock.mock.calls as [[T]];
  return arg;
}

describe('FuncionariosService', () => {
  let prisma: {
    funcionario: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: FuncionariosService;

  beforeEach(() => {
    prisma = {
      funcionario: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new FuncionariosService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    const dto = {
      nome: 'Maria Souza',
      cargo: Cargo.RECEPCIONISTA,
      login: 'maria01',
      senha: 'senha1234',
    } as CreateFuncionarioDto;

    it('salva a senha em hash bcrypt e devolve sem senhaHash', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(null);
      prisma.funcionario.create.mockResolvedValue(funcionario());

      const criado = await service.create(dto);

      const args = primeiroArg<{
        data: { senhaHash: string };
        select: unknown;
      }>(prisma.funcionario.create);
      expect(args.data.senhaHash).not.toBe(dto.senha);
      await expect(compare(dto.senha, args.data.senhaHash)).resolves.toBe(true);
      expect(args.select).toBe(FUNCIONARIO_SELECT);
      expect(criado).not.toHaveProperty('senhaHash');
    });

    it('lança 409 quando o login já existe', async () => {
      prisma.funcionario.findUnique.mockResolvedValue({ id: 'outro' });

      await expect(service.create(dto)).rejects.toThrow(
        new ConflictException('Login já cadastrado'),
      );
      expect(prisma.funcionario.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filtra, pagina e devolve no formato padrão', async () => {
      const lista = [funcionario()];
      prisma.funcionario.findMany.mockResolvedValue(lista);
      prisma.funcionario.count.mockResolvedValue(21);
      const query = {
        cargo: Cargo.ADMIN,
        ativo: false,
        page: 2,
        pageSize: 10,
      } as QueryFuncionarioDto;

      const resultado = await service.findAll(query);

      const where = { cargo: Cargo.ADMIN, ativo: false };
      expect(prisma.funcionario.findMany).toHaveBeenCalledWith({
        where,
        select: FUNCIONARIO_SELECT,
        orderBy: { nome: 'asc' },
        skip: 10,
        take: 10,
      });
      expect(prisma.funcionario.count).toHaveBeenCalledWith({ where });
      expect(resultado).toEqual({
        data: lista,
        total: 21,
        page: 2,
        pageSize: 10,
      });
    });
  });

  describe('findOne', () => {
    it('devolve o funcionário com o select explícito', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(funcionario());

      await expect(service.findOne(ID)).resolves.toEqual(funcionario());
      expect(prisma.funcionario.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: FUNCIONARIO_SELECT,
      });
    });

    it('lança 404 quando não existe', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(null);

      await expect(service.findOne(ID)).rejects.toThrow(
        new NotFoundException('Funcionário não encontrado'),
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.funcionario.update.mockResolvedValue(funcionario());
    });

    it('refaz o hash quando vem senha nova', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(funcionario());

      await service.update(ID, { nome: 'Novo Nome', senha: 'novaSenha123' });

      const args = primeiroArg<{
        where: unknown;
        data: { nome: string; senhaHash: string };
        select: unknown;
      }>(prisma.funcionario.update);
      expect(args.where).toEqual({ id: ID });
      expect(args.data.nome).toBe('Novo Nome');
      await expect(compare('novaSenha123', args.data.senhaHash)).resolves.toBe(
        true,
      );
      expect(args.select).toBe(FUNCIONARIO_SELECT);
    });

    it('não toca no hash quando não vem senha', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(funcionario());

      await service.update(ID, { nome: 'Novo Nome' });

      const args = primeiroArg<{
        data: Record<string, unknown>;
      }>(prisma.funcionario.update);
      expect(args.data).not.toHaveProperty('senhaHash');
    });

    it('lança 404 quando não existe', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(null);

      await expect(service.update(ID, { nome: 'Novo Nome' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.funcionario.update).not.toHaveBeenCalled();
    });

    it('bloqueia trocar o cargo do último ADMIN ativo (422)', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        funcionario({ cargo: Cargo.ADMIN }),
      );
      prisma.funcionario.count.mockResolvedValue(1);

      await expect(
        service.update(ID, { cargo: Cargo.INSTRUTOR }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(prisma.funcionario.update).not.toHaveBeenCalled();
    });

    it('permite trocar o cargo de um ADMIN havendo outro ativo', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        funcionario({ cargo: Cargo.ADMIN }),
      );
      prisma.funcionario.count.mockResolvedValue(2);

      await service.update(ID, { cargo: Cargo.INSTRUTOR });

      expect(prisma.funcionario.update).toHaveBeenCalledTimes(1);
    });

    it('não conta admins ao manter o cargo ADMIN', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        funcionario({ cargo: Cargo.ADMIN }),
      );

      await service.update(ID, { cargo: Cargo.ADMIN });

      expect(prisma.funcionario.count).not.toHaveBeenCalled();
    });

    it('não conta admins quando o ADMIN já está inativo', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        funcionario({ cargo: Cargo.ADMIN, ativo: false }),
      );

      await service.update(ID, { cargo: Cargo.INSTRUTOR });

      expect(prisma.funcionario.count).not.toHaveBeenCalled();
    });
  });

  describe('desativar', () => {
    beforeEach(() => {
      prisma.funcionario.update.mockResolvedValue(
        funcionario({ ativo: false }),
      );
    });

    it('desativa um funcionário que não é ADMIN sem contar admins', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(funcionario());

      const resultado = await service.desativar(ID);

      expect(prisma.funcionario.count).not.toHaveBeenCalled();
      expect(prisma.funcionario.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { ativo: false },
        select: FUNCIONARIO_SELECT,
      });
      expect(resultado).not.toHaveProperty('senhaHash');
    });

    it('bloqueia a auto-desativação (422) sem tocar no banco', async () => {
      await expect(service.desativar(ID, ID)).rejects.toThrow(
        new UnprocessableEntityException(
          'Você não pode desativar o próprio usuário',
        ),
      );
      expect(prisma.funcionario.findUnique).not.toHaveBeenCalled();
      expect(prisma.funcionario.update).not.toHaveBeenCalled();
    });

    it('bloqueia desativar o último ADMIN ativo (422)', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        funcionario({ cargo: Cargo.ADMIN }),
      );
      prisma.funcionario.count.mockResolvedValue(1);

      await expect(service.desativar(ID, 'outro')).rejects.toThrow(
        new UnprocessableEntityException(
          'O sistema precisa de pelo menos um administrador ativo',
        ),
      );
      expect(prisma.funcionario.count).toHaveBeenCalledWith({
        where: { cargo: Cargo.ADMIN, ativo: true },
      });
      expect(prisma.funcionario.update).not.toHaveBeenCalled();
    });

    it('desativa um ADMIN havendo outro ativo', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        funcionario({ cargo: Cargo.ADMIN }),
      );
      prisma.funcionario.count.mockResolvedValue(2);

      await service.desativar(ID);

      expect(prisma.funcionario.update).toHaveBeenCalledTimes(1);
    });

    it('lança 404 quando não existe', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(null);

      await expect(service.desativar(ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reativar', () => {
    it('marca o funcionário como ativo', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        funcionario({ ativo: false }),
      );
      prisma.funcionario.update.mockResolvedValue(funcionario());

      await service.reativar(ID);

      expect(prisma.funcionario.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { ativo: true },
        select: FUNCIONARIO_SELECT,
      });
    });

    it('lança 404 quando não existe', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(null);

      await expect(service.reativar(ID)).rejects.toThrow(NotFoundException);
      expect(prisma.funcionario.update).not.toHaveBeenCalled();
    });
  });

  it('FUNCIONARIO_SELECT não expõe senhaHash', () => {
    expect(FUNCIONARIO_SELECT).not.toHaveProperty('senhaHash');
  });
});
