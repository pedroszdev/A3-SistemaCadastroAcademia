import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { Cargo } from '../generated/prisma/enums';
import { MembrosResumoService } from './membros-resumo.service';

// O prefixo `membros` convive com o `MembrosController` da MEM-04 sem colidir.
@Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA, Cargo.INSTRUTOR)
@Controller('membros')
export class MembrosResumoController {
  constructor(private readonly resumo: MembrosResumoService) {}

  @Get(':id/resumo')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    // O cargo decide se a situação financeira entra na resposta (matriz 4.2).
    const cargo = usuario.tipo === 'FUNCIONARIO' ? usuario.cargo : undefined;
    return this.resumo.resumo(id, cargo);
  }
}
