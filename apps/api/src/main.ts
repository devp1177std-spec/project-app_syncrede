import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Social Media Platform API')
    .setDescription('REST API and WebSocket endpoints for the social media platform')
    .setVersion('1.0')
    .addTag('health', 'Service health checks')
    .addTag('storage', 'Presigned URL media asset storage')
    .addTag('users', 'User profile, social follow graph, grid posts, and moderation')
    .addTag('admin-verifications', 'Administrative verification request management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  pinoLogger.log('API running on http://localhost:' + port + '/api');
  pinoLogger.log('OpenAPI documentation available on http://localhost:' + port + '/api/docs');
}

bootstrap();
