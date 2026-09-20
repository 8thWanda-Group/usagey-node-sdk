import { randomUUID } from "node:crypto";
import type { AxiosInstance } from "axios";

import type {
  CheckoutOptions,
  CheckoutResponse,
  CreateCheckoutRequest,
} from "./types";

export class CheckoutResource {
  constructor(private readonly httpClient: AxiosInstance) {}

  /** Create a provider checkout for a plan or one-time credit pack. */
  async create(
    input: CreateCheckoutRequest,
    options: CheckoutOptions = {},
  ): Promise<CheckoutResponse> {
    const response = await this.httpClient.post<CheckoutResponse>(
      "checkout",
      input,
      {
        headers: {
          "Idempotency-Key": options.idempotencyKey || randomUUID(),
        },
      },
    );

    return response.data;
  }
}

