import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { formatDateNumeric, formatTime } from "@/lib/dates";
import { formatCentavos, formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useScheduleList } from "./hooks";
import { SCHEDULE_STATUSES } from "./schemas";

export function ScheduleListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const query = useScheduleList(page, pageSize, status, date);
  const navigate = useNavigate();
  const toast = useToast();
  const canAdd = usePermission("scheduling:add");
  const canExport = usePermission("scheduling:export");

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
        description="Refill and delivery schedules. Completing one posts the stock movement and sale together."
        actions={
          <>
            {canExport ? (
              <Button variant="outline" onClick={() => void exportCsv()}>
                Export
              </Button>
            ) : null}
            {canAdd ? <Button onClick={() => navigate("/scheduling/new")}>New schedule</Button> : null}
          </>
        }
      />

      <div className="toolbar-surface flex flex-wrap items-end gap-2">
        <div className="w-40">
          <label htmlFor="schedule-status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <NativeSelect
            id="schedule-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {SCHEDULE_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="w-40">
          <label htmlFor="schedule-date" className="text-xs font-medium text-muted-foreground">
            Date
          </label>
          <DatePicker
            id="schedule-date"
            value={date}
            onChange={(value) => {
              setDate(value);
              setPage(1);
            }}
          />
        </div>
        {date ? (
          <Button variant="outline" onClick={() => setDate("")}>
            Clear date
          </Button>
        ) : null}
      </div>

      <div className="card-surface overflow-hidden">
        {query.isLoading ? (
          <div className="p-3">
            <SkeletonRows rows={6} />
          </div>
        ) : query.isError ? (
          <ErrorState
            description={apiMessage(query.error)}
            action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>}
          />
        ) : query.data && query.data.items.length === 0 ? (
          <EmptyState
            title="No schedules found"
            description="Adjust the filters, or create a schedule."
            action={canAdd ? <Button onClick={() => navigate("/scheduling/new")}>New schedule</Button> : undefined}
          />
        ) : (
          <>
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Time</TableHeaderCell>
                    <TableHeaderCell>Customer</TableHeaderCell>
                    <TableHeaderCell>Assigned</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell className="text-right">Gallons</TableHeaderCell>
                    <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.data?.items.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="whitespace-nowrap">{formatDateNumeric(schedule.scheduledDate)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatTime(schedule.scheduledTime)}</TableCell>
                      <TableCell>
                        <span className="font-medium">{schedule.customerName}</span>
                        <span className="block text-xs text-muted-foreground">{schedule.customerCode}</span>
                      </TableCell>
                      <TableCell>{schedule.assignedUserName}</TableCell>
                      <TableCell className="capitalize">{schedule.type}</TableCell>
                      <TableCell className="text-right">{formatNumber(schedule.gallons)}</TableCell>
                      <TableCell className="text-right">{formatCentavos(schedule.amountCentavos)}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone(schedule.status)}>{schedule.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/scheduling/${schedule.id}`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
            <Pagination
              page={page}
              pageSize={pageSize}
              itemCount={query.data?.items.length ?? 0}
              hasNext={Boolean(query.data?.nextCursor)}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
