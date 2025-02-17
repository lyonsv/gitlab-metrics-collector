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
  
  // If we have existing teams, ask what action to take
  let action = 'add';
  if (existingConfig?.teams?.length > 0) {
    const { selectedAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAction',
        message: '🔧 What would you like to do?',
        choices: [
          { name: 'Add a new team', value: 'add' },
          { name: 'Remove a team', value: 'remove' },
          { name: 'Change default team', value: 'default' },
          { name: 'Update GitLab settings', value: 'settings' }
        ]
      }
    ]);
    action = selectedAction;
  }

  if (action === 'remove') {
    const { teamToRemove } = await inquirer.prompt([
      {
        type: 'list',
        name: 'teamToRemove',
        message: '❌ Select team to remove:',
        choices: existingConfig.teams.map(team => ({
          name: `${team.name}${team.isDefault ? ' (Default)' : ''}`,
          value: team.name
        }))
      }
    ]);

    existingConfig.teams = existingConfig.teams.filter(t => t.name !== teamToRemove);
    
    // If we removed the default team and there are other teams, prompt for new default
    if (existingConfig.teams.length > 0 && existingConfig.teams.every(t => !t.isDefault)) {
      const { newDefault } = await inquirer.prompt([
        {
          type: 'list',
          name: 'newDefault',
          message: '⭐️ Select new default team:',
          choices: existingConfig.teams.map(t => t.name)
        }
      ]);
      existingConfig.teams = existingConfig.teams.map(team => ({
        ...team,
        isDefault: team.name === newDefault
      }));
    }

    return existingConfig;
  }

  if (action === 'default') {
    const { newDefault } = await inquirer.prompt([
      {
        type: 'list',
        name: 'newDefault',
        message: '⭐️ Select new default team:',
        choices: existingConfig.teams.map(team => ({
          name: `${team.name}${team.isDefault ? ' (Current Default)' : ''}`,
          value: team.name
        }))
      }
    ]);

    existingConfig.teams = existingConfig.teams.map(team => ({
      ...team,
      isDefault: team.name === newDefault
    }));

    return existingConfig;
  }

  // For add or settings actions, continue with the regular configuration
  const questions = [
    {
      type: 'input',
      name: 'gitlabUrl',
      message: '🌐 Enter your GitLab instance URL:',
      default: existingConfig?.gitlabUrl || 'https://gitlab.com',
      when: () => action === 'settings' || !existingConfig,
      transformer: (input) => input.trim().replace(/\/$/, '') // Remove trailing slash if present
    },
    {
      type: 'input',
      name: 'accessToken',
      message: '🔑 Enter your GitLab access token (press Enter to keep existing token):',
      default: existingConfig?.accessToken || undefined,
      when: () => action === 'settings' || !existingConfig,
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
      name: 'teamName',
      message: '👥 Enter team name:',
      when: () => action === 'add',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Team name is required';
        }
        if (existingConfig?.teams?.some(t => t.name === input)) {
          return 'A team with this name already exists';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'usernames',
      message: '👥 Enter GitLab usernames for this team (comma-separated):',
      when: () => action === 'add',
      filter: (input) => input.split(',').map(name => name.trim()).filter(Boolean),
      validate: (input) => {
        if (!input || input.length === 0) {
          return 'At least one username is required';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'isDefault',
      message: '⭐️ Set this as the default team?',
      default: true,
      when: (answers) => {
        if (action !== 'add') return false;
        // Only ask if there are no teams or if this team isn't already in config
        const teams = existingConfig?.teams || [];
        return teams.length === 0 || !teams.find(t => t.name === answers.teamName);
      }
    },
    {
      type: 'input',
      name: 'concurrentRequests',
      message: '⚡️ Enter maximum concurrent requests (press Enter for default):',
      default: existingConfig?.concurrentRequests || 25,
      when: () => action === 'settings' || !existingConfig,
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

  // Start with existing config or create new one
  const config = {
    ...existingConfig,
    teams: [...(existingConfig?.teams || [])]
  };

  // Update GitLab settings if changed
  if (action === 'settings' || !existingConfig) {
    config.gitlabUrl = answers.gitlabUrl;
    config.concurrentRequests = answers.concurrentRequests;
    if (answers.accessToken) {
      config.accessToken = answers.accessToken;
    }
  }

  // Add new team if requested
  if (action === 'add' && answers.teamName) {
    const newTeam = {
      name: answers.teamName,
      usernames: answers.usernames,
      isDefault: answers.isDefault
    };

    // If this is the new default, remove default from other teams
    if (newTeam.isDefault) {
      config.teams = config.teams.map(team => ({
        ...team,
        isDefault: false
      }));
    }

    config.teams.push(newTeam);
  }

  return config;
}

export async function promptTeamSelection(config) {
  if (!config.teams || config.teams.length === 0) {
    throw new Error('No teams configured. Please run "gitlab-metrics configure" first.');
  }

  // If there's only one team, use it
  if (config.teams.length === 1) {
    return config.teams[0];
  }

  const defaultTeam = config.teams.find(t => t.isDefault);
  
  const questions = [
    {
      type: 'list',
      name: 'teamName',
      message: '👥 Select a team:',
      choices: config.teams.map(team => ({
        name: `${team.name}${team.isDefault ? ' (Default)' : ''}`,
        value: team.name
      })),
      default: defaultTeam?.name
    }
  ];

  const { teamName } = await inquirer.prompt(questions);
  return config.teams.find(t => t.name === teamName);
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
