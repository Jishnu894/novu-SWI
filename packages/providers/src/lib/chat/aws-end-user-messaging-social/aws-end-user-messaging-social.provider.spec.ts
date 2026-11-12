import { SendWhatsAppMessageCommand, SocialMessagingClient } from '@aws-sdk/client-socialmessaging';
import { ENDPOINT_TYPES, IChatOptions } from '@novu/stateless';
import { afterEach, expect, test, vi } from 'vitest';
import { AwsEndUserMessagingSocialProvider } from './aws-end-user-messaging-social.provider';

afterEach(() => vi.restoreAllMocks());

test('sends a WhatsApp text message using AWS End User Messaging Social', async () => {
  const send = vi
    .spyOn(SocialMessagingClient.prototype, 'send')
    .mockResolvedValue({ messageId: 'message-123' } as never);
  const provider = new AwsEndUserMessagingSocialProvider({
    accessKeyId: 'key',
    secretAccessKey: 'secret',
    region: 'us-east-1',
    originationPhoneNumberId: 'phone-id',
  });
  const options: IChatOptions = {
    content: 'Hello from Novu',
    channelData: { identifier: 'whatsapp', type: ENDPOINT_TYPES.PHONE, endpoint: { phoneNumber: '+15551234567' } },
  };

  await expect(provider.sendMessage(options)).resolves.toMatchObject({ id: 'message-123' });
  expect(send).toHaveBeenCalledWith(expect.any(SendWhatsAppMessageCommand));
  const command = send.mock.calls[0][0] as SendWhatsAppMessageCommand;
  expect(command.input).toEqual({
    originationPhoneNumberId: 'phone-id',
    metaApiVersion: 'v20.0',
    message: Buffer.from(
      JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+15551234567',
        type: 'text',
        text: { body: 'Hello from Novu', preview_url: false },
      })
    ),
  });
});
