import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as qrcode from 'qrcode-terminal';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import { SendToGroupsDto } from './dtos/send-to-group.dto';
import { LogoEnum } from './enum/logo.enum';
import { criarPost } from './generate-post/generate-post';
import { CreateSchedulerDto } from './dtos/create-scheduler.dto';
import { MessageRepository } from './repository/whatsapp.repository';

@Injectable()
export class WhatsappService {
  private client: Client;

  constructor(private messageRepository: MessageRepository) {
    this.client = new Client({
      puppeteer: {
        headless: false,
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox'],
      },
      authStrategy: new LocalAuth(),
      webVersionCache: {
        type: 'remote',
        remotePath:
          'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      },
    });

    this.client.on('qr', (qrCode) => {
      qrcode.generate(qrCode, { small: true }, function (qrcode) {
        console.log(qrcode);
      });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
    });

    this.client.on('message', (message: any) => {
      const removeContacts = ['status@broadcast'];

      if (removeContacts.includes(message.from)) return;

      const regex = /logo: (.+)\ntema: (.+)/i;
      const matches = message.body.match(regex);

      if (matches) this.dynamicGenerator(matches, message.from);
    });

    this.client.initialize();

    // cron.schedule('40 10,14,18 * * *', () => {
    //   this.generatePost();
    // });
  }

  async sendMedia(message: Message) {
    if (message.type === 'image') {
      const imagem = await message.downloadMedia();
      const fileName = `imagem_${Date.now()}.jpeg`;
      fs.writeFileSync(fileName, imagem.data, 'base64');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mediaImagem = MessageMedia.fromFilePath(fileName);
      await this.sendMessageToGroup(mediaImagem);
      fs.unlinkSync(fileName);
      return;
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

  async dynamicGenerator(matches, from) {
    const [_, logo, tema] = matches;
    console.log(from);

    const temaParts = tema.split(' ');
    const abbrev = temaParts[0];
    const chapterAndNumber = temaParts[1].split(':');
    const chapter = chapterAndNumber[0];
    const number = chapterAndNumber[1];

    const structureTosend: SendToGroupsDto = {
      version: 'nvi',
      abbrev,
      chapter,
      number,
      logo: LogoEnum[logo.toUpperCase()],
    };

    const postToSend = await criarPost(structureTosend);
    if (!postToSend) return 'Post generate error';
    const mediaImagem = MessageMedia.fromFilePath(postToSend[0]);
    await this.sendMessage(from, mediaImagem as any);
    console.log('DELETANDO :', postToSend[0]);
    fs.promises.unlink(postToSend[0]);
  }

  async generatePost() {
    const postToSend = await criarPost();
    if (!postToSend) return 'Post generate error';
    const mediaImagem = MessageMedia.fromFilePath(postToSend[0]);
    await this.sendMessageToGroup(mediaImagem);
    fs.promises.unlink(postToSend[0]);
    console.log('POST ENVIADO COM SUCESSO');
  }

  async sendMessage(phoneNumber: string, message: string) {
    const contactId = `${phoneNumber}@c.us`;
    const chat = await this.client.getChatById(contactId);
    return chat.sendMessage(message);
  }

  async sendToGroup(data: SendToGroupsDto, file?: Express.Multer.File) {
    const postsToSend = await criarPost(data, file);
    if (postsToSend?.length <= 0) return 'Post generate error';
    for (const post of postsToSend) {
      const mediaImagem = MessageMedia.fromFilePath(post);
      await this.sendMessageToGroup(mediaImagem);
      fs.promises.unlink(post);
    }
    return { message: 'POST ENVIADO COM SUCESSO' };
  }

  async sendMessageToGroup(data: any) {
    const {
      SEND_CONTACT_ONE,
      SEND_CONTACT_TWO,
      SEND_CONTACT_THREE,
      MONTE_SIAO,
      ESCUDO_DA_FE,
      OBREIROS_LAPA,
      EBD_ADTC,
      EDB_SEMEANDO,
    } = process.env;

    const groups = {
      'Obreiros Semeando': SEND_CONTACT_ONE,
      'Semeando Para Cristo': SEND_CONTACT_TWO,
      'Grupo Gideões': SEND_CONTACT_THREE,
      'Obreiros Semeando Lapa': OBREIROS_LAPA,
      'EBD Semeando': EDB_SEMEANDO,
    };

    const dataInfo = data?.filename?.split('-') ?? ['', ''];

    if (dataInfo[1] === 'logo1.png') {
      console.log(`ENVIANDO PARA Monte Sião`);
      this.client.sendMessage(MONTE_SIAO, data);
      this.client.sendMessage(ESCUDO_DA_FE, data);
      this.client.sendMessage(EBD_ADTC, data);
      console.log(`ENVIADA COM SUCESSO PARA Monte Sião às ${new Date()}`);
    } else {
      for (const groupName in groups) {
        const chatDestino = groups[groupName];
        console.log(`ENVIANDO PARA ${groupName}`);
        this.client.sendMessage(chatDestino, data);
        console.log(`ENVIADA COM SUCESSO PARA ${groupName} às ${new Date()}`);
      }
    }
  }

  async createScheduler(data: CreateSchedulerDto) {
    await this.messageRepository.save(data);
  }
}
