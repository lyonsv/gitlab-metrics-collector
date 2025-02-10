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

export async function promptConfig() {
  const questions = [
    {
      type: 'input',
      name: 'gitlabUrl',
      message: 'Enter your GitLab instance URL:',
      default: 'https://gitlab.com'
    },
    {
      type: 'input',
      name: 'accessToken',
      message: 'Enter your GitLab access token:',
      validate: input => input.length > 0
    },
    {
      type: 'input',
      name: 'usernames',
      message: 'Enter GitLab usernames to analyze (comma-separated):',
      filter: input => input.split(',').map(name => name.trim())
    }
  ];

  return inquirer.prompt(questions);
}

export async function saveConfig(config) {
  const configPath = path.join(__dirname, '..', 'config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  try {
    const config = await fs.readFile(configPath, 'utf8');
    return JSON.parse(config);
  } catch {
    return null;
  }
}
