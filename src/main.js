const { NestFactory } = require('@nestjs/core') ;
const express = require('express');
const { AppModule } = require('./app.module');

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
  });
  app.use(express.json({ limit: '10mb' }));
  await app.listen(3000);
}
bootstrap();