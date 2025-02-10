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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GraphQL request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors.map(e => e.message).join(', '));
      }

      return data;
    } catch (error) {
      if (attempt < this.retryLimit && this.shouldRetry(error)) {
        const jitter = Math.random() * 200;
        const delay = (this.retryDelay * Math.pow(2, attempt - 1)) + jitter;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(query, variables, attempt + 1);
      }
      throw error;
    }
  }

  shouldRetry(error) {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status) || 
           error.message.includes('rate limit') || 
           error.message.toLowerCase().includes('timeout');
  }
}
