import dotenv from 'dotenv';

dotenv.config();

import { TelegramClient, sessions } from 'telegram';
import input from 'input';
import fs from 'fs';

export const authenticate = async () => {
  const savedSession = fs.readFileSync('session.txt', { encoding: 'utf-8' });
  const stringSession = new sessions.StringSession(savedSession ?? '');

  const client = new TelegramClient(
    stringSession,
    +process.env.API_ID,
    process.env.API_HASH,
    {
      connectionRetries: 10,
      retryDelay: 1000,
      downloadRetries: 10,
      maxConcurrentDownloads: 5,
      autoReconnect: true,
      requestRetries: 10
    }
  );

  await client.start({
    phoneNumber: async () => await input.text('Please enter your number: '),
    password: async () => await input.text('Please enter your password: '),
    phoneCode: async () =>
      await input.text('Please enter the code you received: '),
    onError: (err) => console.log(err)
  });

  fs.writeFileSync('session.txt', client.session.save());

  await client.sendMessage('me', {
    message: `New login from ${new Date().toISOString()}`
  });

  return client;
};
