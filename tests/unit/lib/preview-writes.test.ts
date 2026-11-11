import { describe, expect, it } from "vitest";
import { previewResponse } from "@/lib/preview-data";

interface PreviewCustomer {
  id: string;
  name: string;
  barangay: string;
  areaLatitude: number | null;
  areaLongitude: number | null;
}

describe("preview demo writes", () => {
  it("adds a customer and returns it first in the list", () => {
    const created = previewResponse("/customers", "POST", {
      name: "Test Customer",
      contact: "0917 000 0000",
      email: "test@example.test",
      address: "1 Test St.",
      barangay: "Cubao",
    }) as PreviewCustomer;

    expect(created.name).toBe("Test Customer");
    expect(created.areaLatitude).not.toBeNull();
    expect(created.areaLongitude).not.toBeNull();

    const page = previewResponse("/customers/query", "POST", { pageSize: 100 }) as {
      items: PreviewCustomer[];
    };
    expect(page.items[0]?.id).toBe(created.id);
  });

  it("reveals a preview customer with the generalized area coordinates", () => {
    const created = previewResponse("/customers", "POST", {
      name: "Reveal Me",
      address: "2 Test St.",
      barangay: "Fairview",
    }) as PreviewCustomer;

    const revealed = previewResponse(`/customers/${created.id}/reveal`, "POST", {}) as {
      masked: boolean;
      latitude: number | null;
      longitude: number | null;
    };
    expect(revealed.masked).toBe(false);
    expect(revealed.latitude).not.toBeNull();
    expect(revealed.longitude).not.toBeNull();
  });

  it("adds stock through a movement and never goes negative", () => {
    const item = previewResponse("/inventory", "POST", {
      name: "Demo 5-Gallon",
      sku: "DEMO-5G",
      openingQuantity: 10,
      reorderLevel: 2,
    }) as { id: string; gallonsFull: number; version: number };

    expect(item.gallonsFull).toBe(10);

    const added = previewResponse(`/inventory/${item.id}/movements`, "POST", {
      type: "in",
      quantity: 5,
      reason: "Refilling batch",
      version: item.version,
    }) as { gallonsFull: number; lowStock: boolean };
    expect(added.gallonsFull).toBe(15);
    expect(added.lowStock).toBe(false);

    const emptied = previewResponse(`/inventory/${item.id}/movements`, "POST", {
      type: "out",
      quantity: 999,
      reason: "Impossible request",
      version: 2,
    }) as { gallonsFull: number; lowStock: boolean };
    expect(emptied.gallonsFull).toBe(0);
    expect(emptied.lowStock).toBe(true);
  });
});
