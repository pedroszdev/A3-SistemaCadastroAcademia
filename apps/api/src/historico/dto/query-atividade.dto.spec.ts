import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  PeriodoAtividadeDto,
  QueryAtividadeDto,
  QueryMinhasAtividadesDto,
} from './query-atividade.dto';

async function validar(query: Record<string, unknown>) {
  const dto = plainToInstance(QueryAtividadeDto, query);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

// As mesmas opções do ValidationPipe do main.ts, para ver o que a whitelist recusa.
async function validarComWhitelist<T extends object>(
  classe: new () => T,
  query: Record<string, unknown>,
) {
  const dto = plainToInstance(classe, query);
  const erros = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('QueryAtividadeDto', () => {
  it('aceita query vazia com page 1 e pageSize 20', async () => {
    const { dto, mensagens } = await validar({});

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it('converte dataDe e dataAte para Date', async () => {
    const { dto, mensagens } = await validar({
      dataDe: '2026-10-01',
      dataAte: '2026-10-31',
    });

    expect(mensagens).toEqual([]);
    expect(dto.dataDe?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(dto.dataAte?.toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });

  it('aceita só dataAte, sem dataDe', async () => {
    const { dto, mensagens } = await validar({ dataAte: '2026-10-31' });

    expect(mensagens).toEqual([]);
    expect(dto.dataDe).toBeUndefined();
    expect(dto.dataAte?.toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });

  it('aceita todos os filtros juntos', async () => {
    const { mensagens } = await validar({
      membroId: '0199f0a2-7b3c-7d4e-8f00-123456789abc',
      funcionarioId: '0199f0a2-7b3c-7d4e-8f00-123456789abd',
      dataDe: '2026-10-01',
      dataAte: '2026-10-31',
      page: '2',
      pageSize: '50',
    });

    expect(mensagens).toEqual([]);
  });

  it.each([
    [{ membroId: 'abc' }, 'membroId deve ser um UUID válido'],
    [{ funcionarioId: 'abc' }, 'funcionarioId deve ser um UUID válido'],
    [
      { dataDe: '2026-02-30' },
      'dataDe deve ser uma data válida no formato AAAA-MM-DD',
    ],
    [
      { dataAte: '10/11/2026' },
      'dataAte deve ser uma data válida no formato AAAA-MM-DD',
    ],
    [
      { dataDe: '2026-12-01', dataAte: '2026-01-01' },
      'dataAte não pode ser anterior a dataDe',
    ],
    [{ pageSize: '101' }, 'pageSize deve ser no máximo 100'],
  ])('%o → "%s"', async (query, mensagem) => {
    const { mensagens } = await validar(query);

    expect(mensagens).toContain(mensagem);
  });
});

describe('QueryMinhasAtividadesDto', () => {
  const validarMinhas = (query: Record<string, unknown>) =>
    validarComWhitelist(QueryMinhasAtividadesDto, query);

  it('aceita query vazia com page 1 e pageSize 20', async () => {
    const { dto, mensagens } = await validarMinhas({});

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it('converte o período para Date e a paginação para número', async () => {
    const { dto, mensagens } = await validarMinhas({
      dataDe: '2026-10-01',
      dataAte: '2026-10-31',
      page: '2',
      pageSize: '50',
    });

    expect(mensagens).toEqual([]);
    expect(dto.dataDe?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(dto.dataAte?.toISOString()).toBe('2026-10-31T00:00:00.000Z');
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(50);
  });

  it('rejeita intervalo invertido', async () => {
    const { mensagens } = await validarMinhas({
      dataDe: '2026-12-01',
      dataAte: '2026-01-01',
    });

    expect(mensagens).toContain('dataAte não pode ser anterior a dataDe');
  });

  it.each([
    ['membroId', '0199f0a2-7b3c-7d4e-8f00-123456789abc'],
    ['funcionarioId', '0199f0a2-7b3c-7d4e-8f00-123456789abd'],
  ])('recusa %s pela whitelist (RN16)', async (campo, valor) => {
    const { mensagens } = await validarMinhas({ [campo]: valor });

    expect(mensagens).toContain(`property ${campo} should not exist`);
  });
});

describe('PeriodoAtividadeDto', () => {
  const validarPeriodo = (query: Record<string, unknown>) =>
    validarComWhitelist(PeriodoAtividadeDto, query);

  it('aceita query vazia, com o período aberto', async () => {
    const { dto, mensagens } = await validarPeriodo({});

    expect(mensagens).toEqual([]);
    expect(dto.dataDe).toBeUndefined();
    expect(dto.dataAte).toBeUndefined();
  });

  it('converte dataDe e dataAte para Date', async () => {
    const { dto, mensagens } = await validarPeriodo({
      dataDe: '2026-10-01',
      dataAte: '2026-10-31',
    });

    expect(mensagens).toEqual([]);
    expect(dto.dataDe?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(dto.dataAte?.toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });

  it('rejeita intervalo invertido', async () => {
    const { mensagens } = await validarPeriodo({
      dataDe: '2026-12-01',
      dataAte: '2026-01-01',
    });

    expect(mensagens).toContain('dataAte não pode ser anterior a dataDe');
  });

  it.each(['page', 'pageSize', 'membroId'])(
    'recusa %s pela whitelist, já que o resumo não pagina nem escolhe o membro',
    async (campo) => {
      const { mensagens } = await validarPeriodo({ [campo]: '1' });

      expect(mensagens).toContain(`property ${campo} should not exist`);
    },
  );
});
