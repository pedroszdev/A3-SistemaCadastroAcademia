import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Cargo } from '../generated/prisma/enums';
import { MembrosResumoService } from './membros-resumo.service';

// RF25: a ficha traz a situação financeira, que segue a permissão de pagamentos
// (matriz 4.2). O prefixo `membros` convive com o `MembrosController`.
@Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
@Controller('membros')
export class MembrosResumoController {
  constructor(private readonly resumoService: MembrosResumoService) {}

  @Get(':id/resumo')
  resumo(@Param('id', ParseUUIDPipe) id: string) {
    return this.resumoService.resumo(id);
  }
}
