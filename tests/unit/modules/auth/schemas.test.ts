import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/modules/auth/schemas";

describe("auth schemas", () => {
  it("requires a login identifier and password", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "staff", password: "secret" }).success).toBe(true);
  });

  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      fullName: "Synthetic Staff",
      email: "staff@example.test",
      username: "staff.one",
      password: "long-enough-password",
      confirmPassword: "long-enough-password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords and mismatched confirmation", () => {
    const short = registerSchema.safeParse({
      fullName: "Synthetic Staff",
      email: "staff@example.test",
      username: "staff",
      password: "short",
      confirmPassword: "short",
    });
    expect(short.success).toBe(false);

    const mismatch = registerSchema.safeParse({
      fullName: "Synthetic Staff",
      email: "staff@example.test",
      username: "staff",
      password: "long-enough-password",
      confirmPassword: "different-password",
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(mismatch.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects invalid usernames and emails", () => {
    const result = registerSchema.safeParse({
      fullName: "Synthetic Staff",
      email: "not-an-email",
      username: "bad name!",
      password: "long-enough-password",
      confirmPassword: "long-enough-password",
    });
    expect(result.success).toBe(false);
  });
});
