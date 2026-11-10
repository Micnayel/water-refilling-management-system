import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toaster";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/ui/icons";
import { apiMessage } from "@/lib/api-client";
import { todayIso } from "@/lib/dates";
import { downloadFile } from "@/lib/download";
import { usePermission } from "@/hooks/use-permission";
import {
  buildMonthGrid,
  formatDayLabel,
  formatMonthLabel,
  monthRange,
  shiftMonth,
} from "./calendar";
import { useScheduleCalendar } from "./hooks";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { ScheduleDayDialog } from "./ScheduleDayDialog";
import { SCHEDULE_STATUSES, type Schedule } from "./schemas";

function groupByDate(items: Schedule[]): Map<string, Schedule[]> {
  const groups = new Map<string, Schedule[]>();
  for (const schedule of items) {
    const list = groups.get(schedule.scheduledDate) ?? [];
    list.push(schedule);
    groups.set(schedule.scheduledDate, list);
  }
  for (const list of groups.values()) {
    list.sort((left, right) => left.scheduledTime.localeCompare(right.scheduledTime));
  }
  return groups;
}

export function ScheduleListPage() {
  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [status, setStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const canAdd = usePermission("scheduling:add");
  const canExport = usePermission("scheduling:export");

  const days = useMemo(() => buildMonthGrid(month.year, month.month), [month]);
  const range = useMemo(() => monthRange(month.year, month.month), [month]);
  const query = useScheduleCalendar(range.from, range.to, status);
  const schedulesByDate = useMemo(() => groupByDate(query.data?.items ?? []), [query.data]);
  const today = todayIso();
  const total = query.data?.items.length ?? 0;
  const selectedSchedules = selectedDate ? schedulesByDate.get(selectedDate) ?? [] : [];

  const changeMonth = (delta: number) =>
    setMonth((current) => shiftMonth(current.year, current.month, delta));

  const goToToday = () => {
    const date = new Date();
    setMonth({ year: date.getFullYear(), month: date.getMonth() });
    setSelectedDate(todayIso());
  };

  const exportCsv = async () => {
    try {
      await downloadFile("/schedules/export");
      toast("Schedule export downloaded.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Scheduling"
        description="Refill and delivery schedules in a month view. Select a date to see every schedule for that day."
        actions={
          <>
            {canExport ? (
              <Button variant="outline" onClick={() => void exportCsv()}>
                Export
              </Button>
            ) : null}
            {canAdd ? (
              <Button onClick={() => navigate("/scheduling/new")}>
                <PlusIcon /> New schedule
              </Button>
            ) : null}
          </>
        }
      />

      <div className="toolbar-surface flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => changeMonth(-1)}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => changeMonth(1)}>
            <ChevronRightIcon />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{formatMonthLabel(month.year, month.month)}</h2>
          <p className="text-xs text-muted-foreground">
            {query.isLoading ? "Loading schedules…" : `${total} ${total === 1 ? "schedule" : "schedules"} in view`}
          </p>
        </div>

        <div className="ml-auto flex items-end gap-2">
          <div className="w-40">
            <label htmlFor="schedule-status" className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <NativeSelect
              id="schedule-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {SCHEDULE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      {query.isError ? (
        <div className="card-surface">
          <ErrorState
            description={apiMessage(query.error)}
            action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>}
          />
        </div>
      ) : query.isLoading ? (
        <div className="card-surface p-3">
          <Skeleton className="h-[28rem] w-full" />
        </div>
      ) : (
        <>
          <ScheduleCalendar
            days={days}
            schedulesByDate={schedulesByDate}
            today={today}
            onSelectDay={setSelectedDate}
          />
          {total === 0 ? (
            <div className="card-surface">
              <EmptyState
                title="No schedules in this view"
                description="Choose another month or status, or create a refill or delivery schedule."
                action={
                  canAdd ? (
                    <Button onClick={() => navigate("/scheduling/new")}>
                      <PlusIcon /> New schedule
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : null}
        </>
      )}

      <ScheduleDayDialog
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}
        dateLabel={selectedDate ? formatDayLabel(selectedDate) : ""}
        schedules={selectedSchedules}
        canAdd={canAdd}
        onCreate={() => {
          setSelectedDate(null);
          navigate("/scheduling/new");
        }}
      />
    </div>
  );
}
