import pLimit from 'p-limit';

export class GitLabAPI {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.gitlabUrl;
    this.headers = {
      'PRIVATE-TOKEN': config.accessToken,
      'Content-Type': 'application/json',
    };
    this.requestLimit = pLimit(config.concurrentRequests || 25);
    this.retryLimit = 5;
    this.retryDelay = 500;
  }

  async fetchWithRetry(query, variables, attempt = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/api/graphql`, {
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
        throw new Error(`GraphQL request failed: ${response.status} - ${responseText}`);
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
      if (attempt < this.retryLimit && this.shouldRetry(error)) {
        const jitter = Math.random() * 200;
        const delay = (this.retryDelay * Math.pow(2, attempt - 1)) + jitter;
        console.log(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`);
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

  shouldRetry(error) {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status) || 
           error.message.includes('rate limit') || 
           error.message.toLowerCase().includes('timeout');
  }
}
