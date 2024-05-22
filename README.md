# Teledown

Teledown is a tool designed to download files from Telegram groups using the
Telegram API.

## Installation

To install as a CLI:

```bash
npm install -g teledown
# or
yarn global add teledown
# or
pnpm install -g teledown
```

To install as a library:

```bash
npm install teledown
# or
yarn add teledown
# or
pnpm install teledown
```

## As a CLI

First you need to generate a config file. You can do this by running:

```bash
teledown --gen-config
```

Then open the file and fill it with your data. A sample config file looks like
this:

```json
{
  "API_ID": 0,
  "API_HASH": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "CHANNEL_NAME": "xxxxxxxxx",
  "MAX_MESSAGES_PER_RUN": 80,
  "SECONDS_BETWEEN_RUNS": 60,
  "OUT": "./downloads"
}
```

After you have filled the config file, you can start downloading files by
running:

```bash
teledown --config ./config.json
```

On the first run, you will be asked to authenticate with your phone number and a
code sent by Telegram. The session will be saved in a file called `session.txt`
in the same directory as the config file.

If you don't want to create a config file, you can pass the parameters directly.
To see all available parameters, run:

```bash
teledown --help
```

## As a library

```javascript
import { TeleDown } from 'teledown';

const teledown = new TeleDown({
  API_ID: 'your_api_id', // get it on https://my.telegram.org/apps
  API_HASH: 'your_api_hash', // get it on https://my.telegram.org/apps
  CHANNEL_NAME: 'your_channel_name', // this comes from the URL of the channel (https://t.me/your_channel_name)
  MAX_MESSAGES_PER_RUN: 100, // how many messages to download per run
  SECONDS_BETWEEN_RUNS: 60, // how many seconds to wait between runs
  OUT: './downloads' // where to save the files (relative to the current directory)
});

teledown.on('error', (err) => console.log(err));
teledown.on('got-messages', (messages, offsetId) =>
  console.log(`Found ${messages.length} messages with offset ${offsetId}`)
);
teledown.on('downloaded-file', ({ originalFileName, md5 }) =>
  console.log(`Downloaded ${originalFileName} (${md5})`)
);
teledown.on('start-batch', (offsetId) =>
  console.log(`Starting batch with offset ${offsetId}`)
);
teledown.on('end-batch', (offsetId) =>
  console.log(`Ending batch with offset ${offsetId}`)
);
teledown.on('end', (offsetId) =>
  console.log(`No more messages to process. Ending with offset ${offsetId}`)
);

await teledown.authenticate(); // if no session is found, it will ask for the phone number and the code sent by Telegram
teledown.start();
```

### Passing a filter function

You can pass a filter function to the constructor to filter files that will be
downloaded. The function recieves a `File` object and should return a boolean.

The API is as follows:

```javascript
const fileFilter = ({ fileName, extension, originalName }, telegramFile) => {
  // fileName: the name of the file as it will be saved
  // extension: the extension of the file
  // originalName: the original name of the file
  // telegramFile: the full file object from Telegram, read the Telegram API docs for more info

  return true; // will download the file
};
```

Example:

```javascript
const fileFilter = () => {
  return true; // will download all files
};

const teledown = new TeleDown(someConfig, fileFilter);

// rest of the code
```

Only download files with a specific extension:

```javascript
const fileFilter = ({ extension }) => {
  return file.extension === 'pdf'; // will only download .pdf files
};

const teledown = new TeleDown(someConfig, fileFilter);

// rest of the code
```

## Events

```javascript
teledown.on('error', (err) => {});
teledown.on('got-messages', (messages, offsetId) => {});
teledown.on(
  'downloaded-file',
  ({ path, fileName, originalFileName, extension, md5, telegramFile }) => {}
);
teledown.on('start-batch', (offsetId) => {});
teledown.on('end-batch', (offsetId) => {});
teledown.on('end', (offsetId) => {});
```

## How it works

Teledown uses the Telegram API to fetch messages from a specified channel or
group. It processes the messages in batches, downloading files that match the
specified criteria. The tool saves the offset of the last processed message,
allowing it to resume from where it left off in subsequent runs.

## Limits

The Telegram API has rate limits, so Teledown includes a configurable delay
(SECONDS_BETWEEN_RUNS) to avoid hitting these limits. The default delay is 60
seconds after processing each batch of 100 messages. The session TTL is also
something to be mindful of, as re-authentication may be required after a certain
period.

## Fair use

Use this tool responsibly and respect the terms of service of the Telegram API.
Do not abuse the API or use this tool for malicious purposes.
