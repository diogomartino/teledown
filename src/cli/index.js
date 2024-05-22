#!/usr/bin/env node
import path from 'path';
import { cwd } from '../utils.js';
import fs from 'fs';
import { getOptions } from './get-options.js';
import TeleDown from '../index.js';

const { options, usage } = getOptions();

if (options.help) {
  console.log(usage);
  process.exit(0);
}

if (options['gen-config']) {
  const config = {
    API_ID: 0,
    API_HASH: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    CHANNEL_NAME: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    MAX_MESSAGES_PER_RUN: 10,
    SECONDS_BETWEEN_RUNS: 60,
    OUT: './downloads'
  };

  const configStr = JSON.stringify(config, null, 2);
  const configPath = path.join(cwd, 'config.json');

  fs.writeFileSync(configPath, configStr);

  console.log(`Configuration file created on ${configPath}.`);
  process.exit(0);
}

let config;

if (options.config) {
  const configPath = path.join(cwd, options.config);
  const configExists = fs.existsSync(configPath);

  if (!configExists) {
    console.error('Configuration file does not exist.');
    process.exit(1);
  }

  const configStr = fs.readFileSync(configPath, 'utf8');
  const configJson = JSON.parse(configStr ?? '{}');

  config = {
    API_ID: +configJson.API_ID,
    API_HASH: configJson.API_HASH,
    CHANNEL_NAME: configJson.CHANNEL_NAME,
    MAX_MESSAGES_PER_RUN: +configJson.MAX_MESSAGES_PER_RUN,
    SECONDS_BETWEEN_RUNS: +configJson.SECONDS_BETWEEN_RUNS,
    OUT: configJson.OUT
  };
} else {
  config = {
    API_ID: +options['api-id'],
    API_HASH: options['api-hash'],
    CHANNEL_NAME: options['channel-name'],
    MAX_MESSAGES_PER_RUN: +options['max-files-per-run'],
    SECONDS_BETWEEN_RUNS: +options['seconds-between-runs'],
    OUT: options.out
  };
}

const teledown = new TeleDown(config);

teledown.on('error', (err) => console.log(err));

teledown.on('got-messages', (messages, offsetId) => {
  console.log(`Found ${messages.length} messages with offset ${offsetId}`);
});

teledown.on('downloaded-file', ({ originalFileName, md5 }) => {
  console.log(`Downloaded ${originalFileName} (${md5})`);
});

teledown.on('start-batch', (offsetId) => {
  console.log(`Starting batch with offset ${offsetId}`);
});

teledown.on('end-batch', (offsetId) => {
  console.log(`Ending batch with offset ${offsetId}`);
});

teledown.on('end', (offsetId) => {
  console.log(`No more messages to process. Ending with offset ${offsetId}`);
});

await teledown.authenticate();
teledown.start();
