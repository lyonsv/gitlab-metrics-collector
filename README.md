# GitLab Metrics Collector 📊

> High-performance CLI tool for collecting and analyzing merge request metrics from GitLab instances.

[![npm version](https://badge.fury.io/js/gitlab-metrics-collector.svg)](https://www.npmjs.com/package/gitlab-metrics-collector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ⚡️ Parallel processing for high-speed data collection
- 🔄 Smart request batching with automatic retries
- 📊 Monthly merge request statistics in CSV format
- ⚙️ Configurable performance settings

## Prerequisites

1. Install Node.js (16.0.0 or higher):
   ```bash
   # Using homebrew on macOS
   brew install node

   # Or download from nodejs.org
   # https://nodejs.org/
   ```

2. Install a package manager:
   ```bash
   # Either npm (comes with Node.js)
   npm install -g npm@latest

   # Or yarn
   npm install -g yarn
   ```

## Installation

```bash
# Install globally using npm
npm install -g gitlab-metrics-collector

# OR using yarn
yarn global add gitlab-metrics-collector

# Verify installation
gitlab-metrics --version
```

If you get a "command not found" error after installation:

1. For npm users, make sure global npm binaries are in your PATH:
```bash
# Add this to your ~/.zshrc or ~/.bashrc
export PATH="$PATH:$(npm config get prefix)/bin"
```

2. For yarn users, make sure global yarn binaries are in your PATH:
```bash
# Add this to your ~/.zshrc or ~/.bashrc
export PATH="$PATH:$(yarn global bin)"
```

After adding the PATH, reload your shell:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

## Configuration

Run the configuration wizard:
```bash
gitlab-metrics configure
```

You'll need:
- GitLab instance URL (defaults to gitlab.com)
- Personal Access Token (requires `read_api` scope)
- Target usernames (comma-separated list)

## Usage

Collect merge request statistics:
```bash
gitlab-metrics collect -s 2024-01-01 -e 2024-01-31 -o metrics.csv
```

### Command Options

| Option | Description | Default | Required |
|--------|-------------|---------|----------|
| `-s, --start-date` | Start date (YYYY-MM-DD) | - | Yes |
| `-e, --end-date` | End date (YYYY-MM-DD) | - | Yes |
| `-o, --output` | Output file path | metrics.csv | No |
| `-c, --concurrent` | Concurrent request limit | 25 | No |

## Performance Tips

- If you encounter rate limiting, reduce concurrent requests using `-c` (e.g., `-c 15`)
- For large date ranges, consider processing in smaller chunks
- The tool implements automatic retries with exponential backoff

## Output Format

The tool generates a CSV file containing:
- User-based rows
- Monthly columns (e.g., "January 2024")
- Merge request count per user per month

## Troubleshooting

1. **Command Not Found**
   - Verify PATH settings as described in Installation section
   - Try reinstalling the package
   - Make sure Node.js is properly installed: `node --version`

2. **Rate Limiting**
   - Reduce concurrent requests using `-c 15` or lower
   - Check your GitLab token permissions

3. **Connection Issues**
   - Verify your GitLab URL is correct
   - Ensure your access token is valid
   - Check your network connection

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
