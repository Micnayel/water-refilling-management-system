export interface BarDatum {
  label: string;
  value: number;
  title?: string;
}

export function BarChart({
  data,
  formatValue,
  ariaLabel,
  accentClass = "bg-primary",
}: {
  data: BarDatum[];
  formatValue?: (value: number) => string;
  ariaLabel: string;
  accentClass?: string;
}) {
  const max = Math.max(1, ...data.map((datum) => datum.value));
  const total = data.reduce((sum, datum) => sum + datum.value, 0);
  const fmt = formatValue ?? ((value: number) => String(value));

  return (
    <div role="img" aria-label={`${ariaLabel}. Total ${fmt(total)}.`} className="w-full">
      <div className="flex h-32 items-end gap-1 sm:gap-1.5">
        {data.map((datum) => {
          const height = Math.max(2, (datum.value / max) * 100);
          return (
            <div key={datum.label} className="flex flex-1 flex-col items-center justify-end gap-1" title={datum.title ?? `${datum.label}: ${fmt(datum.value)}`}>
              <span className="text-[0.5625rem] tabular-nums text-muted-foreground">{datum.value > 0 ? fmt(datum.value) : ""}</span>
              <span
                className={`w-full max-w-[1.75rem] rounded-t-sm ${accentClass} transition-[height]`}
                style={{ height: `${height}%`, minHeight: "2px" }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1 sm:gap-1.5">
        {data.map((datum) => (
          <span key={datum.label} className="flex-1 truncate text-center text-[0.5625rem] text-muted-foreground">
            {datum.label}
          </span>
        ))}
      </div>
    </div>
  );
}
