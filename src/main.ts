import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = 5005;
  await app.listen(port);
  console.info(`Server is running on htttp://localhost:${port}`);
}
bootstrap();
