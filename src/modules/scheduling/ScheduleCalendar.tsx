import { formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { WEEKDAY_LABELS, type CalendarDay } from "./calendar";
import type { Schedule } from "./schemas";

const STATUS_DOT: Record<string, string> = {
  Scheduled: "bg-primary",
  "Out for delivery": "bg-warning",
  Completed: "bg-success",
  Cancelled: "bg-destructive",
};

export interface ScheduleCalendarProps {
  days: CalendarDay[];
  schedulesByDate: Map<string, Schedule[]>;
  today: string;
  onSelectDay: (iso: string) => void;
}

export function ScheduleCalendar({ days, schedulesByDate, today, onSelectDay }: ScheduleCalendarProps) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-1 py-2 text-center text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const items = schedulesByDate.get(day.iso) ?? [];
          const isToday = day.iso === today;
          return (
            <button
              key={day.iso}
              type="button"
              aria-haspopup="dialog"
              aria-label={`${day.iso}, ${items.length} ${items.length === 1 ? "schedule" : "schedules"}`}
              onClick={() => onSelectDay(day.iso)}
              className={cn(
                "btn-reset relative flex min-h-[4.5rem] flex-col items-stretch gap-1 border-b border-r border-border/50 p-1 text-left align-top transition-colors last:border-r-0 hover:bg-primary/5 focus-visible:z-10 sm:min-h-[6.5rem] sm:p-1.5",
                !day.inMonth && "bg-muted/20 text-muted-foreground/70",
                isToday && "bg-primary/[0.07]",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.day}
              </span>

              {items.length > 0 ? (
                <>
                  <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                    {items.slice(0, 2).map((schedule) => (
                      <span
                        key={schedule.id}
                        className="flex min-w-0 items-center gap-1 rounded bg-muted/60 px-1 py-0.5 text-[0.625rem] leading-tight"
                      >
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            STATUS_DOT[schedule.status] ?? "bg-muted-foreground",
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">
                          {formatTime(schedule.scheduledTime)} · {schedule.customerName}
                        </span>
                      </span>
                    ))}
                    {items.length > 2 ? (
                      <span className="px-1 text-[0.625rem] text-muted-foreground">
                        +{items.length - 2} more
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-semibold text-primary sm:hidden">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                    {items.length}
                  </span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
