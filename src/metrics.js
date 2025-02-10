import ora from 'ora';
import { createObjectCsvWriter } from 'csv-writer';
import { GitLabAPI } from './api.js';
import { queries } from './utils.js';

export class GitLabMetrics {
  constructor(config) {
    this.api = new GitLabAPI(config);
  }

  async getMergeRequestData(startDate, endDate) {
    const authorStats = {};
    const spinner = ora('Preparing data collection...').start();
    
    try {
      // Initialize stats for all users
      for (const username of this.api.config.usernames) {
        authorStats[username] = {};
      }

      // Process users in parallel batches - increased for modern machines
      const batchSize = 10; // Process 10 users at a time
      const userBatches = [];
      
      for (let i = 0; i < this.api.config.usernames.length; i += batchSize) {
        userBatches.push(this.api.config.usernames.slice(i, i + batchSize));
      }

      let processedUsers = 0;
      const totalUsers = this.api.config.usernames.length;

      for (const batch of userBatches) {
        spinner.text = `Processing users... ${processedUsers}/${totalUsers}`;
        
        const batchPromises = batch.map(async username => {
          let hasMorePages = true;
          let cursor = null;
          let totalMRs = 0;

          while (hasMorePages) {
            const response = await this.api.fetchWithRetry(queries.getMergeRequests, {
              usernames: [username],
              startDate,
              endDate,
              after: cursor
            });

            const user = response.data.users.nodes[0];
            if (!user) continue;

            const mrs = user.authoredMergeRequests;
            mrs.nodes.forEach(mr => {
              const date = new Date(mr.mergedAt);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              
              if (!authorStats[username][monthKey]) {
                authorStats[username][monthKey] = 0;
              }
              authorStats[username][monthKey]++;
              totalMRs++;
            });

            hasMorePages = mrs.pageInfo.hasNextPage;
            cursor = mrs.pageInfo.endCursor;
          }

          processedUsers++;
          spinner.text = `Processing users... ${processedUsers}/${totalUsers} (${username}: ${totalMRs} MRs)`;
        });

        // Wait for current batch to complete before moving to next batch
        await Promise.all(batchPromises);
      }

      spinner.succeed(`Data collection completed - Processed ${processedUsers} users`);
      return authorStats;
    } catch (error) {
      spinner.fail('Data collection failed');
      throw error;
    }
  }

  async exportToCsv(authorStats, filename) {
    const spinner = ora('Exporting to CSV...').start();

    try {
      // Get all unique months and cache the date objects to avoid repeated creation
      const monthsMap = new Map();
      const months = [...new Set(
        Object.values(authorStats).flatMap(stats => Object.keys(stats))
      )].sort();

      // Pre-compute month names
      months.forEach(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });
        monthsMap.set(month, { monthName, year });
      });

      const formattedData = Object.entries(authorStats).map(([author, monthCounts]) => {
        const row = { Author: author };
        months.forEach(month => {
          const { monthName, year } = monthsMap.get(month);
          const columnName = `${monthName} ${year}`;
          row[columnName] = monthCounts[month] || 0;
        });
        return row;
      });

      const csvWriter = createObjectCsvWriter({
        path: filename,
        header: [
          { id: 'Author', title: 'Author' },
          ...months.map(month => {
            const { monthName, year } = monthsMap.get(month);
            return { id: `${monthName} ${year}`, title: `${monthName} ${year}` };
          })
        ]
      });

      await csvWriter.writeRecords(formattedData);
      spinner.succeed(`Data exported successfully to ${filename}`);
    } catch (error) {
      spinner.fail('Failed to export data');
      throw error;
    }
  }
}
