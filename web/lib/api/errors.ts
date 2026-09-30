/**
 * Client-side error handling for BFF responses.
 *
 * The API's global filter (http-exception.filter.ts) always returns:
 *   { statusCode, message, error, timestamp, path }
 * where `message` is a string for HttpException and a string[] for Zod
 * validation failures, formatted as "path: message" per issue.
 */

export type ApiErrorBody = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export class ApiError extends Error {
  readonly status: number;
  /** Field name -> message, parsed out of the Zod issue array. */
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, body: ApiErrorBody | null) {
    const raw = body?.message;
    const single = Array.isArray(raw) ? raw[0] : raw;
    super(single ?? body?.error ?? `Request failed (${status})`);

    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = toFieldErrors(raw);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True when the message is the API's stock-availability rejection. */
  get isStockConflict(): boolean {
    return this.status === 400 && /only \d+ units available/i.test(this.message);
  }
}

/** "items.0.quantity: Must be at least 1" -> { "items.0.quantity": "..." } */
function toFieldErrors(raw: string | string[] | undefined): Record<string, string> {
  if (!Array.isArray(raw)) return {};

  const out: Record<string, string> = {};
  for (const entry of raw) {
    const separator = entry.indexOf(": ");
    if (separator === -1) {
      out._form = entry;
      continue;
    }
    const field = entry.slice(0, separator);
    out[field] = entry.slice(separator + 2);
  }
  return out;
}

/** Unwraps the API error shape from a failed BFF response. */
export async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return new ApiError(response.status, body);
}
