# Teledown

Download files from telegram groups using the telegrap API. This tool was intended to download .epub files only, but it can be easily modified to download any file type. I included a generic file processor that will download any file type, but it will not process the files. Set `ENABLE_GENERIC_PROCESSOR` to `true` in the `.env` file to enable the generic file processor. The processors can easily be extended to process the files as needed. 

## Installation

Clone the repository and install the dependencies using pnpm:

```bash
pnpm install
```

## Usage

1. Rename the `.env.example` file to `.env` and fill in the required fields. You
   can find your telegram credentials by creating a new app at
   [https://my.telegram.org/apps](https://my.telegram.org/apps).

2. Authenticate with the telegram API by running the following command:

```bash
pnpm auth
```

3. Run the following command to download files from the telegram channel or
   group:

```bash
pnpm start
```

The `CHANNEL_NAME` is the unique name of the channel or group. You can find it in
the URL of the channel or group. For example, the `CHANNEL_NAME` for the URL
`https://t.me/some_channel` is `some_channel`.

## How it works

The tool uses the telegram API to get the messages from the channel or group. It
always reads from the beginning of the channel or group, so it will download all
the files that have been posted since the channel or group was created. It will
process 100 messages at a time (can be changed in the .env) and download the
files that match the specified file type and then processed accordingly. The
amount of processed messages is saved so that the next time the tool is run, it
will start from the last processed message.

## Limits

I don't know the limits of the telegram API, so the tool has a built-in delay
which can be configured in the `.env` file. The default delay is 60 seconds
after processing 100 messages. I also don't know the TTL of the session, so
watch out for that as you might need to re-authenticate after a while.
