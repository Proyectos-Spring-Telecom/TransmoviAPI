import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // Permitir todas las URLs; puedes poner un array de URLs específicas
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  
    // Validación automática de DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,       // elimina propiedades que no están en el DTO
        forbidNonWhitelisted: true, // lanza error si llegan propiedades extra
        transform: true,       // transforma payloads a instancias de clases
      }),
    );

    
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
