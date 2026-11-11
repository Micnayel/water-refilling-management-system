import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { MaskedValue } from "@/components/privacy/masked-value";
import { BaseMap } from "@/components/maps";
import { useToast } from "@/components/ui/toaster";
import { apiMessage } from "@/lib/api-client";
import { formatDateNumeric } from "@/lib/dates";
import { formatNumber } from "@/lib/money";
import { usePermission } from "@/hooks/use-permission";
import { useCustomer, useCustomerStatus, useRevealCustomer } from "./hooks";

const REMASK_MS = 45_000;

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useCustomer(id);
  const reveal = useRevealCustomer(id ?? "");
  const setStatus = useCustomerStatus(id ?? "");
  const toast = useToast();
  const canReveal = usePermission("customers:reveal");
  const canEdit = usePermission("customers:edit");
  const canDelete = usePermission("customers:delete");
  const [confirmOpen, setConfirmOpen] = useState<false | "archive" | "restore">(false);
  const autoRevealed = useRef(false);

  // Opening a record is the "View" action: show the full details and exact
  // location once for permitted users. The API audits the reveal and the value
  // remasks automatically after the timer below.
  useEffect(() => {
    if (autoRevealed.current || !canReveal) return;
    if (!query.data || query.data.status === "archived") return;
    autoRevealed.current = true;
    reveal.mutate();
  }, [canReveal, query.data, reveal]);

  useEffect(() => {
    if (!reveal.data) return;
    const timer = window.setTimeout(() => reveal.reset(), REMASK_MS);
    return () => window.clearTimeout(timer);
  }, [reveal]);

  if (query.isLoading) {
    return (
      <div className="p-3">
        <SkeletonRows rows={6} />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState description={apiMessage(query.error)} />;
  }

  const customer = query.data;
  const revealed = reveal.data;
  const isArchived = customer.status === "archived";

  const changeStatus = async () => {
    if (!confirmOpen) return;
    try {
      await setStatus.mutateAsync(confirmOpen);
      toast(confirmOpen === "archive" ? "Customer archived." : "Customer restored.", "success");
      setConfirmOpen(false);
    } catch (error) {
      toast(apiMessage(error), "error");
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={revealed ? revealed.name : customer.name}
        description={`${customer.code} · added ${formatDateNumeric(customer.createdAt)}`}
        actions={
          <>
            <Link to="/customers" className={buttonVariants({ variant: "outline" })}>
              Back
            </Link>
            {canEdit && !isArchived ? (
              <Link to={`/customers/${customer.id}/edit`} className={buttonVariants({ variant: "outline" })}>
                Edit
              </Link>
            ) : null}
            {canDelete ? (
              <Button variant={isArchived ? "default" : "destructive"} onClick={() => setConfirmOpen(isArchived ? "restore" : "archive")}>
                {isArchived ? "Restore" : "Archive"}
              </Button>
            ) : null}
          </>
        }
      />

      {reveal.isError ? <Alert tone="destructive">{apiMessage(reveal.error)}</Alert> : null}
      {revealed ? (
        <Alert tone="warning">Sensitive fields are revealed for this session and re-mask automatically.</Alert>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Customer details</CardTitle>
            <Badge tone={statusTone(customer.status)}>{customer.status}</Badge>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd>
                  <MaskedValue
                    value={revealed ? revealed.name : customer.name}
                    revealed={Boolean(revealed)}
                    canReveal={canReveal && !isArchived}
                    onReveal={() => reveal.mutate()}
                    onHide={() => reveal.reset()}
                    revealLabel="Reveal customer name"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Contact</dt>
                <dd>
                  <MaskedValue
                    value={revealed ? revealed.contact || "—" : customer.contact || "—"}
                    revealed={Boolean(revealed)}
                    canReveal={canReveal && !isArchived}
                    onReveal={() => reveal.mutate()}
                    onHide={() => reveal.reset()}
                    revealLabel="Reveal customer contact"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd>
                  <MaskedValue
                    value={revealed ? revealed.email || "—" : customer.email || "—"}
                    revealed={Boolean(revealed)}
                    canReveal={canReveal && !isArchived}
                    onReveal={() => reveal.mutate()}
                    onHide={() => reveal.reset()}
                    revealLabel="Reveal customer email"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Barangay</dt>
                <dd>{customer.barangay || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd>
                  <MaskedValue
                    value={revealed ? revealed.address : customer.address}
                    revealed={Boolean(revealed)}
                    canReveal={canReveal && !isArchived}
                    onReveal={() => reveal.mutate()}
                    onHide={() => reveal.reset()}
                    revealLabel="Reveal customer address"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Gallons on hand</dt>
                <dd>{formatNumber(customer.gallonsOnHand)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Version</dt>
                <dd>{customer.version}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {revealed && revealed.latitude !== null && revealed.longitude !== null ? (
              <>
                <BaseMap
                  points={[
                    {
                      label: revealed.name,
                      latitude: revealed.latitude,
                      longitude: revealed.longitude,
                      count: 1,
                    },
                  ]}
                  height="14rem"
                  ariaLabel="Exact customer location"
                />
                <p className="text-xs text-muted-foreground">
                  Exact location · coordinates {revealed.latitude.toFixed(6)},{" "}
                  {revealed.longitude.toFixed(6)}
                </p>
              </>
            ) : customer.areaLatitude !== null && customer.areaLongitude !== null ? (
              <>
                <BaseMap
                  points={[
                    {
                      label: customer.barangay || "Area",
                      latitude: customer.areaLatitude,
                      longitude: customer.areaLongitude,
                      count: 1,
                    },
                  ]}
                  height="14rem"
                  ariaLabel="Approximate customer area"
                />
                <p className="text-xs text-muted-foreground">
                  Approximate {customer.barangay ? `${customer.barangay} ` : ""}area center. The
                  exact door location stays hidden until an audited reveal.
                </p>
                {canReveal && !isArchived ? (
                  <Button variant="outline" size="sm" loading={reveal.isPending} onClick={() => reveal.mutate()}>
                    Reveal exact location
                  </Button>
                ) : null}
              </>
            ) : (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                The exact location is hidden. Reveal it with the button on the address fields.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={confirmOpen !== false}
        onOpenChange={(open) => {
          if (!open) setConfirmOpen(false);
        }}
        title={confirmOpen === "restore" ? "Restore customer?" : "Archive customer?"}
        description="This action is recorded in the audit trail with opaque identifiers only."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={confirmOpen === "restore" ? "default" : "destructive"}
              onClick={() => void changeStatus()}
              loading={setStatus.isPending}
            >
              {confirmOpen === "restore" ? "Restore" : "Archive"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {confirmOpen === "restore"
            ? "The customer becomes active again and can receive schedules."
            : "Archived customers stay on record and can be restored later. They cannot receive new schedules."}
        </p>
      </Dialog>
    </div>
  );
}
