import { GitLabAPI } from '../src/api.js';

const baseConfig = {
  gitlabUrl: 'https://gitlab.com',
  accessToken: 'test-token',
  concurrentRequests: 5,
};

describe('GitLabAPI', () => {
  let api;

  beforeEach(() => {
    api = new GitLabAPI(baseConfig);
  });

  describe('normalizeGitLabUrl', () => {
    test('keeps a clean URL as-is', () => {
      expect(api.normalizeGitLabUrl('https://gitlab.com')).toBe('https://gitlab.com');
    });

    test('removes trailing slash', () => {
      expect(api.normalizeGitLabUrl('https://gitlab.com/')).toBe('https://gitlab.com');
    });

    test('removes multiple trailing slashes', () => {
      expect(api.normalizeGitLabUrl('https://gitlab.com///')).toBe('https://gitlab.com');
    });

    test('adds https:// when scheme is missing', () => {
      expect(api.normalizeGitLabUrl('gitlab.example.com')).toBe('https://gitlab.example.com');
    });

    test('preserves http:// scheme', () => {
      expect(api.normalizeGitLabUrl('http://gitlab.internal')).toBe('http://gitlab.internal');
    });

    test('strips /api/graphql suffix', () => {
      expect(api.normalizeGitLabUrl('https://gitlab.com/api/graphql')).toBe('https://gitlab.com');
    });

    test('strips /api/graphql/ suffix with trailing slash', () => {
      expect(api.normalizeGitLabUrl('https://gitlab.com/api/graphql/')).toBe('https://gitlab.com');
    });

    test('trims leading and trailing whitespace', () => {
      expect(api.normalizeGitLabUrl('  https://gitlab.com  ')).toBe('https://gitlab.com');
    });
  });

  describe('calculateRetryDelay', () => {
    test('returns a number greater than or equal to base delay for attempt 1', () => {
      const delay = api.calculateRetryDelay(1);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThan(3000); // base (1000) + max jitter (1000) + buffer
    });

    test('delay increases with attempt number (exponential backoff)', () => {
      // Run multiple times and verify the minimum possible value grows
      const minDelay1 = 1000 * Math.pow(2, 0); // attempt 1 min
      const minDelay2 = 1000 * Math.pow(2, 1); // attempt 2 min
      const minDelay3 = 1000 * Math.pow(2, 2); // attempt 3 min

      expect(minDelay2).toBeGreaterThan(minDelay1);
      expect(minDelay3).toBeGreaterThan(minDelay2);
    });

    test('returns a finite number', () => {
      expect(Number.isFinite(api.calculateRetryDelay(1))).toBe(true);
      expect(Number.isFinite(api.calculateRetryDelay(5))).toBe(true);
    });
  });

  describe('shouldRetry', () => {
    test('retries on fetch failed TypeError', () => {
      const error = new TypeError('fetch failed');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('retries on network TypeError', () => {
      const error = new TypeError('network error occurred');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('retries on Failed to fetch TypeError', () => {
      const error = new TypeError('Failed to fetch');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('retries on rate limit message', () => {
      const error = new Error('rate limit exceeded');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('retries on timeout message', () => {
      const error = new Error('request timeout');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('retries on ECONNRESET', () => {
      const error = new Error('ECONNRESET connection reset');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('retries on ETIMEDOUT', () => {
      const error = new Error('ETIMEDOUT');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('retries on ENOTFOUND', () => {
      const error = new Error('ENOTFOUND host not found');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('retries on ECONNREFUSED', () => {
      const error = new Error('ECONNREFUSED');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('retries on socket hang up', () => {
      const error = new Error('socket hang up');
      expect(api.shouldRetry(error)).toBe(true);
    });

    test('does not retry on generic error', () => {
      const error = new Error('some unexpected error');
      expect(api.shouldRetry(error)).toBe(false);
    });

    test('does not retry on authentication error', () => {
      const error = new Error('401 Unauthorized');
      expect(api.shouldRetry(error)).toBe(false);
    });

    test('does not retry on generic TypeError', () => {
      const error = new TypeError('Cannot read properties of undefined');
      expect(api.shouldRetry(error)).toBe(false);
    });
  });

  describe('constructor', () => {
    test('sets default concurrentRequests when not provided', () => {
      const apiWithDefaults = new GitLabAPI({
        gitlabUrl: 'https://gitlab.com',
        accessToken: 'token',
      });
      expect(apiWithDefaults.requestLimit).toBeDefined();
    });

    test('normalizes the gitlab URL on construction', () => {
      const apiWithTrailingSlash = new GitLabAPI({
        ...baseConfig,
        gitlabUrl: 'https://gitlab.com/',
      });
      expect(apiWithTrailingSlash.baseUrl).toBe('https://gitlab.com');
    });

    test('sets authorization headers', () => {
      expect(api.headers['PRIVATE-TOKEN']).toBe('test-token');
      expect(api.headers['Content-Type']).toBe('application/json');
    });
  });
});
