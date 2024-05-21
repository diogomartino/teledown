import path from 'path';
import { EPub } from 'epub2';
import fs from 'fs';
import { getFileInfo, __dirname } from '../utils.js';

const sanitize = (fileName) => {
  return fileName
    .replace(/[^a-z0-9áéíóúüñçàèìòùâêîôûãäëïöüß_]/gi, '_')
    .replace(/_+/g, '_')
    .toUpperCase()
    .trim();
};

const getBookName = (metadata) => {
  let name = `${metadata.title}_${metadata.creator}`;

  if (metadata.language) {
    name += `_${metadata.language}`;
  }

  return `${sanitize(name)}.epub`;
};

export default async (client, file) => {
  const { originalFileName } = getFileInfo(file);

  const tempPath = path.join(__dirname, `./temp/${originalFileName}`);
  await client.downloadMedia(file, {
    outputFile: tempPath
  });

  await importEbook(tempPath);
};

export const importEbook = async (filePath) => {
  const { metadata } = await EPub.createAsync(filePath);
  const finalName = getBookName(metadata);

  const finalPath = path.join(__dirname, `./ebooks/${finalName}`);
  fs.renameSync(filePath, finalPath);

  console.log(
    `Imported ${metadata.title} by ${metadata.creator} (${
      metadata.language ?? 'No language'
    }) (${metadata.ISBN ?? 'No ISBN'})`
  );
};
