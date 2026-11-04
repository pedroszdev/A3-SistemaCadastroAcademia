import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { FuncionariosService } from '../funcionarios/funcionarios.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { UsuarioAtual } from './decorators/usuario-atual.decorator';
import { LoginDto } from './dto/login.dto';
import type { UsuarioAutenticado } from './usuario-autenticado';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly funcionarios: FuncionariosService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  me(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.funcionarios.findOne(usuario.id);
  }
}
