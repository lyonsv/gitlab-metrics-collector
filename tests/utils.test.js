import { queries } from '../src/utils.js';

describe('queries', () => {
  describe('getMergeRequests', () => {
    test('is defined', () => {
      expect(queries.getMergeRequests).toBeDefined();
    });

    test('is a string', () => {
      expect(typeof queries.getMergeRequests).toBe('string');
    });

    test('contains the query keyword', () => {
      expect(queries.getMergeRequests).toContain('query');
    });

    test('accepts usernames variable', () => {
      expect(queries.getMergeRequests).toContain('$usernames');
    });

    test('accepts startDate variable', () => {
      expect(queries.getMergeRequests).toContain('$startDate');
    });

    test('accepts endDate variable', () => {
      expect(queries.getMergeRequests).toContain('$endDate');
    });

    test('accepts after cursor variable for pagination', () => {
      expect(queries.getMergeRequests).toContain('$after');
    });

    test('requests mergedAt field', () => {
      expect(queries.getMergeRequests).toContain('mergedAt');
    });

    test('requests author username', () => {
      expect(queries.getMergeRequests).toContain('username');
    });

    test('requests pagination pageInfo', () => {
      expect(queries.getMergeRequests).toContain('pageInfo');
      expect(queries.getMergeRequests).toContain('hasNextPage');
      expect(queries.getMergeRequests).toContain('endCursor');
    });
  });
});
