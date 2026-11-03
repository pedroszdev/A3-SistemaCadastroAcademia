// Para usar com @Transform na query string: 'true' e 'false' viram booleano e
// o resto passa intacto para o @IsBoolean acusar.
export function paraBooleano({ value }: { value: unknown }): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}
