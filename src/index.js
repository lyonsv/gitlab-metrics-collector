// src/index.js
import { Command } from 'commander';
import { promptConfig, saveConfig, loadConfig, promptCollectOptions } from './utils.js';
import { GitLabMetrics } from './metrics.js';

const program = new Command();

program
  .name('gitlab-metrics')
  .description('CLI tool for collecting GitLab merge request metrics')
  .version('1.0.4');

program
  .command('configure')
  .description('Configure GitLab settings')
  .action(async () => {
    try {
      const config = await promptConfig();
      await saveConfig(config);
      console.log('Configuration saved successfully!');
    } catch (error) {
      console.error('Configuration failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('collect')
  .description('Collect merge request metrics')
  .option('-s, --start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('-e, --end-date <date>', 'End date (YYYY-MM-DD)')
  .option('-o, --output <file>', 'Output file path', 'metrics.csv')
  .option('-c, --concurrent <number>', 'Maximum concurrent requests', '25')
  .option('-f, --format <type>', 'Export format (csv or html)', 'csv')
  .action(async (options) => {
    try {
      const config = await loadConfig();
      if (!config) {
        console.error('No configuration found. Please run "gitlab-metrics configure" first.');
        process.exit(1);
      }

      // Prompt for any missing required options
      const collectionOptions = await promptCollectOptions(options);

      config.concurrentRequests = parseInt(collectionOptions.concurrent);
      const metrics = new GitLabMetrics(config);
      const data = await metrics.getMergeRequestData(collectionOptions.startDate, collectionOptions.endDate);

      if (collectionOptions.format === 'html') {
        const outputPath = collectionOptions.output.replace(/\.(csv|html)?$/, '.html');
        await metrics.exportToHtml(data, outputPath);
        console.log(`Data exported successfully to ${outputPath}`);
      } else {
        await metrics.exportToCsv(data, collectionOptions.output);
      }
    } catch (error) {
      console.error('Data collection failed:', error.message);
      process.exit(1);
    }
  });

export { program };
