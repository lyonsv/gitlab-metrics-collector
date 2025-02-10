# GitLab Metrics Collector 📊

> High-performance CLI tool for collecting and analyzing merge request metrics from GitLab instances.

[![npm version](https://badge.fury.io/js/gitlab-metrics-collector.svg)](https://www.npmjs.com/package/gitlab-metrics-collector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ⚡️ Parallel processing for high-speed data collection
- 🔄 Smart request batching with automatic retries
- 📊 Monthly merge request statistics in CSV format
- ⚙️ Configurable performance settings
- 🛠 Easy setup and configuration

## Installation

### Prerequisites

1. Install Homebrew (package manager for macOS):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Install Node Version Manager (nvm):
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Configure shell
cat << 'EOF' >> ~/.zshrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF

# Reload configuration
source ~/.zshrc

# Install Node.js LTS
nvm install --lts && nvm use --lts
```

3. Install Yarn package manager:
```bash
npm install -g yarn
```

### Package Installation

```bash
# Install globally
yarn global add gitlab-metrics-collector

# Or install locally in your project
yarn add gitlab-metrics-collector
```

## Configuration

Run the configuration wizard:
```bash
gitlab-metrics configure
```

Required information:
- GitLab instance URL (defaults to gitlab.com)
- Personal Access Token (requires `read_api` scope)
- Target usernames (comma-separated list)

## Usage

Collect merge request statistics:
```bash
gitlab-metrics collect -s 2024-01-01 -e 2024-01-31 -o metrics.csv -c 25
```

### Command Options

| Option | Description | Default | Required |
|--------|-------------|---------|----------|
| `-s, --start-date` | Start date (YYYY-MM-DD) | - | Yes |
| `-e, --end-date` | End date (YYYY-MM-DD) | - | Yes |
| `-o, --output` | Output file path | metrics.csv | No |
| `-c, --concurrent` | Concurrent request limit | 25 | No |

## Performance Configuration

### Default Settings
The tool is optimized with these default parameters:
- Concurrent requests: 25
- Users processed in parallel: 10
- Merge requests per API call: 500

### Hardware-Specific Recommendations

| Hardware | Recommended Concurrent Requests | Configuration |
|----------|-------------------------------|---------------|
| M1/M2 MacBook Pro | 50 | `-c 50` |
| MacBook Air | 25 | `-c 25` (default) |
| Older Machines | 15 | `-c 15` |

> **Note**: Performance may be limited by:
> - GitLab instance rate limits
> - Network bandwidth and latency
> - Total number of merge requests

## Output Format

The tool generates a CSV file containing:
- User-based rows
- Monthly columns (e.g., "January 2024")
- Merge request count per user per month

## Development

```bash
# Clone repository
git clone https://github.com/yourusername/gitlab-metrics-collector.git
cd gitlab-metrics-collector

# Install dependencies
yarn install

# Start development
yarn start
```

## Troubleshooting

### Rate Limiting
If you encounter rate limiting:
- Reduce concurrent requests using the `-c` flag
- The tool implements automatic retries with exponential backoff

### Resource Usage
For memory or CPU constraints:
- Reduce parallel user processing
- Process smaller date ranges
- Lower concurrent request limit

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
