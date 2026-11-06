import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Cargo } from '../generated/prisma/enums';
import { FuncionariosService } from '../funcionarios/funcionarios.service';
import { MembrosService } from '../membros/membros.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { UsuarioAtual } from './decorators/usuario-atual.decorator';
import { LoginAlunoDto } from './dto/login-aluno.dto';
import { LoginDto } from './dto/login.dto';
import type { UsuarioAutenticado } from './usuario-autenticado';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly funcionarios: FuncionariosService,
    private readonly membros: MembrosService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('login-aluno')
  @HttpCode(HttpStatus.OK)
  loginAluno(@Body() dto: LoginAlunoDto) {
    return this.auth.loginAluno(dto);
  }

  @Roles(...Object.values(Cargo), 'ALUNO')
  @Get('me')
  me(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return usuario.tipo === 'ALUNO'
      ? this.membros.findOne(usuario.id)
      : this.funcionarios.findOne(usuario.id);
  }
}
