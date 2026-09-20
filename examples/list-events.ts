import { Usagey } from "usagey";

const apiKey = process.env.USAGEY_API_KEY;

if (!apiKey) {
  throw new Error("Set USAGEY_API_KEY before running this example.");
}

const usagey = new Usagey(apiKey);

async function main() {
  let cursor: string | undefined;

  do {
    const page = await usagey.events.list({
      eventType: "USAGE_TRACK",
      take: 50,
      cursor,
    });

    for (const event of page.events) {
      console.log(event.createdAt, event.status, event.message);
    }

    cursor = page.hasMore ? (page.nextCursor ?? undefined) : undefined;
  } while (cursor);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
