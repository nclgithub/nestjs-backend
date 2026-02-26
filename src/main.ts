import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CORS ---
  // Restrict origins in production via the ALLOWED_ORIGINS env var.
  // Example: ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : '*';

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // --- Global validation pipe ---
  // Strips unknown properties and validates incoming DTOs automatically.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip unknown fields when DTOs are in use
      transform: true,       // auto-transform payload types
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
