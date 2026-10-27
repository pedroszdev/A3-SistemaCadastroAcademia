import { ValidateIf } from 'class-validator';
import { hoje } from '../../common/utils/date';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { NaoFutura } from '../../common/validators/nao-futura.decorator';

export class RegistrarPagamentoDto {
  // padrão: hoje quando a data não é enviada; null é rejeitado
  @ValidateIf((_, valor) => valor !== undefined)
  @IsDataCalendario()
  @NaoFutura()
  dataPagamento: Date = hoje();
}
