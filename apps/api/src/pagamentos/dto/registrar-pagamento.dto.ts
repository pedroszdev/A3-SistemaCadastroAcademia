import { ValidateIf } from 'class-validator';
import { hoje } from '../../common/utils/date';
import { DentroDosUltimosDias } from '../../common/validators/dentro-dos-ultimos-dias.decorator';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { NaoFutura } from '../../common/validators/nao-futura.decorator';
import { DIAS_RETROATIVOS_MAX } from '../pagamento-status';

export class RegistrarPagamentoDto {
  // padrão: hoje quando a data não é enviada; null é rejeitado
  @ValidateIf((_, valor) => valor !== undefined)
  @IsDataCalendario()
  @NaoFutura()
  @DentroDosUltimosDias(DIAS_RETROATIVOS_MAX)
  dataPagamento: Date = hoje();
}
