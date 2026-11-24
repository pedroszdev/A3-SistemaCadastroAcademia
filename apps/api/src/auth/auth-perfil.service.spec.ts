import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hashSync } from 'bcryptjs';
import { Cargo } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService, SENHA_ATUAL_INCORRETA } from './auth.service';
import type { UsuarioAutenticado } from './usuario-autenticado';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const SENHA = 'senha1234';
const ALUNO: UsuarioAutenticado = { id: ID, tipo: 'ALUNO' };
const FUNCIONARIO: UsuarioAutenticado = {
  id: ID,
  tipo: 'FUNCIONARIO',
  cargo: Cargo.INSTRUTOR,
};

// RN20: os próprios dados e a troca de senha.
describe('AuthService (meus dados)', () => {
  let prisma: {
    funcionario: { findUnique: jest.Mock; update: jest.Mock };
    membro: { findUnique: jest.Mock; update: jest.Mock };
  };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      funcionario: { findUnique: jest.fn(), update: jest.fn() },
      membro: { findUnique: jest.fn(), update: jest.fn() },
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
    );
  });

  describe('atualizarMeusDados', () => {
    it('o aluno muda telefone e endereço', async () => {
      await service.atualizarMeusDados(ALUNO, {
        telefone: '48999990000',
        endereco: 'Rua Nova, 10',
      });

      expect(prisma.membro.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { telefone: '48999990000', endereco: 'Rua Nova, 10' },
      });
      expect(prisma.funcionario.update).not.toHaveBeenCalled();
    });

    it('o aluno não muda o nome', async () => {
      await expect(
        service.atualizarMeusDados(ALUNO, { nome: 'Outro Nome' }),
      ).rejects.toThrow(
        new BadRequestException(
          'nome do aluno só pode ser alterado pela recepção',
        ),
      );
      expect(prisma.membro.update).not.toHaveBeenCalled();
    });

    it('o funcionário muda o nome', async () => {
      await service.atualizarMeusDados(FUNCIONARIO, { nome: 'Marina Souza' });

      expect(prisma.funcionario.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { nome: 'Marina Souza' },
      });
    });

    it.each([{ telefone: '48999990000' }, { endereco: 'Rua Nova, 10' }])(
      'o funcionário não tem %o',
      async (dto) => {
        await expect(
          service.atualizarMeusDados(FUNCIONARIO, dto),
        ).rejects.toThrow(
          new BadRequestException('funcionário não tem telefone nem endereço'),
        );
        expect(prisma.funcionario.update).not.toHaveBeenCalled();
      },
    );
  });

  describe('trocarSenha', () => {
    const dto = { senhaAtual: SENHA, novaSenha: 'nova-senha-123' };

    it.each([
      ['aluno', ALUNO, 'membro'],
      ['funcionário', FUNCIONARIO, 'funcionario'],
    ] as const)(
      'o %s troca com a senha atual certa',
      async (_, usuario, tabela) => {
        prisma[tabela].findUnique.mockResolvedValue({
          senhaHash: hashSync(SENHA, 4),
        });

        await service.trocarSenha(usuario, dto);

        const [[{ data }]] = prisma[tabela].update.mock.calls as [
          [{ data: { senhaHash: string } }],
        ];
        await expect(compare('nova-senha-123', data.senhaHash)).resolves.toBe(
          true,
        );
      },
    );

    it('senha atual errada → 422, sem gravar', async () => {
      prisma.membro.findUnique.mockResolvedValue({
        senhaHash: hashSync(SENHA, 4),
      });

      await expect(
        service.trocarSenha(ALUNO, { ...dto, senhaAtual: 'errada123' }),
      ).rejects.toThrow(
        new UnprocessableEntityException(SENHA_ATUAL_INCORRETA),
      );
      expect(prisma.membro.update).not.toHaveBeenCalled();
    });

    it('sem senha gravada → 422', async () => {
      prisma.membro.findUnique.mockResolvedValue({ senhaHash: null });

      await expect(service.trocarSenha(ALUNO, dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
