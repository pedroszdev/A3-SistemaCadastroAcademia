import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { QueryAtividadeDto } from './dto/query-atividade.dto';
import { HistoricoService } from './historico.service';

@Controller('atividades')
export class HistoricoController {
  constructor(private readonly historico: HistoricoService) {}

  @Get()
  findAll(@Query() query: QueryAtividadeDto) {
    return this.historico.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.historico.findOne(id);
  }
}
