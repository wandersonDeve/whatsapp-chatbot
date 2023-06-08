import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as qrcode from 'qrcode-terminal';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import { OpenaiService } from '../openai/openai.service';

@Injectable()
export class WhatsappService {
  private client: Client;

  constructor(private openaiService: OpenaiService) {
    this.client = new Client({
      authStrategy: new LocalAuth(),
    });

    this.client.on('qr', (qrCode) => {
      qrcode.generate(qrCode, { small: true });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
    });

    this.client.on('message', async (message: Message) => {
      const removeContacts = ['status@broadcast'];

      const {
        CONTACT_RECEIVE,
        SEND_CONTACT_ONE,
        SEND_CONTACT_TWO,
        SEND_CONTACT_THREE,
      } = process.env;

      if (message.hasMedia && message.from === CONTACT_RECEIVE) {
        const groups = {
          'Obreiros Semeando': SEND_CONTACT_ONE,
          'Semeando Para Cristo': SEND_CONTACT_TWO,
          'Grupo Gideões': SEND_CONTACT_THREE,
        };

        if (message.type === 'image') {
          const imagem = await message.downloadMedia();
          const fileName = `imagem_${Date.now()}.jpeg`;
          fs.writeFileSync(fileName, imagem.data, 'base64');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const mediaImagem = MessageMedia.fromFilePath(fileName);

          for (const groupName in groups) {
            const chatDestino = groups[groupName];
            console.log(`ENVIANDO IMAGEM PARA ${groupName}`);
            await this.client.sendMessage(chatDestino, mediaImagem);
            console.log(`IMAGEM ENVIADA COM SUCESSO PARA ${groupName}`);
          }

          fs.unlinkSync(fileName);
        }

        if (message.type === 'audio') {
          const audio = await message.downloadMedia();
          const mediaAudio = new MessageMedia(
            audio.mimetype,
            audio.data,
            audio.filename,
          );
          for (const groupName in groups) {
            const chatDestino = groups[groupName];
            console.log(`ENVIANDO AUDIO PARA ${groupName}`);
            await this.client.sendMessage(chatDestino, mediaAudio);
            console.log(`AUDIO ENVIADA COM SUCESSO PARA ${groupName}`);
          }
        }
      }
    });

    this.client.initialize();
  }

  public async sendMessage(phoneNumber: string, message: string) {
    const chat = await this.client.getChatById(`${phoneNumber}@c.us`);

    return chat.sendMessage(message);
  }

  public async sendGroupMessage(groupId: string, message: string) {
    const group = await this.client.getChatById(groupId);

    return group.sendMessage(message);
  }
}
