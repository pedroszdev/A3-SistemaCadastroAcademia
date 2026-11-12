import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Cargo } from '../generated/prisma/enums';
import { CreateMembroDto } from './dto/create-membro.dto';
import { LiberarAcessoDto } from './dto/liberar-acesso.dto';
import { QueryMembroDto } from './dto/query-membro.dto';
import { UpdateMembroDto } from './dto/update-membro.dto';
import { MembrosService } from './membros.service';

// Matriz 4.2: todos os funcionários listam e veem; só ADMIN e RECEPCIONISTA alteram.
@Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA, Cargo.INSTRUTOR)
@Controller('membros')
export class MembrosController {
  constructor(private readonly membros: MembrosService) {}

  @Get()
  findAll(@Query() query: QueryMembroDto) {
    return this.membros.findAll(query);
  }

  @Post()
  @Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
  create(@Body() dto: CreateMembroDto) {
    return this.membros.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membros.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMembroDto) {
    return this.membros.update(id, dto);
  }

  @Patch(':id/desativar')
  @Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
  desativar(@Param('id', ParseUUIDPipe) id: string) {
    return this.membros.desativar(id);
  }

  @Patch(':id/reativar')
  @Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
  reativar(@Param('id', ParseUUIDPipe) id: string) {
    return this.membros.reativar(id);
  }

  // RN15: liberar e redefinir usam a mesma rota; revogar apaga o hash.
  @Patch(':id/acesso')
  @Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
  liberarAcesso(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LiberarAcessoDto,
  ) {
    return this.membros.liberarAcesso(id, dto);
  }

  @Delete(':id/acesso')
  @Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
  revogarAcesso(@Param('id', ParseUUIDPipe) id: string) {
    return this.membros.revogarAcesso(id);
  }
}
