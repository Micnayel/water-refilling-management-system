import { describe, expect, it } from "vitest";
import { notificationKind, notificationMessage } from "../src/context";

describe("notificationMessage", () => {
  it("renders readable, non-sensitive messages", () => {
    expect(notificationMessage("CUSTOMER_CREATE", "customer")).toBe("Customer created");
    expect(notificationMessage("SCHEDULE_UPDATE", "schedule")).toBe("Order updated");
    expect(notificationMessage("SCHEDULE_UPDATE", "schedule", "Completed")).toBe("Order updated (Completed)");
    expect(notificationMessage("SUBSCRIPTION_CREATE", "subscription")).toBe("Subscription created");
    expect(notificationMessage("SUBSCRIPTION_EXPORT", "subscription")).toBe("Subscription exported");
    expect(notificationMessage("AUTH_LOGIN", "user")).toBe("User signed in");
    expect(notificationMessage("AUTH_LOGIN_FAILED", "user")).toBe("Failed sign-in attempt");
    expect(notificationMessage("AUTH_REGISTER", "user")).toBe("Registration submitted");
    expect(notificationMessage("ACCESS", "customer")).toBe("Customer accessed");
  });

  it("never embeds names, emails, or identifiers", () => {
    const message = notificationMessage("CUSTOMER_UPDATE", "customer", "status active");
    expect(message).not.toMatch(/@/);
    expect(message.length).toBeLessThanOrEqual(255);
  });

  it("derives a kind from the event prefix", () => {
    expect(notificationKind("SCHEDULE_UPDATE")).toBe("schedule");
    expect(notificationKind("SUBSCRIPTION_CREATE")).toBe("subscription");
    expect(notificationKind("AUTH_LOGIN")).toBe("auth");
    expect(notificationKind("ACCESS")).toBe("access");
  });
});
