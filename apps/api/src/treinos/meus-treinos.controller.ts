import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { QueryTreinoMembroDto } from './dto/query-treino.dto';
import { TreinosService } from './treinos.service';

// TRE-05: os treinos do próprio aluno. O membroId vem sempre do token (RN16),
// e o aluno só lê (RN17).
@Roles('ALUNO')
@Controller('me/treinos')
export class MeusTreinosController {
  constructor(private readonly treinos: TreinosService) {}

  @Get()
  findAll(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query() query: QueryTreinoMembroDto,
  ) {
    return this.treinos.findDoMembro(usuario.id, query);
  }

  @Get(':id')
  findOne(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.treinos.findOneDoMembro(usuario.id, id);
  }
}
