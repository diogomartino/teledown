import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

export const getFileInfo = (file) => {
  const fileName = file.attributes?.[0]?.fileName;
  const extension = fileName?.split('.').pop()?.toLowerCase();

  return {
    fileName: fileName?.replace(/\.[^/.]+$/, ''),
    extension,
    originalFileName: fileName
  };
};

export const validateConfig = (config) => {
  const fields = {
    API_ID: 'number',
    API_HASH: 'string',
    CHANNEL_NAME: 'string',
    MAX_MESSAGES_PER_RUN: 'number',
    SECONDS_BETWEEN_RUNS: 'number',
    OUT: 'string'
  };

  Object.entries(fields).forEach(([field, type]) => {
    if (typeof config[field] !== type) {
      console.error(
        `Invalid field ${field}. Expected ${type}, got ${typeof config[field]}.`
      );
      process.exit(1);
    }
  });

  if (config.MAX_MESSAGES_PER_RUN < 1) {
    console.error('MAX_MESSAGES_PER_RUN must be greater than 0');
    process.exit(1);
  }

  if (config.SECONDS_BETWEEN_RUNS < 1) {
    console.error('SECONDS_BETWEEN_RUNS must be greater than 0');
    process.exit(1);
  }
};

export const md5File = (filePath) => {
  const hash = crypto.createHash('md5');
  const input = fs.readFileSync(filePath);

  return hash.update(input).digest('hex');
};

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export const cwd = process.cwd();
