import { beforeEach, describe, expect, it } from "vitest";
import { applyTemplate, DEFAULT_TEMPLATE_ID, isKnownTemplate, SYSTEM_TEMPLATES, templateName } from "@/config/system-templates";

describe("system templates", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it("includes every documented template", () => {
    const ids = SYSTEM_TEMPLATES.map((template) => template.id);
    expect(ids).toEqual(["default", "ocean", "sunrise", "forest", "midnight"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("recognises known templates", () => {
    expect(isKnownTemplate("ocean")).toBe(true);
    expect(isKnownTemplate("unknown")).toBe(false);
  });

  it("applies the selected template to the document", () => {
    applyTemplate("midnight");
    expect(document.documentElement.dataset.theme).toBe("midnight");
  });

  it("falls back to the default template for unknown ids", () => {
    applyTemplate("neon");
    expect(document.documentElement.dataset.theme).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("returns a readable template name", () => {
    expect(templateName("forest")).toBe("Forest Spring");
    expect(templateName("neon")).toBe("Aqua Default");
  });
});
