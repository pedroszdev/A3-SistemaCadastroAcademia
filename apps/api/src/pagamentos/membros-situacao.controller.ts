import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';

// A rota fica em Pagamentos porque a regra da RN09 é daqui; o prefixo `membros`
// convive com o `MembrosController` da MEM-04 sem colidir.
@Controller('membros')
export class MembrosSituacaoController {
  constructor(private readonly pagamentos: PagamentosService) {}

  @Get(':id/situacao')
  situacao(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagamentos.situacaoMembro(id);
  }
}
