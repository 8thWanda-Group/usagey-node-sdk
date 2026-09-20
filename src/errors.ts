export class UsageyError extends Error {
  readonly code: string;
  readonly statusCode?: number;
  readonly data?: unknown;

  constructor(
    message: string,
    code = "unknown_error",
    data?: unknown,
    statusCode?: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.data = data;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends UsageyError {
  constructor(
    message = "Invalid API key or authentication failed",
    data?: unknown,
  ) {
    super(message, "authentication_error", data, 401);
  }
}

export interface RateLimitDetails {
  retryAfter?: number;
  limit?: number;
  remaining?: number;
}

export class RateLimitError extends UsageyError {
  readonly retryAfter?: number;
  readonly limit?: number;
  readonly remaining?: number;

  constructor(
    message = "Rate limit exceeded",
    data?: unknown,
    details: RateLimitDetails = {},
  ) {
    super(message, "rate_limit_error", data, 429);
    const record = data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : {};
    this.retryAfter = details.retryAfter ?? numberValue(record.retry_after);
    this.limit = details.limit ?? numberValue(record.limit);
    this.remaining = details.remaining ?? numberValue(record.remaining);
  }
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class ValidationError extends UsageyError {
  readonly errors?: unknown;

  constructor(message = "Validation failed", data?: unknown) {
    super(message, "validation_error", data, 400);
    this.errors =
      data && typeof data === "object" && "details" in data
        ? (data as { details: unknown }).details
        : undefined;
  }
}
