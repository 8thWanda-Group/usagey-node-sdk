import axios, { type AxiosError, type AxiosInstance } from "axios";

import {
  AuthenticationError,
  RateLimitError,
  UsageyError,
  ValidationError,
} from "./errors";

function responseMessage(data: unknown) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "Unknown error";

  const record = data as { message?: unknown; error?: unknown };
  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  return "Unknown error";
}

function numericHeader(value: unknown) {
  const normalized = Array.isArray(value) ? value[0] : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function createHttpClient(
  apiKey: string,
  baseUrl: string,
  timeoutMs = 10_000,
): AxiosInstance {
  const client = axios.create({
    baseURL: `${baseUrl.replace(/\/+$/, "")}/`,
    timeout: timeoutMs,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "UsageyNodeSDK/0.2.0",
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (!error.response) {
        throw new UsageyError("Network error", "network_error", undefined);
      }

      const { status, data, headers } = error.response;
      const message = responseMessage(data);

      if (status === 401) {
        throw new AuthenticationError(message, data);
      }

      if (
        (status === 400 || status === 422) &&
        data &&
        typeof data === "object" &&
        "details" in data
      ) {
        throw new ValidationError(message, data);
      }

      if (status === 429) {
        throw new RateLimitError(message, data, {
          retryAfter: numericHeader(headers["retry-after"]),
          limit: numericHeader(headers["ratelimit-limit"]),
          remaining: numericHeader(headers["ratelimit-remaining"]),
        });
      }

      const code =
        status === 409
          ? "idempotency_conflict"
          : status === 402
            ? "payment_required"
            : status === 403
              ? "forbidden"
              : status === 404
                ? "not_found"
          : status === 503
            ? "service_unavailable"
            : `http_error_${status}`;
      throw new UsageyError(message, code, data, status);
    },
  );

  return client;
}
