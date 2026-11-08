import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { apiMessage } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { ScheduleForm } from "./ScheduleForm";
import { useSchedule, useUpdateSchedule } from "./hooks";
import type { ScheduleFormValues } from "./schemas";

export function ScheduleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useSchedule(id);
  const updateSchedule = useUpdateSchedule(id ?? "");
  const toast = useToast();

  if (query.isLoading) {
    return (
      <div className="p-3">
        <SkeletonRows rows={5} />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState description={apiMessage(query.error)} />;
  }
  if (query.data.status === "Completed" || query.data.status === "Cancelled") {
    return (
      <div className="space-y-3">
        <Alert tone="warning">Completed or cancelled schedules cannot be edited.</Alert>
        <Button variant="outline" onClick={() => navigate(`/scheduling/${id}`)}>
          Back to schedule
        </Button>
      </div>
    );
  }

  const onSubmit = async (values: ScheduleFormValues) => {
    try {
      await updateSchedule.mutateAsync({ ...values, version: query.data?.version ?? 1 });
      toast("Schedule updated.", "success");
      navigate(`/scheduling/${id}`);
    } catch {
      // Rendered by the form.
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Edit schedule"
        description="A stale version asks you to reload before saving."
        actions={
          <Button variant="outline" onClick={() => navigate(`/scheduling/${id}`)}>
            Back to schedule
          </Button>
        }
      />
      <ScheduleForm
        defaultValues={{
          customerId: query.data.customerId,
          assignedUserId: query.data.assignedUserId,
          type: query.data.type === "refill" ? "refill" : "delivery",
          recurrence:
            query.data.recurrence === "daily" ||
            query.data.recurrence === "weekly" ||
            query.data.recurrence === "monthly"
              ? query.data.recurrence
              : "one-time",
          scheduledDate: query.data.scheduledDate,
          scheduledTime: query.data.scheduledTime,
          gallons: query.data.gallons,
          amountCentavos: query.data.amountCentavos,
          notes: query.data.notes,
        }}
        submitLabel="Save changes"
        pending={updateSchedule.isPending}
        error={updateSchedule.error}
        onSubmit={onSubmit}
        onCancel={() => navigate(`/scheduling/${id}`)}
      />
    </div>
  );
}
