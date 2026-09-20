import { randomUUID } from "node:crypto";

import { Usagey } from "usagey";

const apiKey = process.env.USAGEY_API_KEY;
const customerId = process.env.USAGEY_CUSTOMER_ID;
const creditPackId = process.env.USAGEY_CREDIT_PACK_ID;

if (!apiKey || !customerId || !creditPackId) {
  throw new Error(
    "Set USAGEY_API_KEY, USAGEY_CUSTOMER_ID, and USAGEY_CREDIT_PACK_ID.",
  );
}

const usagey = new Usagey(apiKey);
const checkoutCustomerId = customerId;
const checkoutCreditPackId = creditPackId;

async function main() {
  const checkout = await usagey.checkout.create(
    {
      customerId: checkoutCustomerId,
      creditPackId: checkoutCreditPackId,
      successUrl: "https://app.example.com/billing/success",
      cancelUrl: "https://app.example.com/billing/cancel",
    },
    { idempotencyKey: randomUUID() },
  );

  console.log("Open checkout:", checkout.checkoutUrl);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
