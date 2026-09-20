import { randomUUID } from "node:crypto";
import type { AxiosInstance } from "axios";

import { CheckoutResource } from "./checkout";
import { EventsResource } from "./events";
import { UsageyError } from "./errors";
import { createHttpClient } from "./http-client";
import type {
  EntitlementResponse,
  EntitlementStatus,
  TrackOptions,
  TrackUsageRequest,
  TrackUsageResponse,
  UsageRequest,
  UsageyOptions,
} from "./types";

const API_BASE_URLS = {
  production: "https://api.usagey.com/v1",
  sandbox: "https://sandbox.usagey.com/v1",
} as const;

function inferEnvironment(apiKey: string) {
  return apiKey.startsWith("usg_test_") ? "sandbox" : "production";
}

const entitlementStatuses = new Set<EntitlementStatus>([
  "access_granted",
  "limit_exceeded",
  "feature_not_in_plan",
  "no_active_subscription",
  "customer_not_found",
  "feature_not_found",
  "insufficient_credits",
  "account_limit_exceeded",
]);

function isEntitlementResponse(value: unknown): value is EntitlementResponse {
  if (!value || typeof value !== "object") return false;

  const candidate = value as { status?: unknown; quantity?: unknown };
  return (
    typeof candidate.status === "string" &&
    entitlementStatuses.has(candidate.status as EntitlementStatus) &&
    typeof candidate.quantity === "number"
  );
}

function domainResponseFromError(error: unknown) {
  if (error instanceof UsageyError && isEntitlementResponse(error.data)) {
    return error.data;
  }

  throw error;
}

/** Server-side client for Usagey's public entitlement and metering APIs. */
export class Usagey {
  private readonly httpClient: AxiosInstance;
  readonly checkout: CheckoutResource;
  readonly events: EventsResource;

  constructor(apiKey: string, options: UsageyOptions = {}) {
    if (!apiKey.trim()) {
      throw new Error("A Usagey API key is required.");
    }

    this.httpClient = createHttpClient(
      apiKey,
      options.baseUrl || API_BASE_URLS[options.environment ?? inferEnvironment(apiKey)],
      options.timeoutMs,
    );
    this.checkout = new CheckoutResource(this.httpClient);
    this.events = new EventsResource(this.httpClient);
  }

  /** Evaluate an entitlement without recording usage. */
  async check(input: UsageRequest): Promise<EntitlementResponse> {
    try {
      const response = await this.httpClient.post<EntitlementResponse>(
        "usage/check",
        input,
      );
      return response.data;
    } catch (error) {
      return domainResponseFromError(error);
    }
  }

  /** Record accepted usage and apply quota, credit, and overage behavior. */
  async track(
    input: TrackUsageRequest,
    options: TrackOptions = {},
  ): Promise<TrackUsageResponse> {
    try {
      const response = await this.httpClient.post<TrackUsageResponse>(
        "usage/track",
        input,
        {
          headers: {
            "Idempotency-Key": options.idempotencyKey || randomUUID(),
          },
        },
      );
      return response.data;
    } catch (error) {
      const result = domainResponseFromError(error);
      return {
        ...result,
        replayed:
          typeof (result as TrackUsageResponse).replayed === "boolean"
            ? (result as TrackUsageResponse).replayed
            : false,
      };
    }
  }

  /** Alias for track, retained for concise metering integrations. */
  meter(input: TrackUsageRequest, options?: TrackOptions) {
    return this.track(input, options);
  }
}

/** @deprecated Use Usagey instead. */
export class UsageyClient extends Usagey {}
