import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Cargo } from '../generated/prisma/enums';
import { PagamentosService } from './pagamentos.service';

// A rota fica em Pagamentos porque a regra da RN09 é daqui; o prefixo `membros`
// convive com o `MembrosController` da MEM-04 sem colidir.
// Situação financeira segue a permissão de pagamentos (matriz 4.2).
@Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
@Controller('membros')
export class MembrosSituacaoController {
  constructor(private readonly pagamentos: PagamentosService) {}

  @Get(':id/situacao')
  situacao(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagamentos.situacaoMembro(id);
  }
}
