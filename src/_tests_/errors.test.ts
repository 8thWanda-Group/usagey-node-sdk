import { 
  UsageyError, 
  AuthenticationError, 
  RateLimitError, 
  ValidationError 
} from '../errors';

describe('Error classes', () => {
  describe('UsageyError', () => {
    it('should create a basic error with default code', () => {
      const error = new UsageyError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('unknown_error');
      expect(error.data).toBeUndefined();
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UsageyError);
    });

    it('should create an error with custom code and data', () => {
      const data = { foo: 'bar' };
      const error = new UsageyError('Test error', 'custom_code', data);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('custom_code');
      expect(error.data).toBe(data);
    });
  });

  describe('AuthenticationError', () => {
    it('should create an authentication error with default message', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Invalid API key or authentication failed');
      expect(error.code).toBe('authentication_error');
      expect(error).toBeInstanceOf(UsageyError);
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('should create an authentication error with custom message', () => {
      const error = new AuthenticationError('Custom auth error');
      expect(error.message).toBe('Custom auth error');
      expect(error.code).toBe('authentication_error');
    });
  });

  describe('RateLimitError', () => {
    it('should create a rate limit error with default message', () => {
      const error = new RateLimitError();
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('rate_limit_error');
      expect(error).toBeInstanceOf(UsageyError);
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should create a rate limit error with rate limit data', () => {
      const data = {
        retry_after: 60,
        limit: 100,
        remaining: 0
      };
      const error = new RateLimitError('Too many requests', data);
      expect(error.message).toBe('Too many requests');
      expect(error.retryAfter).toBe(60);
      expect(error.limit).toBe(100);
      expect(error.remaining).toBe(0);
    });

    it('should prefer explicit details over parsed response data', () => {
      const error = new RateLimitError('Too many requests', undefined, {
        retryAfter: 30,
        limit: 50,
        remaining: 5,
      });
      expect(error.retryAfter).toBe(30);
      expect(error.limit).toBe(50);
      expect(error.remaining).toBe(5);
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with default message', () => {
      const error = new ValidationError();
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('validation_error');
      expect(error).toBeInstanceOf(UsageyError);
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should create a validation error with validation details', () => {
      const data = {
        details: {
          event_type: ['Event type is required'],
          quantity: ['Quantity must be a positive number']
        }
      };
      const error = new ValidationError('Invalid request data', data);
      expect(error.message).toBe('Invalid request data');
      expect(error.errors).toEqual(data.details);
    });
  });
});