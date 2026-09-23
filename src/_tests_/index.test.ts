// src/_tests_/index.test.ts
import * as sdk from '../index';
import { Usagey, UsageyClient } from '../client';
import { CheckoutResource } from '../checkout';
import { EventsResource } from '../events';
import { UsageyError, AuthenticationError, RateLimitError, ValidationError } from '../errors';

describe('SDK Index', () => {
  it('should export Usagey as default', () => {
    expect(sdk.default).toBe(Usagey);
  });

  it('should export all named components', () => {
    expect(sdk.Usagey).toBe(Usagey);
    expect(sdk.UsageyClient).toBe(UsageyClient);
    expect(sdk.CheckoutResource).toBe(CheckoutResource);
    expect(sdk.EventsResource).toBe(EventsResource);
    expect(sdk.UsageyError).toBe(UsageyError);
    expect(sdk.AuthenticationError).toBe(AuthenticationError);
    expect(sdk.RateLimitError).toBe(RateLimitError);
    expect(sdk.ValidationError).toBe(ValidationError);
  });
});