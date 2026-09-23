import nock from 'nock';
import { createHttpClient } from '../http-client';
import {
  UsageyError,
  AuthenticationError,
  RateLimitError,
  ValidationError
} from '../errors';

describe('HTTP Client', () => {
  const API_KEY = 'test_api_key';
  const BASE_URL = 'https://api.usagey.com';
 
  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  it('should set the correct headers', async () => {
    const mockResponse = { success: true };
    const scope = nock(BASE_URL)
      .get('/test')
      .matchHeader('Authorization', `Bearer ${API_KEY}`)
      .matchHeader('Content-Type', 'application/json')
      .matchHeader('User-Agent', /UsageyNodeSDK\/.*/)
      .reply(200, mockResponse);

    const client = createHttpClient(API_KEY, BASE_URL);
    const response = await client.get('/test');
   
    expect(scope.isDone()).toBe(true);
    expect(response.data).toEqual(mockResponse);
  });

  describe('Error Handling', () => {
    it('should throw AuthenticationError on 401', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(401, { message: 'Invalid API key' });

      nock(BASE_URL)
        .get('/test')
        .reply(401, { message: 'Invalid API key' });

      const client = createHttpClient(API_KEY, BASE_URL);
     
      await expect(client.get('/test')).rejects.toThrow(AuthenticationError);
      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Invalid API key',
        code: 'authentication_error'
      });
    });

    it('should throw RateLimitError on 429', async () => {
      const responseData = {
        message: 'Rate limit exceeded',
        retry_after: 60,
        limit: 100,
        remaining: 0
      };

      nock(BASE_URL)
        .get('/test')
        .reply(429, responseData);

      nock(BASE_URL)
        .get('/test')
        .reply(429, responseData);

      const client = createHttpClient(API_KEY, BASE_URL);
     
      await expect(client.get('/test')).rejects.toThrow(RateLimitError);
      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Rate limit exceeded',
        code: 'rate_limit_error',
        retryAfter: 60,
        limit: 100,
        remaining: 0
      });
    });

    it('should throw ValidationError on 422', async () => {
      const responseData = {
        message: 'Validation failed',
        details: {
          field1: ['Error 1', 'Error 2'],
          field2: ['Error 3']
        }
      };

      nock(BASE_URL)
        .get('/test')
        .reply(422, responseData);

      nock(BASE_URL)
        .get('/test')
        .reply(422, responseData);

      const client = createHttpClient(API_KEY, BASE_URL);
     
      await expect(client.get('/test')).rejects.toThrow(ValidationError);
      await expect(client.get('/test')).rejects.toHaveProperty('errors');
    });

    it('should handle 402 payment required error', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(402, { message: 'Payment required' });

      nock(BASE_URL)
        .get('/test')
        .reply(402, { message: 'Payment required' });

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'payment_required'
      });
    });

    it('should handle 403 forbidden error', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(403, { message: 'Forbidden' });

      nock(BASE_URL)
        .get('/test')
        .reply(403, { message: 'Forbidden' });

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'forbidden'
      });
    });

    it('should handle 404 not found error', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(404, { message: 'Not found' });

      nock(BASE_URL)
        .get('/test')
        .reply(404, { message: 'Not found' });

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'not_found'
      });
    });

    it('should handle 409 idempotency conflict error', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(409, { message: 'Idempotency key reused' });

      nock(BASE_URL)
        .get('/test')
        .reply(409, { message: 'Idempotency key reused' });

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'idempotency_conflict',
      });
    });

    it('should handle 503 service unavailable error', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(503, { message: 'Service unavailable' });

      nock(BASE_URL)
        .get('/test')
        .reply(503, { message: 'Service unavailable' });

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'service_unavailable',
      });
    });

    it('should parse numeric rate limit headers', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(429, { message: 'Rate limit exceeded' }, {
          'retry-after': '30',
          'ratelimit-limit': '100',
          'ratelimit-remaining': '0',
        });

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toMatchObject({
        retryAfter: 30,
        limit: 100,
        remaining: 0,
      });
    });

    it('should ignore non-numeric rate limit headers', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(429, { message: 'Rate limit exceeded' }, {
          'retry-after': 'not-a-number',
        });

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toMatchObject({
        retryAfter: undefined,
      });
    });

    it('should handle a non-string, non-object error response', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(400, '42', { 'Content-Type': 'application/json' });

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Unknown error',
      });
    });

    it('should throw UsageyError on other HTTP errors', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(500, { message: 'Internal server error' });

      nock(BASE_URL)
        .get('/test')
        .reply(500, { message: 'Internal server error' });

      const client = createHttpClient(API_KEY, BASE_URL);
     
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Internal server error',
        code: 'http_error_500'
      });
    });

    it('should handle error with string response', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(400, 'Plain text error');

      nock(BASE_URL)
        .get('/test')
        .reply(400, 'Plain text error');

      const client = createHttpClient(API_KEY, BASE_URL);
      
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Plain text error',
        code: 'http_error_400'
      });
    });

    it('should handle error with null response', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(400, undefined);

      nock(BASE_URL)
        .get('/test')
        .reply(400, undefined);

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
    });

    it('should handle error with empty object response', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(400, {});

      nock(BASE_URL)
        .get('/test')
        .reply(400, {});

      const client = createHttpClient(API_KEY, BASE_URL);
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
    });

    it('should throw UsageyError on network errors', async () => {
      nock(BASE_URL)
        .get('/test')
        .replyWithError('Network error');

      nock(BASE_URL)
        .get('/test')
        .replyWithError('Network error');

      const client = createHttpClient(API_KEY, BASE_URL);
     
      await expect(client.get('/test')).rejects.toThrow(UsageyError);
      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Network error',
        code: 'network_error'
      });
    });
  });
});