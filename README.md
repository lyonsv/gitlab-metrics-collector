# GitLab Metrics Collector 📊

> High-performance CLI tool for collecting and analyzing merge request metrics from GitLab instances.

[![npm version](https://badge.fury.io/js/gitlab-metrics-collector.svg)](https://www.npmjs.com/package/gitlab-metrics-collector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ⚡️ Parallel processing for high-speed data collection
- 🔄 Smart request batching with automatic retries
- 📊 Monthly merge request statistics in CSV format
- 📈 Interactive HTML visualization with charts
- 💬 Interactive prompts for easy configuration
- ⚙️ Configurable performance settings

## HTML Demo 

You can view a demo of the output by opening the [demo.html](https://github.com/lyonsv/gitlab-metrics-collector/blob/main/demo.html) file.

![image](https://github.com/user-attachments/assets/d97fd958-d314-4c89-bd6a-61e2bf7d58fc)


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
   yarn global add yarn
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

First, run the configuration wizard:
```bash
gitlab-metrics configure
```

You'll be prompted for:
- GitLab instance URL (defaults to gitlab.com)
- Personal Access Token (requires `read_api` scope)
- Target usernames (comma-separated list)
- Maximum concurrent requests (optional, defaults to 25)

## Usage

### Collecting Metrics

You can collect metrics either by providing command-line options or through interactive prompts:

#### Using Command-Line Options
```bash
# Full command with all options
gitlab-metrics collect -s 2024-01-01 -e 2024-01-31 -o metrics.csv -f csv

# Minimal command (will prompt for missing options)
gitlab-metrics collect
```

### Command Options

| Option | Description | Default | Required | Interactive Prompt |
|--------|-------------|---------|----------|-------------------|
| `-s, --start-date` | Start date (YYYY-MM-DD) | - | Yes | Yes, if not provided |
| `-e, --end-date` | End date (YYYY-MM-DD) | - | Yes | Yes, if not provided |
| `-o, --output` | Output file path | metrics.csv | No | No |
| `-c, --concurrent` | Concurrent request limit | 25 | No | No |
| `-f, --format` | Export format (csv or html) | csv | No | Yes, if not provided |

### Export Formats

#### CSV Format
- User-based rows
- Monthly columns (e.g., "January 2024")
- Merge request count per user per month

#### HTML Format
The HTML format provides an interactive visualization that includes:
- Line charts showing merge request trends
- Toggle controls for individual users
- Performance analysis with top/low performer bands
- Responsive design for all screen sizes
- Detailed tooltips with monthly statistics

Example commands for different formats:
```bash
# Export to CSV (default)
gitlab-metrics collect -s 2024-01-01 -e 2024-01-31 -o metrics.csv

# Export to interactive HTML visualization
gitlab-metrics collect -s 2024-01-01 -e 2024-01-31 -o report.html -f html
```

## Performance Tips

- If you encounter rate limiting:
  - Reduce concurrent requests: `gitlab-metrics collect -c 15`
  - Process data in smaller date ranges
- The tool implements automatic retries with exponential backoff
- For large teams, consider running during off-peak hours

## Troubleshooting

1. **Command Not Found**
   - Verify PATH settings as described in Installation section
   - Try reinstalling the package
   - Make sure Node.js is properly installed: `node --version`

2. **Rate Limiting**
   - Reduce concurrent requests using `-c 15` or lower
   - Check your GitLab token permissions
   - Verify your token has the `read_api` scope

3. **Connection Issues**
   - Verify your GitLab URL is correct
   - Ensure your access token is valid
   - Check your network connection

4. **Date Format Errors**
   - Ensure dates are in YYYY-MM-DD format
   - Start date must be before end date
   - Dates must be valid calendar dates

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
