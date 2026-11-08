import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import {
  loginResponseSchema,
  sessionResponseSchema,
  type SessionResponse,
} from "@/types/session";
import type { LoginValues, RegisterValues } from "./schemas";

export async function fetchSession(): Promise<SessionResponse | null> {
  try {
    return await apiRequest("/auth/session", { schema: sessionResponseSchema });
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
      return null;
    }
    throw error;
  }
}

export async function login(values: LoginValues): Promise<SessionResponse> {
  return apiRequest("/auth/login", {
    method: "POST",
    body: values,
    schema: loginResponseSchema,
  });
}

export async function register(values: RegisterValues): Promise<{ message: string }> {
  return apiRequest("/auth/register", {
    method: "POST",
    body: {
      fullName: values.fullName,
      email: values.email,
      username: values.username,
      password: values.password,
      turnstileToken: values.turnstileToken,
    },
    schema: z.object({ message: z.string() }),
  });
}

export async function logout(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST", body: {} });
}

export async function fetchTurnstileKey(): Promise<string | null> {
  try {
    const result = await apiRequest("/auth/turnstile", {
      schema: z.object({ siteKey: z.string() }),
    });
    return result.siteKey || null;
  } catch {
    return null;
  }
}
