import { INestApplication, ValidationPipe } from '@nestjs/common';

// Usado pelo main.ts e pelo criarApp() dos e2e, para os dois terem a mesma validação.
export function configurarApp(app: INestApplication): void {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
