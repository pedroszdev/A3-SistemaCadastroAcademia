import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExigeJsonGuard } from '../common/guards/exige-json.guard';
import { Cargo } from '../generated/prisma/enums';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { QueryPagamentoDto } from './dto/query-pagamento.dto';
import { RegistrarPagamentoDto } from './dto/registrar-pagamento.dto';
import { PagamentosService } from './pagamentos.service';

// Matriz 4.2: pagamentos são só do ADMIN e da RECEPCIONISTA (INSTRUTOR → 403).
@Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentos: PagamentosService) {}

  @Get()
  findAll(@Query() query: QueryPagamentoDto) {
    return this.pagamentos.findAll(query);
  }

  @Post()
  create(@Body() dto: CreatePagamentoDto) {
    return this.pagamentos.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagamentos.findOne(id);
  }

  @Patch(':id/pagar')
  @UseGuards(ExigeJsonGuard)
  pagar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarPagamentoDto,
  ) {
    return this.pagamentos.registrarPagamento(id, dto);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagamentos.cancelar(id);
  }
}
