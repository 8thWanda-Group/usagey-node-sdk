import type { AxiosInstance } from "axios";

import type {
  DeveloperEventPage,
  ListDeveloperEventsOptions,
} from "./types";

export class EventsResource {
  constructor(private readonly httpClient: AxiosInstance) {}

  /** List newest-first developer events with cursor pagination. */
  async list(
    options: ListDeveloperEventsOptions = {},
  ): Promise<DeveloperEventPage> {
    const response = await this.httpClient.get<DeveloperEventPage>("events", {
      params: options,
    });
    return response.data;
  }
}

