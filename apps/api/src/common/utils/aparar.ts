// Para usar com @Transform: tira os espaços das pontas e deixa não-texto passar
// para o validador de tipo acusar.
export function aparar({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
