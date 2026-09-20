import { randomUUID } from "node:crypto";

import { Usagey } from "usagey";

const apiKey = process.env.USAGEY_API_KEY;

if (!apiKey) {
  throw new Error("Set USAGEY_API_KEY before running this example.");
}

const usagey = new Usagey(apiKey);

async function main() {
  const customer = { externalId: "customer-42" };
  const feature = "api_requests";
  const entitlement = await usagey.check({ ...customer, feature });

  if (entitlement.status !== "access_granted") {
    console.log("Request blocked:", entitlement.status);
    return;
  }

  // Run the billable work first, then meter only successful usage.
  const usage = await usagey.track(
    {
      ...customer,
      feature,
      quantity: 1,
      metadata: { route: "/v1/embeddings" },
    },
    { idempotencyKey: randomUUID() },
  );

  console.log("Usage accepted:", usage);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
