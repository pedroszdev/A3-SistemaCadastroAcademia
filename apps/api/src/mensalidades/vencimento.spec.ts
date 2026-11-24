import { mesDe, proximoVencimento, vencimentoNoMes } from './vencimento';

const dia = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('vencimentoNoMes', () => {
  it('usa o dia pedido quando o mês tem esse dia', () => {
    expect(vencimentoNoMes(2026, 10, 10)).toEqual(dia('2026-11-10'));
  });

  it('cai no último dia nos meses mais curtos', () => {
    expect(vencimentoNoMes(2027, 1, 31)).toEqual(dia('2027-02-28'));
    expect(vencimentoNoMes(2028, 1, 30)).toEqual(dia('2028-02-29'));
    expect(vencimentoNoMes(2026, 10, 31)).toEqual(dia('2026-11-30'));
  });

  it('passa para o ano seguinte depois de dezembro', () => {
    expect(vencimentoNoMes(2026, 12, 5)).toEqual(dia('2027-01-05'));
  });
});

describe('proximoVencimento', () => {
  it('é hoje quando o vencimento do mês cai hoje', () => {
    expect(proximoVencimento(dia('2026-11-24'), 24)).toEqual(dia('2026-11-24'));
  });

  it('é ainda neste mês quando o dia não passou', () => {
    expect(proximoVencimento(dia('2026-11-24'), 28)).toEqual(dia('2026-11-28'));
  });

  it('vai para o mês seguinte quando o dia já passou', () => {
    expect(proximoVencimento(dia('2026-11-24'), 10)).toEqual(dia('2026-12-10'));
    expect(proximoVencimento(dia('2026-12-24'), 10)).toEqual(dia('2027-01-10'));
  });

  it('respeita o último dia do mês', () => {
    expect(proximoVencimento(dia('2027-02-01'), 31)).toEqual(dia('2027-02-28'));
    expect(proximoVencimento(dia('2026-11-30'), 31)).toEqual(dia('2026-11-30'));
  });
});

describe('mesDe', () => {
  it('devolve o primeiro dia do mês e o do mês seguinte', () => {
    expect(mesDe(dia('2026-12-10'))).toEqual({
      inicio: dia('2026-12-01'),
      fim: dia('2027-01-01'),
    });
  });
});
