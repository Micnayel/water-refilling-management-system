import { describe, expect, it } from "vitest";
import {
  formatCentavos,
  formatNumber,
  formatPesoInput,
  parsePesoToCentavos,
} from "@/lib/money";

describe("money helpers", () => {
  it("formats centavos as Philippine pesos", () => {
    expect(formatCentavos(123456)).toBe("₱1,234.56");
    expect(formatCentavos(0)).toBe("₱0.00");
  });

  it("falls back to zero for non-finite values", () => {
    expect(formatCentavos(Number.NaN)).toBe("₱0.00");
  });

  it("parses peso input into centavos", () => {
    expect(parsePesoToCentavos("1,234.56")).toBe(123456);
    expect(parsePesoToCentavos("₱20")).toBe(2000);
    expect(parsePesoToCentavos("")).toBe(0);
    expect(parsePesoToCentavos("not a number")).toBe(0);
  });

  it("rounds half cents consistently", () => {
    expect(parsePesoToCentavos("0.005")).toBe(1);
  });

  it("formats editable peso values", () => {
    expect(formatPesoInput(123456)).toBe("1234.56");
    expect(formatPesoInput(Number.NaN)).toBe("0.00");
  });

  it("formats plain numbers", () => {
    expect(formatNumber(12345)).toBe("12,345");
  });
});
