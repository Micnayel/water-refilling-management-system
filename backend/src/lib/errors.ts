import type { ZodType } from "zod";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errors = {
  unauthenticated: () => new ApiError(401, "unauthenticated", "Sign in to continue."),
  forbidden: () => new ApiError(403, "forbidden", "You do not have permission to do that."),
  notFound: () => new ApiError(404, "not_found", "The requested record was not found."),
  conflict: (message = "The record changed. Reload and try again.") =>
    new ApiError(409, "conflict", message),
  invalid: (message = "The request was not valid.") => new ApiError(400, "invalid_request", message),
};

export function parseBody<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw errors.invalid("Check the submitted values and try again.");
  }
  return result.data;
}

export function parseQuery<T>(schema: ZodType<T>, value: unknown): T {
  return parseBody(schema, value);
}
