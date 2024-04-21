import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from '../database/entities/messages.entity';
import { MessageRepository } from './repository/whatsapp.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity])],
  controllers: [WhatsappController],
  providers: [WhatsappService, MessageRepository],
})
export class WhatsappModule {}
