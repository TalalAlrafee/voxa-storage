import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Voxa File Storage API is running on: http://localhost:${port}`);
  console.log(`📁 Storage endpoints:`);
  console.log(`   POST /auth/token - Get JWT token`);
  console.log(`   POST /v1/blobs - Upload file`);
  console.log(`   GET  /v1/blobs/:id - Download file`);
}
bootstrap();
