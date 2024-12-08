import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.HOST,
        port: parseInt(process.env.AUTH_SERVICE_PORT, 10), 
      },
    },
  );
  await app.listen();
  console.log(`Auth service is listening on TCP ${process.env.HOST}:${parseInt(process.env.AUTH_SERVICE_PORT)}`);
}
bootstrap();