import nock from "nock";

import { Usagey } from "../client";

describe("CheckoutResource", () => {
  const baseUrl = "https://usagey.test/v1";

  afterEach(() => nock.cleanAll());
  afterAll(() => nock.restore());

  it("creates an idempotent plan checkout", async () => {
    const result = {
      checkoutUrl: "https://provider.test/checkout/123",
      externalId: "provider_123",
      transactionId: "txn_123",
      provider: "STRIPE" as const,
      replayed: false,
    };
    const scope = nock("https://usagey.test")
      .post("/v1/checkout", {
        customerId: "cus_123",
        planId: "plan_growth",
        successUrl: "https://app.test/billing/success",
        cancelUrl: "https://app.test/billing/cancel",
      })
      .matchHeader("Idempotency-Key", "checkout_123")
      .reply(200, result);

    const usagey = new Usagey("usg_test_secret", { baseUrl });
    await expect(
      usagey.checkout.create(
        {
          customerId: "cus_123",
          planId: "plan_growth",
          successUrl: "https://app.test/billing/success",
          cancelUrl: "https://app.test/billing/cancel",
        },
        { idempotencyKey: "checkout_123" },
      ),
    ).resolves.toEqual(result);
    expect(scope.isDone()).toBe(true);
  });

  it("creates a credit-pack checkout with a generated idempotency key", async () => {
    const scope = nock("https://usagey.test")
      .post("/v1/checkout", {
        customerId: "cus_123",
        creditPackId: "pack_123",
        successUrl: "https://app.test/credits/success",
        cancelUrl: "https://app.test/credits/cancel",
      })
      .matchHeader("Idempotency-Key", /^[0-9a-f-]{36}$/)
      .reply(200, {
        checkoutUrl: "https://provider.test/checkout/pack",
        externalId: "provider_pack",
        transactionId: "txn_pack",
        provider: "PAYSTACK",
        replayed: false,
      });

    const usagey = new Usagey("usg_test_secret", { baseUrl });
    await usagey.checkout.create({
      customerId: "cus_123",
      creditPackId: "pack_123",
      successUrl: "https://app.test/credits/success",
      cancelUrl: "https://app.test/credits/cancel",
    });

    expect(scope.isDone()).toBe(true);
  });
});

