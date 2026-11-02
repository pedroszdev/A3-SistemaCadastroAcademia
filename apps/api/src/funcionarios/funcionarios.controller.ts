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
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { QueryFuncionarioDto } from './dto/query-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { FuncionariosService } from './funcionarios.service';

@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly funcionarios: FuncionariosService) {}

  @Get()
  findAll(@Query() query: QueryFuncionarioDto) {
    return this.funcionarios.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateFuncionarioDto) {
    return this.funcionarios.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarios.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFuncionarioDto,
  ) {
    return this.funcionarios.update(id, dto);
  }

  @Patch(':id/desativar')
  desativar(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarios.desativar(id);
  }

  @Patch(':id/reativar')
  reativar(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarios.reativar(id);
  }
}
