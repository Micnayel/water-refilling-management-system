import { useId, type ComponentType, type ReactNode, type SVGProps } from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangleIcon,
  CheckIcon,
  ClipboardIcon,
  InfoIcon,
  PackageIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { NotificationKind } from "../types";

const statusTone: Record<string, "primary" | "success" | "warning" | "danger" | "muted"> = {
  active: "success",
  paused: "warning",
  pending: "warning",
  confirmed: "primary",
  preparing: "primary",
  "out for delivery": "warning",
  completed: "success",
  cancelled: "muted",
  "failed delivery": "danger",
  assigned: "primary",
  delivered: "success",
  approved: "success",
  "on duty": "success",
  "off duty": "muted",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const tone = statusTone[status.toLowerCase()] ?? "muted";
  return <span className={cn("ws-status", `tone-${tone}`, className)}>{status}</span>;
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow ? <p className="ws-eyebrow">{eyebrow}</p> : null}
        <h1 className="ws-title">{title}</h1>
        {subtitle ? <p className="ws-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("ws-card", className)}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 px-4 py-3">
          <div>
            <h2 className="ws-section-title">{title}</h2>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "aqua",
  hint,
  trend,
  spark,
}: {
  label: string;
  value: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "aqua" | "primary" | "success" | "warning";
  hint?: string;
  trend?: string;
  spark?: number[];
}) {
  return (
    <article className="ws-stat">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="ws-stat-label">{label}</p>
          <p className="ws-stat-value mt-1">{value}</p>
        </div>
        <span className={cn("ws-stat-icon", tone !== "aqua" && `is-${tone}`)}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-[0.6875rem] text-muted-foreground">{hint}</span>
        {trend ? <span className="ws-trend">{trend}</span> : null}
      </div>
      {spark ? (
        <div className="ws-spark mt-2" aria-hidden="true">
          {spark.map((value, index) => (
            <span key={index} style={{ height: `${Math.max(8, value)}%` }} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-xs">
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-warning" />
      <p>{children}</p>
    </div>
  );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ws-info-row">
      <span className="ws-info-label">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export function RolesBadge({ role }: { role: "customer" | "admin" | "rider" }) {
  const label = role === "customer" ? "Customer portal" : role === "admin" ? "Administrator" : "Delivery personnel";
  return <span className="ws-role-chip">{label}</span>;
}

const notificationIcon: Record<NotificationKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  order: ClipboardIcon,
  delivery: TruckIcon,
  billing: WalletIcon,
  account: UsersIcon,
  stock: PackageIcon,
};

export function NotificationIcon({ kind }: { kind: NotificationKind }) {
  const Icon = notificationIcon[kind] ?? InfoIcon;
  return (
    <span className="ws-notice-icon">
      <Icon className="size-4" />
    </span>
  );
}

type Point = { label: string; value: number };

export function BarChart({
  points,
  format = (value) => String(value),
  height = 160,
  label = "Bar chart",
}: {
  points: Point[];
  format?: (value: number) => string;
  height?: number;
  label?: string;
}) {
  const gradientId = useId();
  const width = 340;
  const pad = { top: 10, right: 6, bottom: 22, left: 6 };
  const max = Math.max(...points.map((point) => point.value), 1);
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const slot = plotWidth / Math.max(points.length, 1);
  const barWidth = Math.min(30, slot * 0.55);

  return (
    <svg className="ws-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(188 85% 55%)" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((fraction) => {
        const y = pad.top + plotHeight * fraction;
        return <line key={fraction} x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="ws-chart-grid" />;
      })}
      {points.map((point, index) => {
        const barHeight = Math.max(2, (point.value / max) * plotHeight);
        const x = pad.left + slot * index + (slot - barWidth) / 2;
        const y = pad.top + plotHeight - barHeight;
        return (
          <g key={point.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={`url(#${gradientId})`}
              className="ws-chart-bar"
            >
              <title>{`${point.label}: ${format(point.value)}`}</title>
            </rect>
            <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" className="ws-chart-label">
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({
  points,
  format = (value) => String(value),
  height = 160,
  label = "Trend chart",
}: {
  points: Point[];
  format?: (value: number) => string;
  height?: number;
  label?: string;
}) {
  const width = 340;
  const pad = { top: 12, right: 8, bottom: 22, left: 8 };
  const max = Math.max(...points.map((point) => point.value), 1);
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
  const coordinates = points.map((point, index) => ({
    x: pad.left + step * index,
    y: pad.top + plotHeight - (point.value / max) * plotHeight,
    point,
  }));
  const line = coordinates.map((row) => `${row.x},${row.y}`).join(" ");
  const area = `${pad.left},${pad.top + plotHeight} ${line} ${pad.left + plotWidth},${pad.top + plotHeight}`;

  return (
    <svg className="ws-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {[0, 0.5, 1].map((fraction) => {
        const y = pad.top + plotHeight * fraction;
        return <line key={fraction} x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="ws-chart-grid" />;
      })}
      <polygon points={area} className="ws-chart-area" />
      <polyline points={line} className="ws-chart-line" />
      {coordinates.map((row) => (
        <g key={row.point.label}>
          <circle cx={row.x} cy={row.y} r={3.5} className="ws-chart-dot">
            <title>{`${row.point.label}: ${format(row.point.value)}`}</title>
          </circle>
          <text x={row.x} y={height - 6} textAnchor="middle" className="ws-chart-label">
            {row.point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Donut({
  value,
  total,
  caption,
  centerLabel,
}: {
  value: number;
  total: number;
  caption: string;
  centerLabel: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <div className="flex items-center gap-3">
      <svg width="108" height="108" viewBox="0 0 108 108" role="img" aria-label={`${centerLabel}: ${caption}`}>
        <circle cx="54" cy="54" r={radius} fill="none" strokeWidth="10" className="ws-donut-track" />
        <circle
          cx="54"
          cy="54"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          transform="rotate(-90 54 54)"
          className="ws-donut-value"
        />
        <text x="54" y="50" textAnchor="middle" className="text-sm font-bold" fill="hsl(var(--foreground))">
          {centerLabel}
        </text>
        <text x="54" y="66" textAnchor="middle" className="ws-chart-label">
          {`${Math.round(ratio * 100)}%`}
        </text>
      </svg>
      <div className="text-xs text-muted-foreground">{caption}</div>
    </div>
  );
}

export function TrendBadge({ value }: { value: string }) {
  return (
    <Badge tone="success" className="gap-1">
      <CheckIcon className="size-3" />
      {value}
    </Badge>
  );
}

export function QuietHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <AlertTriangleIcon className="size-3.5 shrink-0" />
      {children}
    </div>
  );
}
