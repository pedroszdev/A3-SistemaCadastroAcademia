import { hoje } from '../../common/utils/date';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { NaoFutura } from '../../common/validators/nao-futura.decorator';
import { SeVeio } from '../../common/validators/se-veio.decorator';

export class RegistrarPagamentoDto {
  // padrão: hoje quando a data não é enviada; null é rejeitado
  @SeVeio()
  @IsDataCalendario()
  @NaoFutura()
  dataPagamento: Date = hoje();
}
