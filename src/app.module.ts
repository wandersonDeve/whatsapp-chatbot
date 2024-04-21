import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenaiModule } from './openai/openai.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AppDataSource, postgresConfig } from './database/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...postgresConfig,
        autoLoadEntities: true,
        ssl: true,
      }),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    WhatsappModule,
    OpenaiModule,
  ],
})
export class AppModule {
  constructor() {
    AppDataSource.initialize()
      .then(async () => {
        console.log('Connect  the database...');
      })
      .catch((error) => console.log(error));
  }
}
