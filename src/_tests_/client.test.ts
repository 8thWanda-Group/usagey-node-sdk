import nock from "nock";

import { Usagey, UsageyClient } from "../client";
import { AuthenticationError } from "../errors";

describe("Usagey", () => {
  const apiKey = "usg_test_secret";
  const baseUrl = "https://usagey.test";
  let client: Usagey;

  beforeEach(() => {
    nock.cleanAll();
    client = new Usagey(apiKey, { baseUrl });
  });

  afterAll(() => nock.restore());

  it("requires an API key", () => {
    expect(() => new Usagey(" ")).toThrow("A Usagey API key is required.");
  });

  it("keeps UsageyClient as a compatibility alias", () => {
    expect(new UsageyClient(apiKey, { baseUrl })).toBeInstanceOf(Usagey);
  });

  it("checks an entitlement without recording usage", async () => {
    const result = {
      status: "access_granted",
      quantity: 2,
      customerId: "cus_123",
      remaining: 98,
      overage: null,
    };
    nock(baseUrl)
      .post("/usage/check", {
        externalId: "customer-42",
        feature: "api_requests",
        quantity: 2,
      })
      .reply(200, result);

    await expect(
      client.check({
        externalId: "customer-42",
        feature: "api_requests",
        quantity: 2,
      }),
    ).resolves.toEqual(result);
  });

  it("returns expected entitlement denials instead of throwing", async () => {
    const result = {
      status: "feature_not_in_plan",
      quantity: 1,
      customerId: "cus_123",
      overage: null,
    };
    nock(baseUrl).post("/usage/check").reply(400, result);

    await expect(
      client.check({ customerId: "cus_123", feature: "exports" }),
    ).resolves.toEqual(result);
  });

  it("tracks usage with a caller-supplied idempotency key", async () => {
    const result = {
      status: "access_granted",
      quantity: 1,
      customerId: "cus_123",
      replayed: false,
      overage: null,
    };
    const scope = nock(baseUrl)
      .post("/usage/track", {
        customerId: "cus_123",
        feature: "api_requests",
        quantity: 1,
        metadata: { route: "/v1/chat" },
      })
      .matchHeader("Idempotency-Key", "request_123")
      .reply(200, result);

    await expect(
      client.track(
        {
          customerId: "cus_123",
          feature: "api_requests",
          quantity: 1,
          metadata: { route: "/v1/chat" },
        },
        { idempotencyKey: "request_123" },
      ),
    ).resolves.toEqual(result);
    expect(scope.isDone()).toBe(true);
  });

  it("generates an idempotency key when one is not supplied", async () => {
    const scope = nock(baseUrl)
      .post("/usage/track")
      .matchHeader("Idempotency-Key", /^[0-9a-f-]{36}$/)
      .reply(200, {
        status: "access_granted",
        quantity: 1,
        replayed: false,
        overage: null,
      });

    await client.track({ email: "dev@example.com", feature: "seats" });
    expect(scope.isDone()).toBe(true);
  });

  it("uses meter as an alias for track", async () => {
    nock(baseUrl).post("/usage/track").reply(200, {
      status: "access_granted",
      quantity: 1,
      replayed: false,
      overage: null,
    });

    await expect(
      client.meter({ externalId: "customer-42", feature: "tokens" }),
    ).resolves.toMatchObject({ status: "access_granted" });
  });

  it("returns account quota denials with replay state", async () => {
    nock(baseUrl).post("/usage/track").reply(429, {
      status: "account_limit_exceeded",
      quantity: 10,
      replayed: false,
      accountQuota: {
        mode: "enforce",
        plan: "Free",
        limit: 5_000,
        allowance: 0,
        used: 5_000,
        remaining: 0,
        resetAt: "2026-10-01T00:00:00.000Z",
        exceeded: true,
      },
      overage: null,
    });

    await expect(
      client.track({ customerId: "cus_123", feature: "tokens", quantity: 10 }),
    ).resolves.toMatchObject({
      status: "account_limit_exceeded",
      replayed: false,
    });
  });

  it("rethrows errors with no response data", async () => {
    nock(baseUrl).post("/usage/check").replyWithError("Network error");

    await expect(
      client.check({ customerId: "cus_123", feature: "tokens" }),
    ).rejects.toThrow("Network error");
  });

  it("defaults replayed to false when the domain response omits it", async () => {
    nock(baseUrl).post("/usage/track").reply(400, {
      status: "feature_not_in_plan",
      quantity: 1,
      overage: null,
    });

    await expect(
      client.track({ customerId: "cus_123", feature: "tokens" }),
    ).resolves.toMatchObject({ replayed: false });
  });

  it("throws authentication failures", async () => {
    nock(baseUrl).post("/usage/check").reply(401, {
      error: "Invalid billing API key.",
    });

    await expect(
      client.check({ customerId: "cus_123", feature: "tokens" }),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("uses the sandbox API for test keys", async () => {
    const scope = nock("https://sandbox.usagey.com")
      .post("/v1/usage/check")
      .reply(200, { status: "access_granted", quantity: 1 });

    await new Usagey("usg_test_secret").check({
      customerId: "cus_123",
      feature: "tokens",
    });

    expect(scope.isDone()).toBe(true);
  });

  it("uses the production API for live keys", async () => {
    const scope = nock("https://api.usagey.com")
      .post("/v1/usage/check")
      .reply(200, { status: "access_granted", quantity: 1 });

    await new Usagey("usg_live_secret").check({
      customerId: "cus_123",
      feature: "tokens",
    });

    expect(scope.isDone()).toBe(true);
  });

  it("allows an explicit environment override", async () => {
    const scope = nock("https://api.usagey.com")
      .post("/v1/usage/check")
      .reply(200, { status: "access_granted", quantity: 1 });

    await new Usagey("custom-secret", { environment: "production" }).check({
      customerId: "cus_123",
      feature: "tokens",
    });

    expect(scope.isDone()).toBe(true);
  });
});