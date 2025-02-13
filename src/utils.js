import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const queries = {
   getMergeRequests: `
    query($usernames: [String!]!, $startDate: Time, $endDate: Time, $after: String) {
      users(usernames: $usernames) {
        nodes {
          username
          authoredMergeRequests(mergedAfter: $startDate, mergedBefore: $endDate, first: 500, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              mergedAt
              author {
                username
              }
            }
          }
        }
      }
    }
  `
};

export async function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  try {
    const config = await fs.readFile(configPath, 'utf8');
    return JSON.parse(config);
  } catch {
    return null;
  }
}

export async function saveConfig(config) {
  const configPath = path.join(__dirname, '..', 'config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function promptConfig() {
  // Load existing config if available
  const existingConfig = await loadConfig();
  
  const questions = [
    {
      type: 'input',
      name: 'gitlabUrl',
      message: '🌐 Enter your GitLab instance URL:',
      default: existingConfig?.gitlabUrl || 'https://gitlab.com',
      transformer: (input) => input.trim().replace(/\/$/, '') // Remove trailing slash if present
    },
    {
      type: 'input',
      name: 'accessToken',
      message: '🔑 Enter your GitLab access token (press Enter to keep existing token):',
      default: existingConfig?.accessToken || undefined,
      transformer: (input) => {
        // If using existing token, show placeholder
        if (input === existingConfig?.accessToken) {
          return '(existing token)';
        }
        // Show asterisks for new token
        return input ? '*'.repeat(input.length) : '';
      }
    },
    {
      type: 'input',
      name: 'usernames',
      message: '👥 Enter GitLab usernames to analyze (comma-separated):',
      default: existingConfig?.usernames ? existingConfig.usernames.join(',') : undefined,
      filter: (input) => input.split(',').map(name => name.trim()).filter(Boolean),
      validate: (input) => {
        if (!input || input.length === 0) {
          return 'At least one username is required';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'concurrentRequests',
      message: '⚡️ Enter maximum concurrent requests (press Enter for default):',
      default: existingConfig?.concurrentRequests || 25,
      filter: (input) => parseInt(input) || 25,
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1) {
          return 'Please enter a valid number greater than 0';
        }
        return true;
      }
    }
  ];

  const answers = await inquirer.prompt(questions);

  // If user just pressed enter for access token, keep the existing one
  if (existingConfig && !answers.accessToken) {
    answers.accessToken = existingConfig.accessToken;
  }

  return answers;
}

export async function promptCollectOptions(options) {
  const questions = [];

  if (!options.startDate) {
    questions.push({
      type: 'input',
      name: 'startDate',
      message: '📅 Enter start date (YYYY-MM-DD):',
      validate: (input) => {
        const date = new Date(input);
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date in YYYY-MM-DD format';
        }
        return true;
      }
    });
  }

  if (!options.endDate) {
    questions.push({
      type: 'input',
      name: 'endDate',
      message: '📅 Enter end date (YYYY-MM-DD):',
      validate: (input) => {
        const date = new Date(input);
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date in YYYY-MM-DD format';
        }
        return true;
      }
    });
  }

  if (!options.format) {
    questions.push({
      type: 'list',
      name: 'format',
      message: '📊 Select export format:',
      choices: ['csv', 'html'],
      default: 'csv'
    });
  }

  if (questions.length === 0) {
    return options;
  }

  const answers = await inquirer.prompt(questions);
  return { ...options, ...answers };
}
