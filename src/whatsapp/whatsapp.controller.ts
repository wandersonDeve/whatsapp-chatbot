import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SendMessageDto } from './dtos/send-message.dto';
import { SendToGroupsDto } from './dtos/send-to-group.dto';
import { WhatsappService } from './whatsapp.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSchedulerDto } from './dtos/create-scheduler.dto';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('send')
  async sendMessage(@Body() { message, phoneNumber }: SendMessageDto) {
    return this.whatsappService.sendMessage(phoneNumber, message);
  }

  @Post('send-group/:version/:abbrev/:chapter/:number')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async sendGroup(
    @Param() sendToGroupsDto: SendToGroupsDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.whatsappService.sendToGroup(sendToGroupsDto, file);
  }

  @Post('scheduler')
  async createScheduler(@Body() data: CreateSchedulerDto) {
    return this.whatsappService.createScheduler(data);
  }
}
