import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hashSync } from 'bcryptjs';
import {
  FUNCIONARIO_SELECT,
  SALT_ROUNDS,
} from '../funcionarios/funcionarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { TokenPayload } from './usuario-autenticado';

const HASH_FICTICIO = hashSync(randomUUID(), SALT_ROUNDS);

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
      throw new UnauthorizedException('Login ou senha inválidos');
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
}
