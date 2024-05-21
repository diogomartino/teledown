import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

export const getFileInfo = (file) => {
  const fileName = file.attributes?.[0]?.fileName;
  const extension = fileName?.split('.').pop();

  return {
    fileName: fileName?.replace(/\.[^/.]+$/, ''),
    extension,
    originalFileName: fileName
  };
};

export const ensureDirs = () => {
  const dirs = ['temp', 'ebooks', 'downloads'];

  dirs.forEach((dir) => {
    const fullPath = path.join(__dirname, dir);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  });

  fs.readdirSync(path.join(__dirname, 'temp')).forEach((file) => {
    fs.unlinkSync(path.join(__dirname, 'temp', file));
  });
};

export const ensureEnvVars = () => {
  const envVars = [
    'API_ID',
    'API_HASH',
    'CHANNEL_NAME',
    'MAX_MESSAGES_PER_RUN',
    'SECONDS_BETWEEN_RUNS',
    'ENABLE_GENERIC_PROCESSOR'
  ];

  envVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      console.error(`Missing environment variable: ${envVar}`);
      process.exit(1);
    }
  });
};

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
