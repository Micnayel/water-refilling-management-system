import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InfoRow, StatusPill, QuietHint } from "./ui";
import { formatCentavos } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Delivery, Order } from "../types";

function Timeline({ entries }: { entries: Order["timeline"] }) {
  if (entries.length === 0) return <QuietHint>No activity recorded yet.</QuietHint>;
  return (
    <ol className="ws-timeline">
      {[...entries].reverse().map((entry, index) => (
        <li key={`${entry.status}-${entry.at}-${index}`} className={cn("ws-timeline-item", index > 0 && "is-done")}>
          <p className="text-xs font-semibold">{entry.status}</p>
          <p className="text-[0.6875rem] text-muted-foreground">{formatDateTime(entry.at)}</p>
          {entry.note ? <p className="mt-0.5 text-xs">{entry.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  onCancel,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: (order: Order) => void;
}) {
  if (!order) return null;
  const cancellable = order.status === "Pending" || order.status === "Confirmed";
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Order ${order.ref}`}
      description={`${order.jugs} gallons · ${formatCentavos(order.amountCentavos)}`}
      size="wide"
      footer={
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onCancel && cancellable ? (
            <Button
              variant="destructive"
              onClick={() => {
                onCancel(order);
                onOpenChange(false);
              }}
            >
              Cancel order
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusPill status={order.status} />
            <span className="text-xs text-muted-foreground">Placed {formatDateTime(order.placedAt)}</span>
          </div>
          <InfoRow label="Scheduled">{`${order.scheduledDate} · ${order.scheduledWindow}`}</InfoRow>
          <InfoRow label="Customer">{order.customerName}</InfoRow>
          <InfoRow label="Address">{order.address}</InfoRow>
          <InfoRow label="Payment">{order.payment}</InfoRow>
          <InfoRow label="Rider">{order.riderName}</InfoRow>
          {order.notes ? <InfoRow label="Notes">{order.notes}</InfoRow> : null}
          {order.status === "Cancelled" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Cancelled orders release their reserved stock. No charge applies.
            </p>
          ) : null}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</p>
          <Timeline entries={order.timeline} />
        </div>
      </div>
    </Dialog>
  );
}

export function DeliveryDetailDialog({
  delivery,
  open,
  onOpenChange,
  onAdvance,
  onRevealContact,
}: {
  delivery: Delivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvance?: (delivery: Delivery, status: Delivery["status"]) => void;
  onRevealContact?: (delivery: Delivery) => void;
}) {
  if (!delivery) return null;
  const next: Partial<Record<Delivery["status"], { label: string; status: Delivery["status"] }>> = {
    Assigned: { label: "Start preparing", status: "Preparing" },
    Preparing: { label: "Mark out for delivery", status: "Out for delivery" },
    "Out for delivery": { label: "Confirm delivery", status: "Delivered" },
  };
  const action = next[delivery.status];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${delivery.ref} · ${delivery.customerName}`}
      description={`${delivery.jugs} gallons · ${formatCentavos(delivery.amountCentavos)} · ${delivery.window}`}
      size="wide"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex flex-wrap gap-2">
            {onRevealContact ? (
              <Button variant="outline" onClick={() => onRevealContact(delivery)}>
                Customer contact
              </Button>
            ) : null}
            {onAdvance && action ? (
              <Button onClick={() => onAdvance(delivery, action.status)}>{action.label}</Button>
            ) : null}
            {onAdvance && delivery.status === "Out for delivery" ? (
              <Button
                variant="outline"
                onClick={() => onAdvance(delivery, "Failed delivery")}
              >
                Mark failed
              </Button>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusPill status={delivery.status} />
            <span className="text-xs text-muted-foreground">Stop {delivery.sequence}</span>
          </div>
          <InfoRow label="Address">{delivery.address}</InfoRow>
          <InfoRow label="Area">{delivery.area}</InfoRow>
          <InfoRow label="Window">{delivery.window}</InfoRow>
          <InfoRow label="Distance">{delivery.distanceKm.toFixed(1)} km</InfoRow>
          <InfoRow label="ETA">{delivery.etaMinutes > 0 ? `${delivery.etaMinutes} min` : "Completed"}</InfoRow>
          <InfoRow label="Rider">{delivery.rider}</InfoRow>
          {delivery.note ? <InfoRow label="Note">{delivery.note}</InfoRow> : null}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</p>
          <Timeline entries={delivery.timeline} />
        </div>
      </div>
    </Dialog>
  );
}

export function ContactDialog({
  open,
  onOpenChange,
  name,
  contact,
  address,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  contact: string;
  address: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const masked = contact.replace(/\d(?=\d{2})/g, "•");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setRevealed(false);
        setCopied(false);
        onOpenChange(next);
      }}
      title={`Contact ${name}`}
      description="Contact details stay masked until you choose to reveal them."
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRevealed((value) => !value)}>
              {revealed ? "Hide number" : "Reveal number"}
            </Button>
            <Button onClick={() => void copy()} disabled={!revealed}>
              {copied ? "Copied" : "Copy number"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        <InfoRow label="Customer">{name}</InfoRow>
        <InfoRow label="Mobile">
          <span className={cn("font-mono text-sm", !revealed && "text-muted-foreground")}>{revealed ? contact : masked}</span>
        </InfoRow>
        <InfoRow label="Address">{address}</InfoRow>
        <p className="pt-1 text-[0.6875rem] text-muted-foreground">
          This preview uses synthetic contact details. Revealing is a local interaction and is not audited.
        </p>
      </div>
    </Dialog>
  );
}
