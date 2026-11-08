import { expect, test } from "@playwright/test";

test("anonymous visitors see the sign-in screen", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Username or email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("self-registration is reachable and explains approval", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  await expect(
    page.getByText("Self-registered accounts stay inactive until an administrator approves them."),
  ).toBeVisible();
});

test("protected routes redirect anonymous visitors to sign in", async ({ page }) => {
  await page.goto("/customers");
  await expect(page).toHaveURL(/\/login$/);
});

test("unknown routes require a session before showing not found", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page).toHaveURL(/\/login$/);
});
