import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './utils/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*'
  } });


  // Define HttpExceptioFilter criado como global
  app.useGlobalFilters(new HttpExceptionFilter)

  // Define o tamanho do payload do json para 1mb em requisições globais.
  app.use(json({ limit: '1mb' }));

  // Define configurações globais das validações
  await app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      stopAtFirstError: false
    }),
  );

  if (process.env.NODE_ENV == "DEV") {
    // Configurações do Swagger
    const config = new DocumentBuilder()
      .setTitle('SIG')
      .setDescription('Detalhes da API do SIG')
      .setVersion('1.0')
      .setLicense('Apache 2.0', 'http://www.apache.org/licenses/LICENSE-2.0')
      .addBearerAuth({ type: 'http', bearerFormat: 'JWT', scheme: 'Bearer', in: 'header' },
        'access_token')
      .build();
    // Configurações do Swagger
    const document = SwaggerModule.createDocument(app, config);
    // Configurações do Swagger
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.PORT);
}
bootstrap();
