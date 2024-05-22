import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

export const getOptions = () => {
  const options = commandLineArgs([
    { name: 'gen-config', type: Boolean },
    { name: 'config', alias: 'c', type: String },
    { name: 'api-id', type: String },
    { name: 'api-hash', type: String },
    { name: 'max-files-per-run', type: Number, defaultValue: 10 },
    { name: 'seconds-between-runs', type: Number, defaultValue: 60 },
    { name: 'out', alias: 'o', type: String, defaultValue: './downloads' },
    { name: 'help', alias: 'h', type: Boolean }
  ]);

  const usage = commandLineUsage([
    {
      header: 'TELEDOWN',
      content: 'Downloads files from Telegram channels.'
    },
    {
      header: 'Options',
      optionList: [
        {
          name: 'gen-config',
          type: Boolean,
          description: 'Generate an empty configuration file.'
        },
        {
          name: 'config',
          typeLabel: '{underline file_path}',
          description: 'Path to the configuration file.'
        },
        {
          name: 'api-id',
          typeLabel: '{underline api_id}',
          description: 'API ID from the Telegram API.'
        },
        {
          name: 'api-hash',
          typeLabel: '{underline api_hash}',
          description: 'API Hash'
        },
        {
          name: 'max-files-per-run',
          typeLabel: '{underline number}',
          description:
            'Maximum number of files to download in a single run. (default: 10)'
        },
        {
          name: 'seconds-between-runs',
          typeLabel: '{underline number}',
          description: 'Number of seconds to wait between runs. (default: 60)'
        },
        {
          name: 'out',
          typeLabel: '{underline dir_path}',
          description:
            'Output directory for the downloaded files. (default: ./downloads)'
        }
      ]
    }
  ]);

  return { options, usage };
};
