import { authenticate } from './auth.js';
import { Api } from 'telegram';
import { getFileInfo, __dirname, ensureDirs, ensureEnvVars } from './utils.js';
import { processors } from './processors/index.js';
import fs from 'fs';
import path from 'path';

ensureEnvVars();
ensureDirs();

if (!process.env.CHANNEL_NAME) {
  throw new Error('CHANNEL_NAME is not defined in environment variables');
}

const isGenericProcessorEnabled =
  process.env.ENABLE_GENERIC_PROCESSOR === 'true';
const channelName = process.env.CHANNEL_NAME;

const getOffsetFilename = (channelName) => {
  return path.join(__dirname, `${channelName}_offset.json`);
};

const readOffset = (channelName) => {
  const filename = getOffsetFilename(channelName);
  try {
    const data = fs.readFileSync(filename, 'utf8');
    const offset = JSON.parse(data).offsetId || 0;

    console.log(`Found previous offset for channel ${channelName}: ${offset}`);

    return offset;
  } catch (err) {
    console.error(
      `No previous offset found or error reading file for channel ${channelName}. Starting from the beginning.`
    );

    return 0;
  }
};

const writeOffset = (channelName, offsetId) => {
  const filename = getOffsetFilename(channelName);

  fs.writeFileSync(filename, JSON.stringify({ offsetId }), 'utf8');
};

const processMessages = async (client, channel, offsetId) => {
  const files = [];

  const result = await client.invoke(
    new Api.messages.GetHistory({
      peer: channel,
      offsetId: offsetId,
      limit: +process.env.MAX_MESSAGES_PER_RUN
    })
  );

  if (result.messages.length === 0) {
    console.log('No more messages to process.');
    process.exit(0);

    return;
  }

  for (const message of result.messages) {
    const file =
      message.media?.document ??
      message.media?.photo ??
      message.media?.video ??
      message.media?.audio;

    if (file) {
      const { originalFileName } = getFileInfo(file);

      if (originalFileName) {
        files.push(file);
      }
    }
  }

  console.log(`Found ${files.length} files to process.`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { extension } = getFileInfo(file);
    let processor = processors[extension];

    if (!processor && isGenericProcessorEnabled) {
      processor = processors['*'];
    }

    await processor?.(client, file);
  }

  const nextOffsetId = result.messages[result.messages.length - 1].id;

  writeOffset(channelName, nextOffsetId);

  setTimeout(
    () => processMessages(client, channel, nextOffsetId),
    process.env.SECONDS_BETWEEN_RUNS * 1000
  );
};

const client = await authenticate();
const channel = await client.getEntity(channelName);

const offsetId = readOffset(channelName);
await processMessages(client, channel, offsetId);
