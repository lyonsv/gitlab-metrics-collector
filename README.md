# GitLab Metrics Collector 📊

> High-performance CLI tool for collecting and analyzing merge request metrics from GitLab instances.

[![npm version](https://badge.fury.io/js/gitlab-metrics-collector.svg)](https://www.npmjs.com/package/gitlab-metrics-collector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ⚡️ Parallel processing for high-speed data collection
- 🔄 Smart request batching with automatic retries
- 📊 Monthly merge request statistics in CSV format
- 📈 Interactive HTML visualization with charts
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
# Export to CSV (default)
gitlab-metrics collect -s 2024-01-01 -e 2024-01-31 -o metrics.csv

# Export to interactive HTML visualization
gitlab-metrics collect -s 2024-01-01 -e 2024-01-31 -o metrics.html -f html

After running the above command, open the generated HTML file (e.g., metrics.html) in a modern web browser to view your interactive report. This interactive visualization utilizes Plotly.js to display responsive line charts with dynamic tooltips and toggle options for individual users' metrics.

Demo:
If you'd like to quickly preview the HTML visualization without processing your own data, you can generate a sample report using the above command and immediately open it in your browser, or refer to the sample demo (if provided) in the repository.
```

### Command Options

| Option | Description | Default | Required |
|--------|-------------|---------|----------|
| `-s, --start-date` | Start date (YYYY-MM-DD) | - | Yes |
| `-e, --end-date` | End date (YYYY-MM-DD) | - | Yes |
| `-o, --output` | Output file path | metrics.csv | No |
| `-c, --concurrent` | Concurrent request limit | 25 | No |
| `-f, --format` | Export format (csv or html) | csv | No |

## Export Formats

### CSV Format
- User-based rows
- Monthly columns (e.g., "January 2024")
- Merge request count per user per month

### HTML Format
- Interactive visualization using Plotly.js
- Line charts showing merge request trends
- Ability to toggle individual users
- Hover tooltips with detailed information
- Responsive design for all screen sizes

## Performance Tips

- If you encounter rate limiting, reduce concurrent requests using `-c` (e.g., `-c 15`)
- For large date ranges, consider processing in smaller chunks
- The tool implements automatic retries with exponential backoff

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
