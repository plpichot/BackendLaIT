const { NestFactory } = require('@nestjs/core') ;
const express = require('express');
const { AppModule } = require('./app.module');
/*import * as fs from 'fs';
import * as https from 'https'; */

async function bootstrap() {

  /*const httpsOptions = {
    key: fs.readFileSync('/Users/plpichot/Desktop/backend/certificates/key.pem', 'utf8'),
    cert: fs.readFileSync('/Users/plpichot/Desktop/backend/certificates/cert.pem', 'utf8'),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });*/
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '10mb' }));
  // Configurer CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    allowedHeaders: 'Content-Type, Authorization',
    methods: 'GET, POST, PUT, DELETE',
  });
  
  await app.listen(3000)
}
bootstrap();