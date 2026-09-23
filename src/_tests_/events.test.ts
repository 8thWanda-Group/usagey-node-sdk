import nock from "nock";

import { Usagey } from "../client";

describe("EventsResource", () => {
  const baseUrl = "https://usagey.test/v1";

  afterEach(() => nock.cleanAll());
  afterAll(() => nock.restore());

  it("lists filtered developer events", async () => {
    const page = {
      events: [
        {
          id: "event_1",
          billingWorkspaceId: "ws_1",
          featureId: null,
          customerId: "cus_1",
          apiKeyId: "key_1",
          eventType: "USAGE_TRACK",
          status: "SUCCESS",
          message: "Tracked usage",
          idempotencyKey: "request_1",
          source: "worker",
          metadata: { quantity: 1 },
          createdAt: "2026-09-20T12:00:00.000Z",
        },
      ],
      hasMore: true,
      nextCursor: "event_1",
    };
    const scope = nock("https://usagey.test")
      .get("/v1/events")
      .query({
        take: "25",
        eventType: "USAGE_TRACK",
        status: "SUCCESS",
        search: "worker",
      })
      .reply(200, page);

    const usagey = new Usagey("usg_test_secret", { baseUrl });
    await expect(
      usagey.events.list({
        take: 25,
        eventType: "USAGE_TRACK",
        status: "SUCCESS",
        search: "worker",
      }),
    ).resolves.toEqual(page);
    expect(scope.isDone()).toBe(true);
  });

  it("lists events with no options", async () => {
    const scope = nock("https://usagey.test")
      .get("/v1/events")
      .reply(200, { events: [], hasMore: false, nextCursor: null });

    const usagey = new Usagey("usg_test_secret", { baseUrl });
    await usagey.events.list();

    expect(scope.isDone()).toBe(true);
  });

  it("requests the next cursor page", async () => {
    const scope = nock("https://usagey.test")
      .get("/v1/events")
      .query({ cursor: "event_1" })
      .reply(200, { events: [], hasMore: false, nextCursor: null });

    const usagey = new Usagey("usg_test_secret", { baseUrl });
    await usagey.events.list({ cursor: "event_1" });

    expect(scope.isDone()).toBe(true);
  });
});