import { AwsEndUserMessagingSocialProvider } from '@novu/providers';
import { ChannelTypeEnum, ChatProviderIdEnum, ICredentials } from '@novu/shared';
import { BaseChatHandler } from './base.handler';

export class AwsEndUserMessagingSocialHandler extends BaseChatHandler {
  constructor() {
    super(ChatProviderIdEnum.AwsEndUserMessagingSocial, ChannelTypeEnum.CHAT);
  }

  buildProvider(credentials: ICredentials) {
    this.provider = new AwsEndUserMessagingSocialProvider({
      accessKeyId: credentials.accessKeyId as string,
      secretAccessKey: credentials.secretAccessKey as string,
      region: credentials.region as string,
      originationPhoneNumberId: credentials.originationPhoneNumberId as string,
    });
  }
}
