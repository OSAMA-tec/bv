import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  // Create the application
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Real Estate NFT API')
    .setDescription('API documentation for Real Estate NFT Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Properties')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Request logging middleware
  app.use(morgan('dev'));

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Add global interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Start the server
  const port = configService.get<number>('port');
  await app.listen(port);

  // Log application details
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Swagger Documentation: ${await app.getUrl()}/api`);
  logger.log(`Environment: ${configService.get<string>('nodeEnv')}`);
  logger.log(`Database: Connected to MongoDB`);
  logger.log(
    `Blockchain Network: ${configService.get<string>('blockchain.network')}`,
  );
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
