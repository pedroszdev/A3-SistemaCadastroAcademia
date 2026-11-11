import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Cargo } from '../generated/prisma/enums';
import { CreateTreinoDto } from './dto/create-treino.dto';
import { QueryTreinoDto } from './dto/query-treino.dto';
import { UpdateTreinoDto } from './dto/update-treino.dto';
import { TreinosService } from './treinos.service';

// Matriz 4.2: todos os funcionários consultam; só ADMIN e INSTRUTOR criam, editam e excluem.
@Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA, Cargo.INSTRUTOR)
@Controller('treinos')
export class TreinosController {
  constructor(private readonly treinos: TreinosService) {}

  @Get()
  findAll(@Query() query: QueryTreinoDto) {
    return this.treinos.findAll(query);
  }

  @Post()
  @Roles(Cargo.ADMIN, Cargo.INSTRUTOR)
  create(@Body() dto: CreateTreinoDto) {
    return this.treinos.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.treinos.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN, Cargo.INSTRUTOR)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTreinoDto) {
    return this.treinos.update(id, dto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN, Cargo.INSTRUTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.treinos.remove(id);
  }
}
