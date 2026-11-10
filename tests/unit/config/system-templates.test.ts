import { beforeEach, describe, expect, it } from "vitest";
import { applyTemplate, DEFAULT_TEMPLATE_ID, isKnownTemplate, SYSTEM_TEMPLATES, templateName } from "@/config/system-templates";

describe("system templates", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it("includes every documented template", () => {
    const ids = SYSTEM_TEMPLATES.map((template) => template.id);
    expect(ids).toEqual(["default", "aqua", "ocean", "sunrise", "forest", "midnight"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("recognises known templates", () => {
    expect(isKnownTemplate("ocean")).toBe(true);
    expect(isKnownTemplate("unknown")).toBe(false);
  });

  it("applies the selected template to the document", () => {
    applyTemplate("midnight");
    expect(document.documentElement.dataset.theme).toBe("midnight");
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
  });

  it("uses the dark Vision palette as the default", () => {
    applyTemplate("default");
    expect(document.documentElement.dataset.theme).toBe("default");
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
    expect(DEFAULT_TEMPLATE_ID).toBe("default");
  });

  it("keeps the light template on a light Bootstrap scheme", () => {
    applyTemplate("aqua");
    expect(document.documentElement.dataset.bsTheme).toBe("light");
  });

  it("falls back to the default template for unknown ids", () => {
    applyTemplate("neon");
    expect(document.documentElement.dataset.theme).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("returns a readable template name", () => {
    expect(templateName("forest")).toBe("Forest Spring");
    expect(templateName("neon")).toBe("Vision Glass");
  });
});
