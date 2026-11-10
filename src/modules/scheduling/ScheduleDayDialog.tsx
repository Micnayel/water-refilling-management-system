import { Link } from "react-router-dom";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ArrowRightIcon, CalendarIcon, PlusIcon } from "@/components/ui/icons";
import { formatTime } from "@/lib/dates";
import { formatCentavos, formatNumber } from "@/lib/money";
import type { Schedule } from "./schemas";

export interface ScheduleDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string;
  schedules: Schedule[];
  canAdd: boolean;
  onCreate: () => void;
}

export function ScheduleDayDialog({
  open,
  onOpenChange,
  dateLabel,
  schedules,
  canAdd,
  onCreate,
}: ScheduleDayDialogProps) {
  const countLabel = `${schedules.length} ${schedules.length === 1 ? "schedule" : "schedules"}`;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={dateLabel}
      description={countLabel}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canAdd ? (
            <Button onClick={onCreate}>
              <PlusIcon /> New schedule
            </Button>
          ) : null}
        </>
      }
    >
      {schedules.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="icon-tile icon-tile--2">
            <CalendarIcon className="size-4" />
          </span>
          <p className="text-sm font-medium">No schedules on this date</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Pick another day, or create a refill or delivery schedule for this date.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {schedules.map((schedule) => (
            <li
              key={schedule.id}
              className="rounded-xl border border-border/70 bg-muted/20 p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{schedule.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {schedule.customerCode} · {formatTime(schedule.scheduledTime)} · {schedule.assignedUserName}
                  </p>
                </div>
                <Badge tone={statusTone(schedule.status)} className="shrink-0">
                  {schedule.status}
                </Badge>
              </div>

              <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Type</dt>
                  <dd className="mt-0.5 font-medium capitalize">{schedule.type}</dd>
                </div>
                <div>
                  <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Gallons</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">{formatNumber(schedule.gallons)}</dd>
                </div>
                <div>
                  <dt className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Amount</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">{formatCentavos(schedule.amountCentavos)}</dd>
                </div>
              </dl>

              {schedule.notes ? (
                <p className="mt-2 rounded-md bg-background/40 px-2 py-1 text-xs text-muted-foreground">
                  {schedule.notes}
                </p>
              ) : null}

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">
                  {schedule.recurrence}
                </span>
                <Link
                  to={`/scheduling/${schedule.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Open schedule <ArrowRightIcon className="size-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
