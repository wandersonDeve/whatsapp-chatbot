import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as qrcode from 'qrcode-terminal';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import { OpenaiService } from '../openai/openai.service';
import { criarPost } from './generate-post/generate-post';
const cron = require('node-cron');

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

      const { CONTACT_RECEIVE } = process.env;

      if (message.hasMedia && message.from === CONTACT_RECEIVE) {
        if (message.type === 'image') {
          const imagem = await message.downloadMedia();
          const fileName = `imagem_${Date.now()}.jpeg`;
          fs.writeFileSync(fileName, imagem.data, 'base64');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const mediaImagem = MessageMedia.fromFilePath(fileName);

          await this.sendMessageToGroup(mediaImagem);

          fs.unlinkSync(fileName);
        }

        if (message.type === 'audio') {
          const audio = await message.downloadMedia();
          const mediaAudio = new MessageMedia(
            audio.mimetype,
            audio.data,
            audio.filename,
          );

          await this.sendMessageToGroup(mediaAudio);
        }
      }
    });

    this.client.initialize();

    cron.schedule('0 6,12,18 * * *', () => {
      this.generatePost();
    });
  }

  public async generatePost() {
    const postToSend = await criarPost();

    if (!postToSend) return 'Post generate error';

    const mediaImagem = MessageMedia.fromFilePath(postToSend);
    await this.sendMessageToGroup(mediaImagem);

    fs.unlinkSync(postToSend);
    console.log('POST ENVIADO COM SUCESSO');

    return;
  }

  public async sendMessage(phoneNumber: string, message: string) {
    const chat = await this.client.getChatById(phoneNumber);

    return chat.sendMessage(message);
  }

  public async sendMessageToGroup(data: any) {
    const { SEND_CONTACT_ONE, SEND_CONTACT_TWO, SEND_CONTACT_THREE } =
      process.env;

    const groups = {
      'Obreiros Semeando': SEND_CONTACT_ONE,
      'Semeando Para Cristo': SEND_CONTACT_TWO,
      'Grupo Gideões': SEND_CONTACT_THREE,
    };

    for (const groupName in groups) {
      const chatDestino = groups[groupName];
      console.log(`ENVIANDO AUDIO PARA ${groupName}`);
      await this.client.sendMessage(chatDestino, data);
      console.log(`AUDIO ENVIADA COM SUCESSO PARA ${groupName}`);
    }

    return;
  }
}
