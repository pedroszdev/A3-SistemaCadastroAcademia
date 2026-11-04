import { hoje } from '../../common/utils/date';
import { DentroDosUltimosDias } from '../../common/validators/dentro-dos-ultimos-dias.decorator';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { NaoFutura } from '../../common/validators/nao-futura.decorator';
import { SeVeio } from '../../common/validators/se-veio.decorator';
import { DIAS_RETROATIVOS_MAX } from '../pagamento-status';

export class RegistrarPagamentoDto {
  // padrão: hoje quando a data não é enviada; null é rejeitado
  @SeVeio()
  @IsDataCalendario()
  @NaoFutura()
  @DentroDosUltimosDias(DIAS_RETROATIVOS_MAX)
  dataPagamento: Date = hoje();
}
