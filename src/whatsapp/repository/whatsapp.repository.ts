import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from '../../database/entities/messages.entity';
import { CreateSchedulerDto } from '../dtos/create-scheduler.dto';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  async save(scheduler: CreateSchedulerDto) {
    return this.messageRepository.save(scheduler);
  }

  async getAllMessages() {
    return this.messageRepository.find();
  }
}
