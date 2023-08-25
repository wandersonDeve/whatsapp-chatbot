import { Body, Controller, Get, Param } from '@nestjs/common';
import { SendMessageDto } from './dtos/send-message.dto';
import { SendToGroupsDto } from './dtos/send-to-group.dto';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('send')
  async sendMessage(@Body() { message, phoneNumber }: SendMessageDto) {
    return this.whatsappService.sendMessage(phoneNumber, message);
  }

  @Get('send-group/:version/:abbrev/:chapter/:number')
  async sendGroup(@Param() sendToGroupsDto: SendToGroupsDto) {
    return this.whatsappService.sendToGroup(sendToGroupsDto);
  }
}
