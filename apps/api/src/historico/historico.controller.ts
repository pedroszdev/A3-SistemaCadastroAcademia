import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { QueryAtividadeDto } from './dto/query-atividade.dto';
import { HistoricoService } from './historico.service';

@Controller('atividades')
export class HistoricoController {
  constructor(private readonly historico: HistoricoService) {}

  @Get()
  findAll(@Query() query: QueryAtividadeDto) {
    return this.historico.findAll(query);
  }

  @Post()
  registrar(
    @Body() dto: CreateAtividadeDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    // RN11: o funcionário do registro é o do token
    return this.historico.registrar(dto, usuario.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.historico.findOne(id);
  }
}
