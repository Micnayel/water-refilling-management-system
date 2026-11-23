import { MapPinIcon, NavigationIcon, TruckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { StatusPill } from "./ui";
import type { Delivery } from "../types";

const steps: Delivery["status"][] = ["Assigned", "Preparing", "Out for delivery", "Delivered"];

export function TrackingPanel({ delivery }: { delivery: Delivery | undefined }) {
  if (!delivery) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <TruckIcon className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">No active delivery to track</p>
        <p className="text-xs text-muted-foreground">Place an order and a route will appear here once it is assigned.</p>
      </div>
    );
  }

  const failed = delivery.status === "Failed delivery";
  const activeIndex = steps.indexOf(delivery.status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusPill status={delivery.status} />
          <span className="text-xs text-muted-foreground">
            {delivery.ref} · {delivery.jugs} gallons
          </span>
        </div>
        <span className="text-xs font-semibold text-primary">
          {delivery.etaMinutes > 0 ? `${delivery.etaMinutes} min away` : "Route finished"}
        </span>
      </div>

      <div className="ws-map" style={{ height: 230 }}>
        <div className="ws-map-grid" aria-hidden="true" />
        <svg viewBox="0 0 400 230" className="relative h-full w-full" role="img" aria-label={`Simulated route to ${delivery.area}`}>
          <path className="ws-map-water" d="M-10 180 C 60 150, 120 205, 190 175 S 330 140, 420 168" />
          <path className="ws-map-road" d="M30 190 L 110 150 L 180 160 L 250 100 L 320 70" />
          <path className="ws-map-road" d="M60 40 L 120 110 L 180 160 L 250 190" />
          <path className="ws-map-road" d="M250 100 L 300 145 L 380 130" />
          <path
            className="ws-map-route"
            d="M46 188 C 90 172, 100 156, 140 154 S 196 168, 214 128 S 262 92, 316 78"
          />
          <g>
            <circle cx="46" cy="188" r="9" className="ws-map-pin" />
            <text x="46" y="208" textAnchor="middle" className="ws-map-label">
              Depot
            </text>
          </g>
          <g>
            <circle cx="316" cy="78" r="9" className="ws-map-pin-aqua" />
            <text x="316" y="64" textAnchor="middle" className="ws-map-label">
              {delivery.area}
            </text>
          </g>
          <g>
            <circle cx="214" cy="128" r="7" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="3" />
            <circle cx="214" cy="128" r="15" fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="2" />
          </g>
          <text x="214" y="110" textAnchor="middle" className="ws-map-label">
            Rider
          </text>
        </svg>
        <span className="ws-map-badge">
          <MapPinIcon className="size-3" />
          Simulated route preview — not live GPS
        </span>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
          <NavigationIcon className="mt-0.5 size-4 text-primary" />
          <div className="min-w-0">
            <p className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">Destination</p>
            <p className="truncate text-sm font-medium">{delivery.address}</p>
            <p className="text-xs text-muted-foreground">
              {delivery.area} · {delivery.distanceKm.toFixed(1)} km from depot
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
          <TruckIcon className="mt-0.5 size-4 text-primary" />
          <div>
            <p className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">Rider</p>
            <p className="text-sm font-medium">{delivery.rider}</p>
            <p className="text-xs text-muted-foreground">{delivery.window}</p>
          </div>
        </div>
      </div>

      <ol className="flex flex-wrap items-center gap-1.5" aria-label="Delivery progress">
        {steps.map((step, index) => {
          const done = !failed && index <= activeIndex;
          const isCurrent = index === activeIndex;
          return (
            <li key={step} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "ws-chip",
                  done && "is-on",
                  isCurrent && "font-semibold",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {done ? "✓" : index + 1} {step}
              </span>
              {index < steps.length - 1 ? <span className="text-xs text-muted-foreground">→</span> : null}
            </li>
          );
        })}
      </ol>
      {failed ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          The rider could not complete this delivery. Support will contact you to reschedule.
        </p>
      ) : null}

      <details className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
        <summary className="cursor-pointer font-medium">Route as text</summary>
        <ul className="mt-1.5 space-y-1 text-muted-foreground">
          <li>Start: Refilling station depot, 6:00 AM loading bay.</li>
          <li>
            Stop {delivery.sequence}: {delivery.area} — {delivery.window}, {delivery.jugs} gallons.
          </li>
          <li>Status: {delivery.status}. Estimated driving distance {delivery.distanceKm.toFixed(1)} km.</li>
          <li>Coordinates are not shown in this preview.</li>
        </ul>
      </details>
    </div>
  );
}
