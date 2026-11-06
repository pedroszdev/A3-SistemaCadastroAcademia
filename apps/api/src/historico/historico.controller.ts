import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { Cargo } from '../generated/prisma/enums';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { QueryAtividadeDto } from './dto/query-atividade.dto';
import { HistoricoService } from './historico.service';

// Matriz 4.2: todos os funcionários consultam; só ADMIN e INSTRUTOR registram.
@Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA, Cargo.INSTRUTOR)
@Controller('atividades')
export class HistoricoController {
  constructor(private readonly historico: HistoricoService) {}

  @Get()
  findAll(@Query() query: QueryAtividadeDto) {
    return this.historico.findAll(query);
  }

  @Post()
  @Roles(Cargo.ADMIN, Cargo.INSTRUTOR)
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
