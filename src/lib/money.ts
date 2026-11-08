export function formatCentavos(centavos: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format((Number.isFinite(centavos) ? centavos : 0) / 100);
}

export function parsePesoToCentavos(input: string): number {
  const cleaned = input.replace(/[^\d.-]/g, "");
  if (!cleaned) return 0;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function formatPesoInput(centavos: number): string {
  if (!Number.isFinite(centavos)) return "0.00";
  return (centavos / 100).toFixed(2);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(value);
}
