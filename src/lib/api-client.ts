import type { ZodType } from "zod";
import { isPreviewMode } from "@/lib/preview";
import { previewResponse } from "@/lib/preview-data";

const API_BASE = "/api/v1";

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface RequestOptions<T> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  schema?: ZodType<T>;
  signal?: AbortSignal;
}

function isNotFound(path: string): boolean {
  return path === "/auth/session";
}

export async function apiRequest<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const method = options.method ?? (options.body === undefined ? "GET" : "POST");

  if (isPreviewMode()) {
    const preview = previewResponse(path, method, options.body);
    if (preview !== undefined) {
      return options.schema ? options.schema.parse(preview) : (preview as T);
    }
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "network_error", "Cannot reach the server. Check your connection.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !isNotFound(path)) {
      window.dispatchEvent(new CustomEvent("wrms:session-expired"));
    }
    const errorBody = payload as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      response.status,
      errorBody?.error?.code ?? "request_failed",
      errorBody?.error?.message ?? "The request could not be completed.",
    );
  }

  if (options.schema) {
    return options.schema.parse(payload);
  }
  return payload as T;
}

export function apiMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Try again.";
}
