import { SendWhatsAppMessageCommand, SocialMessagingClient } from '@aws-sdk/client-socialmessaging';
import { ChatProviderIdEnum, ENDPOINT_TYPES } from '@novu/shared';
import {
  CardElement,
  ChannelTypeEnum,
  IChatOptions,
  IChatProvider,
  IChatRenderResult,
  ISendMessageSuccessResponse,
  isChannelDataOfType,
} from '@novu/stateless';
import { BaseProvider, CasingEnum } from '../../../base.provider';
import { WithPassthrough } from '../../../utils/types';
import { cardToWhatsAppText } from '../whatsapp-business/card-render.utils';

type AwsEndUserMessagingSocialConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  originationPhoneNumberId: string;
};

export class AwsEndUserMessagingSocialProvider extends BaseProvider implements IChatProvider {
  id = ChatProviderIdEnum.AwsEndUserMessagingSocial;
  protected casing: CasingEnum = CasingEnum.SNAKE_CASE;
  channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
  private readonly client: SocialMessagingClient;

  constructor(private readonly config: AwsEndUserMessagingSocialConfig) {
    super();
    this.client = new SocialMessagingClient({
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }

  async render(card: CardElement): Promise<IChatRenderResult> {
    return { nativePayload: {}, content: cardToWhatsAppText(card), validation: [] };
  }

  async sendMessage(
    options: IChatOptions,
    bridgeProviderData: WithPassthrough<Record<string, unknown>> = {}
  ): Promise<ISendMessageSuccessResponse> {
    if (!isChannelDataOfType(options.channelData, ENDPOINT_TYPES.PHONE)) {
      throw new Error('Invalid channel data for AWS End User Messaging Social provider');
    }

    const customData = options.customData as Record<string, unknown> | undefined;
    const messageType =
      typeof customData?.type === 'string'
        ? customData.type
        : (customData &&
            ['template', 'image', 'audio', 'document', 'video', 'location', 'interactive'].find(
              (key) => key in customData
            )) ||
          'text';
    const messageBody = customData?.[messageType] ?? {
      body: options.content,
      preview_url: false,
    };
    const payload = this.transform(bridgeProviderData, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: options.channelData.endpoint.phoneNumber,
      type: messageType,
      [messageType]: messageBody,
    }).body as Record<string, unknown>;
    const resolvedType = typeof payload.type === 'string' ? payload.type : messageType;
    payload.type = resolvedType;
    for (const type of ['text', 'template', 'image', 'audio', 'document', 'video', 'location', 'interactive']) {
      if (type !== resolvedType) {
        delete payload[type];
      }
    }
    const response = await this.client.send(
      new SendWhatsAppMessageCommand({
        originationPhoneNumberId: this.config.originationPhoneNumberId,
        message: Buffer.from(JSON.stringify(payload)),
        metaApiVersion: 'v20.0',
      })
    );

    return { id: response.messageId, date: new Date().toISOString() };
  }
}
