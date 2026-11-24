import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hashSync } from 'bcryptjs';
import { hashSenha, SALT_ROUNDS } from '../common/utils/senha';
import { isCpfValido } from '../common/validators/cpf';
import { FUNCIONARIO_SELECT } from '../funcionarios/funcionarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarMeusDadosDto } from './dto/atualizar-meus-dados.dto';
import { LoginAlunoDto } from './dto/login-aluno.dto';
import { LoginDto } from './dto/login.dto';
import { TrocarSenhaDto } from './dto/trocar-senha.dto';
import type { TokenPayload, UsuarioAutenticado } from './usuario-autenticado';

// O tempo do compare só não revela se a conta existe enquanto todo senhaHash
// (de funcionário e de aluno, inclusive o da MEM-07) usar este mesmo SALT_ROUNDS.
const HASH_FICTICIO = hashSync(randomUUID(), SALT_ROUNDS);
const CREDENCIAL_INVALIDA = 'Login ou senha inválidos';
export const SENHA_ATUAL_INCORRETA = 'Senha atual incorreta';

// RN20: o campo que cada tipo de usuário não muda nos próprios dados.
function campoProibido(
  usuario: UsuarioAutenticado,
  dto: AtualizarMeusDadosDto,
): string | null {
  if (usuario.tipo === 'ALUNO') {
    return dto.nome === undefined
      ? null
      : 'nome do aluno só pode ser alterado pela recepção';
  }
  if (dto.telefone !== undefined || dto.endereco !== undefined) {
    return 'funcionário não tem telefone nem endereço';
  }
  return null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // O Postgres recusa NUL em texto: esse login não existe e vira o 401 genérico.
    const funcionario = dto.login.includes('\0')
      ? null
      : await this.prisma.funcionario.findUnique({
          where: { login: dto.login },
          select: { ...FUNCIONARIO_SELECT, senhaHash: true },
        });

    // Compara sempre, mesmo sem funcionário, para o tempo de resposta não
    // revelar se o login existe.
    const senhaConfere = await compare(
      dto.senha,
      funcionario?.senhaHash ?? HASH_FICTICIO,
    );
    if (!funcionario || !senhaConfere || !funcionario.ativo) {
      throw new UnauthorizedException(CREDENCIAL_INVALIDA);
    }

    const payload: TokenPayload = {
      sub: funcionario.id,
      tipo: 'FUNCIONARIO',
      cargo: funcionario.cargo,
    };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        cargo: funcionario.cargo,
      },
    };
  }

  async loginAluno(dto: LoginAlunoDto) {
    // CPF inválido não existe: vira o 401 genérico sem ir ao banco.
    const membro = isCpfValido(dto.cpf)
      ? await this.prisma.membro.findUnique({
          where: { cpf: dto.cpf },
          select: { id: true, nome: true, ativo: true, senhaHash: true },
        })
      : null;

    // Compara sempre, para o tempo de resposta não revelar se o CPF existe.
    const senhaConfere = await compare(
      dto.senha,
      membro?.senhaHash ?? HASH_FICTICIO,
    );
    if (!membro?.senhaHash || !senhaConfere || !membro.ativo) {
      throw new UnauthorizedException(CREDENCIAL_INVALIDA);
    }

    const payload: TokenPayload = { sub: membro.id, tipo: 'ALUNO' };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, aluno: { id: membro.id, nome: membro.nome } };
  }

  /**
   * RN20: cada um muda os próprios dados; o id vem do token. Devolve só se gravou:
   * quem chama busca o perfil atualizado pelo GET /auth/me.
   */
  async atualizarMeusDados(
    usuario: UsuarioAutenticado,
    dto: AtualizarMeusDadosDto,
  ): Promise<void> {
    const proibido = campoProibido(usuario, dto);
    if (proibido) {
      throw new BadRequestException(proibido);
    }
    if (usuario.tipo === 'ALUNO') {
      await this.prisma.membro.update({
        where: { id: usuario.id },
        data: { telefone: dto.telefone, endereco: dto.endereco },
      });
    } else {
      await this.prisma.funcionario.update({
        where: { id: usuario.id },
        data: { nome: dto.nome },
      });
    }
  }

  // RN20: só troca com a senha atual certa. 422, e não 401: o token continua válido
  // e o web não deve encerrar a sessão por uma senha digitada errado.
  async trocarSenha(
    usuario: UsuarioAutenticado,
    dto: TrocarSenhaDto,
  ): Promise<void> {
    const atual =
      usuario.tipo === 'ALUNO'
        ? await this.prisma.membro.findUnique({
            where: { id: usuario.id },
            select: { senhaHash: true },
          })
        : await this.prisma.funcionario.findUnique({
            where: { id: usuario.id },
            select: { senhaHash: true },
          });
    const confere = await compare(
      dto.senhaAtual,
      atual?.senhaHash ?? HASH_FICTICIO,
    );
    if (!atual?.senhaHash || !confere) {
      throw new UnprocessableEntityException(SENHA_ATUAL_INCORRETA);
    }
    const senhaHash = await hashSenha(dto.novaSenha);
    if (usuario.tipo === 'ALUNO') {
      await this.prisma.membro.update({
        where: { id: usuario.id },
        data: { senhaHash },
      });
    } else {
      await this.prisma.funcionario.update({
        where: { id: usuario.id },
        data: { senhaHash },
      });
    }
  }
}
