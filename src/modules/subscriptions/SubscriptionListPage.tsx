import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { PlusIcon } from "@/components/ui/icons";
import { apiMessage } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useSetSubscriptionStatus, useSubscriptionList } from "./hooks";
import { FREQUENCY_LABELS, SUBSCRIPTION_STATUSES, type Subscription } from "./schemas";

export function SubscriptionListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const query = useSubscriptionList(page, pageSize, status, search);
  const setStatusMutation = useSetSubscriptionStatus();
  const canAdd = usePermission("scheduling:add");
  const canEdit = usePermission("scheduling:edit");
  const canExport = usePermission("scheduling:export");
  const toast = useToast();
  const navigate = useNavigate();

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const changeStatus = async (sub: Subscription, next: string) => {
    try {
      await setStatusMutation.mutateAsync({ id: sub.id, status: next, version: sub.version });
      toast(`Subscription ${next.toLowerCase()}.`, "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  const exportCsv = async () => {
    try {
      await downloadFile("/subscriptions/export");
      toast("Subscription export downloaded.", "success");
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Subscription management"
        description="Recurring refill plans for customers. Pause, resume, or cancel plans."
        actions={
          <div className="flex flex-wrap gap-2">
            {canExport ? (
              <Button variant="outline" onClick={() => void exportCsv()}>
                Export
              </Button>
            ) : null}
            {canAdd ? (
              <Button onClick={() => navigate("/subscriptions/new")}>
                <PlusIcon /> New subscription
              </Button>
            ) : null}
          </div>
        }
      />

      <form className="toolbar-surface flex flex-wrap items-end gap-2" onSubmit={onSearch} role="search">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="sub-search" className="text-xs font-medium text-muted-foreground">
            Search customer
          </label>
          <Input
            id="sub-search"
            placeholder="Customer name"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="w-44">
          <label htmlFor="sub-filter" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <NativeSelect
            id="sub-filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {SUBSCRIPTION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

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
            title="No subscriptions found"
            description="Create a subscription or adjust the filters."
          />
        ) : (
          <>
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Customer</TableHeaderCell>
                    <TableHeaderCell>Plan</TableHeaderCell>
                    <TableHeaderCell>Frequency</TableHeaderCell>
                    <TableHeaderCell className="text-right">Gallons</TableHeaderCell>
                    <TableHeaderCell className="text-right">Price</TableHeaderCell>
                    <TableHeaderCell>Next billing</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.data?.items.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.customerName}
                        <span className="block text-xs text-muted-foreground">{sub.customerCode}</span>
                      </TableCell>
                      <TableCell>{sub.planName}</TableCell>
                      <TableCell>{FREQUENCY_LABELS[sub.frequency as keyof typeof FREQUENCY_LABELS] ?? sub.frequency}</TableCell>
                      <TableCell className="text-right">{sub.gallonsPerDelivery}</TableCell>
                      <TableCell className="text-right">{formatCentavos(sub.priceCentavos)}</TableCell>
                      <TableCell>{sub.nextBillingDate ? formatDateNumeric(sub.nextBillingDate) : "—"}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone(sub.status)}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/subscriptions/${sub.id}`)}>
                            View
                          </Button>
                          {canEdit && sub.status !== "Cancelled" ? (
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/subscriptions/${sub.id}/edit`)}>
                              Edit
                            </Button>
                          ) : null}
                          {canEdit && sub.status === "Active" ? (
                            <Button variant="ghost" size="sm" onClick={() => void changeStatus(sub, "Paused")}>
                              Pause
                            </Button>
                          ) : null}
                          {canEdit && sub.status === "Paused" ? (
                            <Button variant="ghost" size="sm" onClick={() => void changeStatus(sub, "Active")}>
                              Resume
                            </Button>
                          ) : null}
                          {canEdit && sub.status !== "Cancelled" ? (
                            <Button variant="ghost" size="sm" onClick={() => void changeStatus(sub, "Cancelled")}>
                              Cancel
                            </Button>
                          ) : null}
                        </div>
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
