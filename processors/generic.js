import path from 'path';
import fs from 'fs';
import { getFileInfo, __dirname } from '../utils.js';

export default async (client, file) => {
  const { fileName, extension } = getFileInfo(file);

  let uniquePath = path.join(__dirname, `./downloads/${fileName}.${extension}`);
  let i = 1;

  while (fs.existsSync(uniquePath)) {
    uniquePath = path.join(
      __dirname,
      `./downloads/${fileName}(${i}).${extension}`
    );
    i++;
  }

  await client.downloadMedia(file, {
    outputFile: uniquePath
  });

  console.log(`Downloaded to ${uniquePath}`);
};
