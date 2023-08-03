const { NestFactory } = require('@nestjs/core') ;
const express = require('express');
const { AppModule } = require('./app.module');

async function bootstrap() {

  const app = await NestFactory.create(AppModule, { cors: true });

  app.use(express.json({ limit: '10mb' }));
  await app.listen(3000)
}
bootstrap();