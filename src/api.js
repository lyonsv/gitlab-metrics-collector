import pLimit from 'p-limit';

export class GitLabAPI {
  constructor(config) {
    this.config = config;
    this.baseUrl = this.normalizeGitLabUrl(config.gitlabUrl);
    this.headers = {
      'PRIVATE-TOKEN': config.accessToken,
      'Content-Type': 'application/json',
    };
    this.requestLimit = pLimit(config.concurrentRequests || 25);
    this.retryLimit = 5;
    this.retryDelay = 1000; // Increased base delay
  }

  normalizeGitLabUrl(url) {
    let baseUrl = url.trim().replace(/\/+$/, '');
    
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Remove any trailing /api/graphql if present
    baseUrl = baseUrl.replace(/\/api\/graphql\/?$/, '');
    
    return baseUrl;
  }

  async testConnection() {
    try {
      const versionUrl = `${this.baseUrl}/api/v4/version`;
      console.log(`Testing GitLab connection to: ${versionUrl}`);
      
      const response = await fetch(versionUrl, {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': this.headers['PRIVATE-TOKEN']
        }
      });

      if (!response.ok) {
        throw new Error(`GitLab API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Successfully connected to GitLab version: ${data.version}`);
      return true;
    } catch (error) {
      console.error('GitLab connection test failed:');
      console.error(`- URL: ${this.baseUrl}`);
      console.error(`- Error: ${error.message}`);
      if (error.cause) {
        console.error(`- Cause: ${error.cause.message}`);
      }
      return false;
    }
  }

  async fetchWithRetry(query, variables, attempt = 1) {
    try {
      // Test connection on first attempt
      if (attempt === 1) {
        const isConnected = await this.testConnection();
        if (!isConnected) {
          throw new Error('Failed to establish connection to GitLab');
        }
      }

      const apiUrl = `${this.baseUrl}/api/graphql`;
      console.log(`[Attempt ${attempt}/${this.retryLimit}] Connecting to: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      if (data.errors) {
        const errorMessages = data.errors.map(e => {
          let message = e.message;
          if (e.locations) {
            message += ` (at line ${e.locations[0]?.line}, column ${e.locations[0]?.column})`;
          }
          if (e.path) {
            message += ` Path: ${e.path.join('.')}`;
          }
          return message;
        }).join('\n');
        throw new Error(`GraphQL Errors:\n${errorMessages}`);
      }

      return data;
    } catch (error) {
      const isRetryable = this.shouldRetry(error);
      const hasRetries = attempt < this.retryLimit;
      
      if (isRetryable && hasRetries) {
        const delay = this.calculateRetryDelay(attempt);
        console.log(`Request failed (${error.message})`);
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(query, variables, attempt + 1);
      }

      // Enhance error message with request details
      const enhancedError = new Error(
        `GitLab API Error (Attempt ${attempt}/${this.retryLimit}):\n` +
        `URL: ${this.baseUrl}/api/graphql\n` +
        `Error: ${error.message}\n` +
        `Variables: ${JSON.stringify(variables, null, 2)}`
      );
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  calculateRetryDelay(attempt) {
    const jitter = Math.random() * 1000; // Add up to 1s of jitter
    return (this.retryDelay * Math.pow(2, attempt - 1)) + jitter;
  }

  shouldRetry(error) {
    // Network-related errors
    if (error instanceof TypeError && (
      error.message.includes('fetch failed') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    )) {
      return true;
    }

    // HTTP errors that should be retried
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    if (error.status && retryableStatuses.includes(error.status)) {
      return true;
    }

    // Common error messages that indicate retry-able conditions
    const retryableMessages = [
      'rate limit',
      'timeout',
      'network error',
      'socket hang up',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED'
    ];

    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
}
