import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import {
  PeriodoAtividadeDto,
  QueryMinhasAtividadesDto,
} from './dto/query-atividade.dto';
import { HistoricoService } from './historico.service';

// HIS-05: o histórico do próprio aluno. O membroId vem sempre do token (RN16),
// e o aluno só lê (RN17).
@Roles('ALUNO')
@Controller('me/atividades')
export class MinhasAtividadesController {
  constructor(private readonly historico: HistoricoService) {}

  @Get()
  findAll(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query() query: QueryMinhasAtividadesDto,
  ) {
    return this.historico.findAllDoAluno(usuario.id, query);
  }

  // antes de ':id', senão 'resumo' cai no ParseUUIDPipe
  @Get('resumo')
  resumo(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query() periodo: PeriodoAtividadeDto,
  ) {
    return this.historico.resumoMembro(
      usuario.id,
      periodo.dataDe,
      periodo.dataAte,
    );
  }

  @Get(':id')
  findOne(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.historico.findOneDoAluno(id, usuario.id);
  }
}
