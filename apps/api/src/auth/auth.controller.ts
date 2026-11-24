import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { Cargo } from '../generated/prisma/enums';
import { FuncionariosService } from '../funcionarios/funcionarios.service';
import { MembrosService } from '../membros/membros.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { UsuarioAtual } from './decorators/usuario-atual.decorator';
import { AtualizarMeusDadosDto } from './dto/atualizar-meus-dados.dto';
import { LoginAlunoDto } from './dto/login-aluno.dto';
import { LoginDto } from './dto/login.dto';
import { TrocarSenhaDto } from './dto/trocar-senha.dto';
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

  // RN20: os próprios dados. Responde o perfil atualizado, como o GET.
  @Roles(...Object.values(Cargo), 'ALUNO')
  @Patch('me')
  async atualizarMe(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: AtualizarMeusDadosDto,
  ) {
    await this.auth.atualizarMeusDados(usuario, dto);
    return this.me(usuario);
  }

  @Roles(...Object.values(Cargo), 'ALUNO')
  @Patch('me/senha')
  @HttpCode(HttpStatus.NO_CONTENT)
  trocarSenha(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: TrocarSenhaDto,
  ) {
    return this.auth.trocarSenha(usuario, dto);
  }
}
