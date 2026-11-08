import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
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
import { apiMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/dates";
import { useAuditList } from "./hooks";
import { AUDIT_EVENT_OPTIONS } from "./service";

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [event, setEvent] = useState("");
  const query = useAuditList(page, pageSize, event);

  return (
    <div className="space-y-3">
      <PageHeader
        title="Audit trail"
        description="Opaque records of sensitive and administrative actions."
      />

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="audit-event" className="text-xs font-medium text-muted-foreground">
            Event
          </label>
          <NativeSelect
            id="audit-event"
            className="w-56"
            value={event}
            onChange={(changeEvent) => {
              setEvent(changeEvent.target.value);
              setPage(1);
            }}
          >
            <option value="">All events</option>
            {AUDIT_EVENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        {query.isLoading ? (
          <div className="p-3">
            <SkeletonRows rows={6} />
          </div>
        ) : query.isError ? (
          <ErrorState
            description={apiMessage(query.error)}
            action={
              <Button variant="outline" onClick={() => void query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : query.items.length === 0 ? (
          <EmptyState
            title="No audit events"
            description="Actions recorded by the server appear here. Adjust the event filter to widen the search."
          />
        ) : (
          <>
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>When</TableHeaderCell>
                    <TableHeaderCell>Event</TableHeaderCell>
                    <TableHeaderCell>Entity</TableHeaderCell>
                    <TableHeaderCell>Entity ID</TableHeaderCell>
                    <TableHeaderCell>Actor ID</TableHeaderCell>
                    <TableHeaderCell>Detail</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{row.event}</span>
                      </TableCell>
                      <TableCell>{row.entityType || "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.entityId || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.actorId || "system"}
                      </TableCell>
                      <TableCell className="max-w-[18rem] truncate text-muted-foreground">
                        {row.detail || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
            <Pagination
              page={page}
              pageSize={pageSize}
              itemCount={query.items.length}
              hasNext={query.hasNext}
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
