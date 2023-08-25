/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as qrcode from 'qrcode-terminal';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import * as ytdl from 'ytdl-core';
import { SendToGroupsDto } from './dtos/send-to-group.dto';
import { LogoEnum } from './enum/logo.enum';
import { criarPost } from './generate-post/generate-post';

@Injectable()
export class WhatsappService {
  private client: Client;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
    });

    this.client.on('qr', (qrCode) => {
      qrcode.generate(qrCode, { small: true });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
    });

    this.client.on('message', async (message: Message | any) => {
      const removeContacts = ['status@broadcast'];

      if (!removeContacts.includes(message.from)) {
        console.log(message);
      }

      const hasYoutubeLink =
        message.body.includes('youtube') || message.body.includes('youtu.be');

      if (hasYoutubeLink) {
        await this.downloadMusic(message);
      }

      if (removeContacts.includes(message.from)) return;

      const { CONTACT_RECEIVE } = process.env;

      if (message.hasMedia && message.from === CONTACT_RECEIVE) {
        return this.sendMedia(message);
      }

      const regex = /logo: (.+)\ntema: (.+)/i;
      const matches = message.body.match(regex);

      if (matches) return this.dynamicGenerator(matches, message.from);

      return;
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
      return;
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
    return;
  }

  async generatePost() {
    const postToSend = await criarPost();
    if (!postToSend) return 'Post generate error';
    const mediaImagem = MessageMedia.fromFilePath(postToSend[0]);
    await this.sendMessageToGroup(mediaImagem);
    fs.promises.unlink(postToSend[0]);
    console.log('POST ENVIADO COM SUCESSO');
    return;
  }

  async sendMessage(phoneNumber: string, message: string) {
    const chat = await this.client.getChatById(phoneNumber);
    return chat.sendMessage(message);
  }

  async sendToGroup(data: SendToGroupsDto) {
    const postsToSend = await criarPost(data);
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
    } = process.env;

    const groups = {
      'Obreiros Semeando': SEND_CONTACT_ONE,
      'Semeando Para Cristo': SEND_CONTACT_TWO,
      'Grupo Gideões': SEND_CONTACT_THREE,
    };

    const dataInfo = data?.filename?.split('-') ?? ['', ''];

    if (dataInfo[1] === 'logo1.png') {
      console.log(`ENVIANDO PARA Monte Sião`);
      await this.client.sendMessage(MONTE_SIAO, data);
      console.log(`ENVIADA COM SUCESSO PARA Monte Sião às ${new Date()}`);
    } else {
      for (const groupName in groups) {
        const chatDestino = groups[groupName];
        console.log(`ENVIANDO PARA ${groupName}`);
        await this.client.sendMessage(chatDestino, data);
        console.log(`ENVIADA COM SUCESSO PARA ${groupName} às ${new Date()}`);
      }
    }

    return;
  }

  async downloadMusic(message: any) {
    const canonicalUrl = message?._data.canonicalUrl;

    const name = Date.now();
    const output = `./${name}.mp3`;

    const videoStream = ytdl(canonicalUrl, { quality: 'highestaudio' });
    const audioStream = fs.createWriteStream(output);

    videoStream.on('error', (error) => {
      console.error('Erro ao baixar o vídeo:', error);
    });

    audioStream.on('error', (error) => {
      console.error('Erro ao escrever o áudio no arquivo:', error);
    });

    audioStream.on('finish', () => {
      console.log('Conversão de vídeo para áudio finalizada');
    });

    videoStream.pipe(audioStream);

    await new Promise((resolve) => setTimeout(resolve, 10000));

    try {
      const audio = MessageMedia.fromFilePath(output);
      await this.client.sendMessage(message.from, audio);
      fs.unlinkSync(output);
      console.log('Áudio Enviado');
      return { message: 'POST ENVIADO COM SUCESSO' };
    } catch (error) {
      console.log(error);
    }
  }
}
