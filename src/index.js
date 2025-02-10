// src/index.js
import { program } from 'commander';
import chalk from 'chalk';
import { GitLabMetrics } from './metrics.js';
import { promptConfig, saveConfig, loadConfig } from './utils.js';

program
  .name('gitlab-metrics')
  .description('CLI tool for collecting GitLab merge request metrics')
  .version('1.0.0');

program
  .command('configure')
  .description('Configure GitLab credentials and settings')
  .action(async () => {
    const config = await promptConfig();
    await saveConfig(config);
    console.log(chalk.green('Configuration saved successfully!'));
  });

program
  .command('collect')
  .description('Collect merge request metrics')
  .requiredOption('-s, --start-date <date>', 'Start date (YYYY-MM-DD)')
  .requiredOption('-e, --end-date <date>', 'End date (YYYY-MM-DD)')
  .option('-o, --output <filename>', 'Output filename', 'metrics.csv')
  .action(async (options) => {
    try {
      const config = await loadConfig();
      if (!config) {
        console.error(chalk.red('Please run configure command first'));
        process.exit(1);
      }

      console.log(chalk.blue('\nStarting metrics collection...'));
      console.log(chalk.dim(`Time period: ${options.startDate} to ${options.endDate}`));

      const metrics = new GitLabMetrics(config);
      const startTime = Date.now();

      const authorStats = await metrics.getMergeRequestData(options.startDate, options.endDate);
      await metrics.exportToCsv(authorStats, options.output);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(chalk.green('\nCollection completed successfully!'));
      console.log(chalk.blue('\nSummary:'));
      console.log(`Duration: ${duration} seconds`);

    } catch (error) {
      console.error(chalk.red('\nError:', error.message));
      process.exit(1);
    }
  });

export { program };
