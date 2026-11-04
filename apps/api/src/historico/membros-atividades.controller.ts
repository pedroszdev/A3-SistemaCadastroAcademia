import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { QueryAtividadeDto } from './dto/query-atividade.dto';
import { HistoricoService } from './historico.service';

// A rota fica em Histórico porque a consulta é daqui; o prefixo `membros`
// convive com o `MembrosController` da MEM-04 sem colidir.
@Controller('membros')
export class MembrosAtividadesController {
  constructor(private readonly historico: HistoricoService) {}

  @Get(':id/atividades')
  findAll(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryAtividadeDto,
  ) {
    return this.historico.findAllDoMembro(id, query);
  }
}
