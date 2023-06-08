import { Body, Controller, Get } from '@nestjs/common';
import { SendMessageDto } from './dtos/send-message.dto';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('send')
  async sendMessage(@Body() { message, phoneNumber }: SendMessageDto) {
    return this.whatsappService.sendMessage(phoneNumber, message);
  }
}
