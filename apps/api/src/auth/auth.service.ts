import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hashSync } from 'bcryptjs';
import { SALT_ROUNDS } from '../common/utils/senha';
import { isCpfValido } from '../common/validators/cpf';
import { FUNCIONARIO_SELECT } from '../funcionarios/funcionarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginAlunoDto } from './dto/login-aluno.dto';
import { LoginDto } from './dto/login.dto';
import { TokenPayload } from './usuario-autenticado';

// O tempo do compare só não revela se a conta existe enquanto todo senhaHash
// (de funcionário e de aluno, inclusive o da MEM-07) usar este mesmo SALT_ROUNDS.
const HASH_FICTICIO = hashSync(randomUUID(), SALT_ROUNDS);
const CREDENCIAL_INVALIDA = 'Login ou senha inválidos';

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
}
