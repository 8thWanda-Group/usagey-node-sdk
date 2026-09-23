# Official Usagey Node.js SDK

[![Test](https://github.com/8thWanda-Group/usagey-node-sdk/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/8thWanda-Group/usagey-node-sdk/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/%40usagey%2Fsdk.svg)](https://www.npmjs.com/package/@usagey/sdk)
[![codecov](https://codecov.io/gh/8thWanda-Group/usagey-node-sdk/branch/main/graph/badge.svg)](https://codecov.io/gh/8thWanda-Group/usagey-node-sdk)

The official server-side TypeScript SDK for Usagey entitlement checks and usage metering.

## Install

```bash
npm install @usagey/sdk
```

Node.js 20 or newer is required. Keep Usagey secret keys on your server.

## Quick start

```ts
import { Usagey } from "@usagey/sdk";

const usagey = new Usagey(process.env.USAGEY_API_KEY!);

const entitlement = await usagey.check({
  externalId: "customer-42",
  feature: "api_requests",
});

if (entitlement.status === "access_granted") {
  // Run the billable operation, then record successful usage.
  await usagey.track(
    {
      externalId: "customer-42",
      feature: "api_requests",
      quantity: 1,
      metadata: { route: "/v1/embeddings" },
    },
    { idempotencyKey: "request_01JEXAMPLE" },
  );
}
```

Use exactly one customer selector in each request: `customerId`, `externalId`, or `email`.

## Check without consuming usage

```ts
const result = await usagey.check({
  email: "customer@example.com",
  feature: "exports",
  quantity: 1,
});

if (result.status !== "access_granted") {
  console.log(result.status, result.remaining);
}
```

## Track usage

```ts
const result = await usagey.track(
  {
    customerId: "cus_123",
    feature: "ai_tokens",
    quantity: 800,
    source: "generation-worker",
  },
  { idempotencyKey: "generation_job_456" },
);
```

`meter` is an alias for `track`:

```ts
await usagey.meter({
  externalId: "customer-42",
  feature: "api_requests",
});
```

When no idempotency key is supplied, the SDK generates one for that request. Supply and reuse your own key when your application may retry the same operation.

## Create a checkout

Create a hosted checkout for either a plan or a one-time credit pack:

```ts
const checkout = await usagey.checkout.create(
  {
    customerId: "cus_123",
    creditPackId: "pack_credits_10k",
    successUrl: "https://app.example.com/billing/success",
    cancelUrl: "https://app.example.com/billing/cancel",
  },
  { idempotencyKey: "credit-order-456" },
);

console.log(checkout.checkoutUrl);
```

Replace `creditPackId` with `planId` to create a subscription checkout. The
customer, checkout target, provider connection, and API key must belong to the
same Usagey environment.

## Read developer events

```ts
const page = await usagey.events.list({
  eventType: "WEBHOOK_PROCESSED",
  status: "ERROR",
  take: 50,
});

if (page.hasMore && page.nextCursor) {
  await usagey.events.list({ cursor: page.nextCursor });
}
```

Event history is newest-first and scoped to the workspace represented by the API
key. A cursor from another organization or environment is rejected.

## Entitlement statuses

Expected business decisions are returned as typed results rather than thrown exceptions:

- `access_granted`
- `limit_exceeded`
- `feature_not_in_plan`
- `no_active_subscription`
- `customer_not_found`
- `feature_not_found`
- `insufficient_credits`
- `account_limit_exceeded`

Authentication, validation, network, service availability, and infrastructure rate-limit failures throw typed SDK errors.

```ts
import {
  AuthenticationError,
  RateLimitError,
  UsageyError,
  ValidationError,
} from "@usagey/sdk";
```

## Configuration

```ts
const usagey = new Usagey(process.env.USAGEY_API_KEY!, {
  environment: "sandbox",
  timeoutMs: 5_000,
});
```

`usg_test_` keys use `https://sandbox.usagey.com/v1` and `usg_live_` keys use
`https://api.usagey.com/v1` automatically. For local development, override the
versioned API root with `baseUrl: "http://localhost:3000/v1"`.

## Migrating from 0.1

- Replace `trackEvent(eventType, quantity, metadata)` with `track` or `meter` and include a customer selector plus `feature`.
- Replace legacy `/api/usage` assumptions with `check` and `track`.
- Manage API keys in **Developer > API keys**. Raw secrets are revealed once and are not available through this SDK.
- `UsageyClient` remains as a deprecated class alias, but obsolete API-key-management and usage-stat methods were removed.

## Migrating from `usagey` to `@usagey/sdk`

This package was previously published as `usagey`. The API is unchanged — only
the package name moved:

```bash
npm uninstall usagey
npm install @usagey/sdk
```

```diff
- import { Usagey } from "usagey";
+ import { Usagey } from "@usagey/sdk";
```

See [docs.usagey.com](https://docs.usagey.com) for API contracts and integration guidance.

## Runnable examples

The published package includes type-checked examples that use only the public SDK API:

- [`examples/check-and-track.ts`](examples/check-and-track.ts)
- [`examples/create-checkout.ts`](examples/create-checkout.ts)
- [`examples/list-events.ts`](examples/list-events.ts)

Set `USAGEY_API_KEY` to a sandbox key before running an example. The checkout
example also requires `USAGEY_CUSTOMER_ID` and `USAGEY_CREDIT_PACK_ID` from the
same sandbox workspace.

## License

MIT