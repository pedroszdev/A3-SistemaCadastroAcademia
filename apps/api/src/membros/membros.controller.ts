import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateMembroDto } from './dto/create-membro.dto';
import { QueryMembroDto } from './dto/query-membro.dto';
import { UpdateMembroDto } from './dto/update-membro.dto';
import { MembrosService } from './membros.service';

// Os @Roles da matriz 4.2 entram com a AUTH-02 (listar/ver: ADMIN, RECEPCIONISTA,
// INSTRUTOR; criar/editar/desativar: ADMIN, RECEPCIONISTA).
@Controller('membros')
export class MembrosController {
  constructor(private readonly membros: MembrosService) {}

  @Get()
  findAll(@Query() query: QueryMembroDto) {
    return this.membros.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateMembroDto) {
    return this.membros.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membros.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMembroDto) {
    return this.membros.update(id, dto);
  }

  @Patch(':id/desativar')
  desativar(@Param('id', ParseUUIDPipe) id: string) {
    return this.membros.desativar(id);
  }

  @Patch(':id/reativar')
  reativar(@Param('id', ParseUUIDPipe) id: string) {
    return this.membros.reativar(id);
  }
}
