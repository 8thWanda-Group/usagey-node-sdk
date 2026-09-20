export interface UsageyOptions {
  /** Selects the canonical API host. Inferred from usg_test_ and usg_live_ keys. */
  environment?: "sandbox" | "production";
  /** Override the versioned API root, for example http://localhost:3000/v1. */
  baseUrl?: string;
  /** @default 10000 */
  timeoutMs?: number;
}

export type CustomerSelector =
  | { customerId: string; externalId?: never; email?: never }
  | { customerId?: never; externalId: string; email?: never }
  | { customerId?: never; externalId?: never; email: string };

export type UsageRequest = CustomerSelector & {
  feature: string;
  quantity?: number;
  source?: string;
};

export type TrackUsageRequest = UsageRequest & {
  metadata?: Record<string, unknown>;
};

export interface TrackOptions {
  /** Reuse the same key when retrying the same event. */
  idempotencyKey?: string;
}

export type CreateCheckoutRequest = {
  customerId: string;
  providerConnectionId?: string;
  successUrl: string;
  cancelUrl: string;
} & (
  | { planId: string; creditPackId?: never }
  | { planId?: never; creditPackId: string }
);

export interface CheckoutOptions {
  /** Reuse the same key when retrying the same checkout creation. */
  idempotencyKey?: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  externalId: string;
  transactionId: string;
  provider: "PAYPAL" | "STRIPE" | "PAYSTACK";
  replayed: boolean;
}

export type DeveloperEventType =
  | "USAGE_TRACK"
  | "USAGE_CHECK"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_CANCELLED"
  | "CREDIT_PURCHASED"
  | "CHECKOUT_CREATED"
  | "WEBHOOK_RECEIVED"
  | "WEBHOOK_PROCESSED"
  | "REFUND_CREATED"
  | "ENTITLEMENT_DENIED"
  | "CUSTOMER_EXPORTED"
  | "CUSTOMER_DATA_DELETED"
  | "RETENTION_CLEANUP";

export type DeveloperEventStatus = "SUCCESS" | "ERROR" | "PENDING";

export interface DeveloperEvent {
  id: string;
  billingWorkspaceId: string;
  featureId: string | null;
  customerId: string | null;
  apiKeyId: string | null;
  eventType: DeveloperEventType;
  status: DeveloperEventStatus;
  message: string | null;
  idempotencyKey: string | null;
  source: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface ListDeveloperEventsOptions {
  take?: number;
  cursor?: string;
  eventType?: DeveloperEventType;
  status?: DeveloperEventStatus;
  search?: string;
}

export interface DeveloperEventPage {
  events: DeveloperEvent[];
  hasMore: boolean;
  nextCursor: string | null;
}

export type EntitlementStatus =
  | "access_granted"
  | "limit_exceeded"
  | "feature_not_in_plan"
  | "no_active_subscription"
  | "customer_not_found"
  | "feature_not_found"
  | "insufficient_credits"
  | "account_limit_exceeded";

export interface AccountQuota {
  mode: "shadow" | "enforce";
  plan: string;
  limit: number | null;
  allowance: number;
  used: number;
  remaining: number | null;
  resetAt: string;
  exceeded: boolean;
}

export interface OverageDecision {
  policy: string;
  quantity: number;
  incrementalQuantity?: number | null;
  estimatedCharge?: number | null;
  currency?: string | null;
  ratingModel?: string | null;
}

export interface EntitlementResponse {
  status: EntitlementStatus;
  quantity: number;
  customerId?: string;
  featureId?: string;
  subscriptionId?: string;
  currentUsage?: number;
  limit?: number | null;
  remaining?: number | null;
  creditsRemaining?: number | null;
  accountQuota?: AccountQuota;
  overage?: OverageDecision | null;
}

export interface TrackUsageResponse extends EntitlementResponse {
  replayed: boolean;
}
