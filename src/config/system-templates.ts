export interface SystemTemplate {
  id: string;
  name: string;
  description: string;
}

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    id: "default",
    name: "Vision Glass",
    description: "Deep navy glass surfaces with a green-to-teal brand gradient.",
  },
  {
    id: "aqua",
    name: "Aqua Light",
    description: "Cool blues with a bright, neutral workspace.",
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    description: "Teal accents with a calm, water-inspired palette.",
  },
  {
    id: "sunrise",
    name: "Warm Sunrise",
    description: "Amber accents on a soft warm background.",
  },
  {
    id: "forest",
    name: "Forest Spring",
    description: "Green accents for a natural, low-glare workspace.",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "A dark template for low-light environments.",
  },
];

export const DEFAULT_TEMPLATE_ID = "default";

export function isKnownTemplate(id: string): boolean {
  return SYSTEM_TEMPLATES.some((template) => template.id === id);
}

export function applyTemplate(id: string): void {
  if (typeof document === "undefined") return;
  const template = isKnownTemplate(id) ? id : DEFAULT_TEMPLATE_ID;
  document.documentElement.dataset.theme = template;
  // Keep Bootstrap component internals (carets, shadows, light-dark tokens) in
  // sync with the template without hardcoding colors in any component.
  document.documentElement.dataset.bsTheme =
    template === "midnight" || template === "default" ? "dark" : "light";
}

export function templateName(id: string): string {
  return SYSTEM_TEMPLATES.find((template) => template.id === id)?.name ?? "Vision Glass";
}
