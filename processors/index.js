import epubProcessor from './epub.js';
import genericProcessor from './generic.js';

export const processors = {
  epub: epubProcessor,
  '*': genericProcessor
};
