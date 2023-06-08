import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class OpenaiService {
  private openaiClient: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_TOKEN,
    });

    this.openaiClient = new OpenAIApi(configuration);
  }

  async getAnswerToLife(messageReceived: string): Promise<string> {
    const completion = await this.openaiClient.createCompletion({
      max_tokens: 2000,
      model: 'davinci',
      prompt: messageReceived,
      n: 1,
    });

    return completion.data.choices[0].text;
  }
}
