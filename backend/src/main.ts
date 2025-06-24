import { config } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  config();
}

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('module-alias/register'); // Nur in Produktion laden
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS aktivieren
  app.enableCors({
    origin: 'http://localhost:4200', // Oder '*' für alle
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true, // Falls du Cookies oder Tokens sendest
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
