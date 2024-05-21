import { authenticate } from './auth.js';

await authenticate();

console.log('Authentication successful');

process.exit(0);
