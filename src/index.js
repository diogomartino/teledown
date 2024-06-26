import { Api } from 'telegram';
import { TelegramClient, sessions } from 'telegram';
import input from 'input';
import { getFileInfo, cwd, validateConfig, md5File } from './utils.js';
import fs from 'fs';
import path from 'path';

const EVENTS = {
  GOT_MESSAGES: 'got-messages',
  DOWNLOADED_FILE: 'downloaded-file',
  ERROR: 'error',
  START_BATCH: 'start-batch',
  END_BATCH: 'end-batch',
  END: 'end'
};

class TeleDown {
  #config = {};
  #client = null;
  #channel = null;
  #downloadFilter = null;
  #listeners = {};
  #timeout = null;
  #running = false;

  constructor(config, filter = () => true) {
    validateConfig(config);

    this.#config = config;
    this.#downloadFilter = filter;
    this.#readOffset();
  }

  on(event, callback) {
    if (!Object.values(EVENTS).includes(event)) {
      throw new Error(`Event ${event} is not supported`);
    }

    if (typeof callback !== 'function') {
      throw new Error('Listener must be a function');
    }

    const nextId = Object.keys(this.#listeners).length + 1;

    this.#listeners[nextId] = {
      event,
      callback
    };

    return nextId;
  }

  off(id) {
    delete this.#listeners[id];
  }

  offAll() {
    this.#listeners = {};
  }

  #getListeners(event) {
    return Object.values(this.#listeners).filter(
      (listener) => listener.event === event
    );
  }

  #getOffsetFilename() {
    return path.join(cwd, 'offsets.json');
  }

  #readOffset() {
    const filename = this.#getOffsetFilename();
    const offsetExists = fs.existsSync(filename);

    if (!offsetExists) {
      return 0;
    }

    const data = fs.readFileSync(filename, 'utf8');
    const offsets = JSON.parse(data);
    const offset = offsets[this.#config.CHANNEL_NAME] ?? 0;

    return offset;
  }

  #writeOffset(offsetId) {
    const filename = this.#getOffsetFilename();
    let offsets = {};

    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename, 'utf8');
      offsets = JSON.parse(data);
    }

    offsets[this.#config.CHANNEL_NAME] = offsetId;

    fs.writeFileSync(filename, JSON.stringify(offsets), 'utf8');
  }

  async authenticate(clientOptions = {}) {
    const sessionPath = path.join(cwd, 'session.txt');
    const sessionExists = fs.existsSync(sessionPath);
    const savedSession =
      sessionExists && fs.readFileSync(sessionPath, { encoding: 'utf-8' });
    const stringSession = new sessions.StringSession(savedSession || '');

    const client = new TelegramClient(
      stringSession,
      this.#config.API_ID,
      this.#config.API_HASH,
      {
        connectionRetries: 20,
        retryDelay: 2000,
        downloadRetries: 20,
        maxConcurrentDownloads: 5,
        autoReconnect: true,
        requestRetries: 20,
        ...clientOptions
      }
    );

    await client.start({
      phoneNumber: async () => await input.text('Please enter your number: '),
      password: async () => await input.text('Please enter your password: '),
      phoneCode: async () =>
        await input.text('Please enter the code you received: '),
      onError: (err) => {
        this.#getListeners(EVENTS.ERROR).forEach((listener) =>
          listener.callback(err)
        );
      }
    });

    fs.writeFileSync(sessionPath, client.session.save());

    await client.sendMessage('me', {
      message: `Teledown logged in ${new Date().toISOString()}`
    });

    const channel = await client.getEntity(this.#config.CHANNEL_NAME);

    this.#client = client;
    this.#channel = channel;

    return client;
  }

  async #downloadFile(file) {
    try {
      const { fileName, extension, originalFileName } = getFileInfo(file);

      const downloadDir = path.normalize(this.#config.OUT);

      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
      }

      let uniquePath = path.join(downloadDir, `/${fileName}.${extension}`);
      let i = 1;

      while (fs.existsSync(uniquePath)) {
        uniquePath = path.join(downloadDir, `/${fileName}_${i}.${extension}`);
        i++;
      }

      await this.#client.downloadMedia(file, {
        outputFile: uniquePath
      });

      for (const listener of this.#getListeners(EVENTS.DOWNLOADED_FILE)) {
        await listener.callback({
          path: uniquePath,
          fileName,
          originalFileName,
          extension,
          md5: md5File(uniquePath),
          telegramFile: file
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  #killTimeout() {
    if (this.#timeout) {
      clearTimeout(this.#timeout);
    }
  }

  async #processMessages(offsetId) {
    for (const listener of this.#getListeners(EVENTS.START_BATCH)) {
      await listener.callback(offsetId);
    }

    const files = [];

    const result = await this.#client.invoke(
      new Api.messages.GetHistory({
        peer: this.#channel,
        offsetId: offsetId,
        limit: +process.env.MAX_MESSAGES_PER_RUN,
        addOffset: 0,
        minId: 0,
        maxId: 0,
        offsetDate: 0,
        hash: 0
      })
    );

    for (const listener of this.#getListeners(EVENTS.GOT_MESSAGES)) {
      await listener.callback(result.messages, offsetId);
    }

    if (result.messages.length === 0) {
      for (const listener of this.#getListeners(EVENTS.END)) {
        await listener.callback(offsetId);
      }

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

    const promises = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const shouldDownload = await this.#downloadFilter(file);

      if (shouldDownload) {
        promises.push(this.#downloadFile(file));
      }
    }

    await Promise.all(promises);

    const lastMessage = result.messages[result.messages.length - 1];
    const nextOffsetId = lastMessage.id;

    this.#writeOffset(nextOffsetId);

    if (this.#running) {
      this.#timeout = setTimeout(
        () => this.#processMessages(nextOffsetId),
        this.#config.SECONDS_BETWEEN_RUNS * 1000
      );
    }

    for (const listener of this.#getListeners(EVENTS.END_BATCH)) {
      await listener.callback(nextOffsetId);
    }
  }

  async start() {
    this.#killTimeout();
    this.#running = true;

    const currentOffset = this.#readOffset();

    this.#processMessages(currentOffset);
  }

  async stop() {
    this.#killTimeout();
    this.#running = false;
  }

  isRunning() {
    return this.#running;
  }
}

export default TeleDown;
