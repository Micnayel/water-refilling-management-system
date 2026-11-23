import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CalendarIcon, CheckIcon, DropletIcon, PauseIcon, PlayIcon, RefreshIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toaster";
import { formatDateNumeric } from "@/lib/dates";
import { formatCentavos } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../../store";
import { customerMetrics, planFor } from "../../selectors";
import { InfoRow, PageHeading, SectionCard, StatusPill } from "../../components/ui";
import type { Plan } from "../../types";

function addWeeks(iso: string, weeks: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + weeks * 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function CustomerSubscription() {
  const state = useWorkspaceStore();
  const toast = useToast();
  const metrics = customerMetrics(state);
  const subscription = metrics.activeSubscription;
  const plan = planFor(state, subscription?.planId);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);

  const schedule = subscription
    ? Array.from({ length: 4 }, (_, index) => ({
        date: addWeeks(subscription.nextDate, index),
        paused: subscription.status === "paused",
      }))
    : [];

  const togglePause = () => {
    if (!subscription) return;
    const next = subscription.status === "active" ? "paused" : "active";
    state.setSubscriptionStatus(next);
    toast(next === "paused" ? "Subscription paused" : "Subscription resumed", "success");
  };

  const confirmChange = () => {
    if (!pendingPlan) return;
    state.changePlan(pendingPlan.id);
    toast(`Plan changed to ${pendingPlan.name}`, "success");
    setPendingPlan(null);
  };

  return (
    <>
      <PageHeading
        eyebrow="My subscription"
        title="Recurring water delivery"
        subtitle="Pause, skip, or switch plans. Changes apply from the next delivery."
        actions={
          subscription ? (
            <>
              <Button variant="outline" onClick={() => { state.skipNextDelivery(); toast("Next delivery moved by one week", "success"); }}>
                <RefreshIcon /> Skip next delivery
              </Button>
              <Button variant={subscription.status === "active" ? "outline" : "default"} onClick={togglePause}>
                {subscription.status === "active" ? <PauseIcon /> : <PlayIcon />}
                {subscription.status === "active" ? "Pause plan" : "Resume plan"}
              </Button>
            </>
          ) : null
        }
      />

      {!subscription || !plan ? (
        <SectionCard title="No subscription yet">
          <p className="text-sm text-muted-foreground">Pick a plan below to start recurring deliveries.</p>
        </SectionCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <SectionCard title="Current plan" description="This is the plan used for your automatic deliveries.">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight">{plan.name}</span>
                  <StatusPill status={subscription.status === "active" ? "Active" : "Paused"} />
                </div>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="rounded-xl bg-primary/5 px-4 py-3 text-right">
                <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Per delivery</p>
                <p className="text-xl font-bold text-primary">{formatCentavos(plan.priceCentavos)}</p>
                <p className="text-xs text-muted-foreground">{plan.cadence}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Gallons</p>
                <p className="text-lg font-semibold">{plan.jugs}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Next delivery</p>
                <p className="text-lg font-semibold">{formatDateNumeric(subscription.nextDate)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">This month</p>
                <p className="text-lg font-semibold">{subscription.deliveriesThisMonth} visits</p>
              </div>
            </div>

            <div className="mt-4">
              <InfoRow label="Delivery window">{subscription.window}</InfoRow>
              <InfoRow label="Started">{formatDateNumeric(subscription.startedAt)}</InfoRow>
              <InfoRow label="Payment">Cash on delivery or GCash</InfoRow>
              <InfoRow label="Skip policy">Skip anytime before 8:00 PM the day before.</InfoRow>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => setPendingPlan(state.plans.find((row) => row.id !== plan.id) ?? null)}>
                Change plan
              </Button>
              <Button variant="outline" onClick={() => { state.skipNextDelivery(); toast("Next delivery moved by one week", "success"); }}>
                Skip next delivery
              </Button>
              <Button variant="ghost" onClick={togglePause}>
                {subscription.status === "active" ? "Pause subscription" : "Resume subscription"}
              </Button>
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard title="Upcoming schedule" description="Projected from your plan and skip history." bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {schedule.map((row, index) => (
                  <li key={row.date} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="ws-stat-icon is-primary size-8">
                        <CalendarIcon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{formatDateNumeric(row.date)}</p>
                        <p className="text-[0.6875rem] text-muted-foreground">
                          {index === 0 ? "Next delivery" : `Week ${index + 1}`} · {subscription.window}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={row.paused ? "Paused" : "Confirmed"} />
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="How billing works">
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
                  You are charged per delivery, not upfront. Cancel or pause before the cutoff and nothing is billed.
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
                  Skipped weeks are not charged and do not deduct stock.
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
                  Plan changes take effect on the next scheduled delivery.
                </li>
              </ul>
            </SectionCard>
          </div>
        </div>
      )}

      <SectionCard
        title="Available plans"
        description="All plans include free delivery inside the service area."
        className="mt-4"
      >
        <div className="grid gap-3 md:grid-cols-3">
          {state.plans.map((row) => {
            const current = row.id === plan?.id;
            return (
              <article
                key={row.id}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  current ? "border-primary/50 bg-primary/5" : "border-border bg-card",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{row.name}</h3>
                  {current ? <span className="ws-chip is-on">Current</span> : null}
                </div>
                <p className="mt-1 text-2xl font-bold tracking-tight">{formatCentavos(row.priceCentavos)}</p>
                <p className="text-xs text-muted-foreground">
                  {row.jugs} gallons · {row.cadence.toLowerCase()}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{row.description}</p>
                <Button
                  className="mt-3 w-full"
                  variant={current ? "outline" : "default"}
                  disabled={current}
                  onClick={() => setPendingPlan(row)}
                >
                  {current ? "Current plan" : "Switch to this plan"}
                </Button>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <Dialog
        open={pendingPlan !== null}
        onOpenChange={(open) => !open && setPendingPlan(null)}
        title={pendingPlan ? `Switch to ${pendingPlan.name}?` : "Switch plan"}
        description="The new rate applies from your next delivery. Nothing is charged today."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingPlan(null)}>
              Keep current plan
            </Button>
            <Button onClick={confirmChange}>Confirm change</Button>
          </div>
        }
      >
        {pendingPlan ? (
          <div className="space-y-1">
            <InfoRow label="Plan">{pendingPlan.name}</InfoRow>
            <InfoRow label="Gallons">{`${pendingPlan.jugs} per delivery`}</InfoRow>
            <InfoRow label="Cadence">{pendingPlan.cadence}</InfoRow>
            <InfoRow label="Price">{`${formatCentavos(pendingPlan.priceCentavos)} per delivery`}</InfoRow>
            <p className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
              <DropletIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Your delivery day and time window stay the same.
            </p>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
