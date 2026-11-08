import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toaster";
import { ScheduleForm } from "./ScheduleForm";
import { useCreateSchedule } from "./hooks";
import type { ScheduleFormValues } from "./schemas";

export function ScheduleNewPage() {
  const navigate = useNavigate();
  const createSchedule = useCreateSchedule();
  const toast = useToast();

  const onSubmit = async (values: ScheduleFormValues) => {
    try {
      const schedule = await createSchedule.mutateAsync(values);
      toast("Schedule created.", "success");
      navigate(`/scheduling/${schedule.id}`);
    } catch {
      // Rendered by the form.
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="New schedule"
        description="One-time or recurring refill and delivery in Asia/Manila time."
        actions={
          <Button variant="outline" onClick={() => navigate("/scheduling")}>
            Back to scheduling
          </Button>
        }
      />
      <ScheduleForm
        submitLabel="Create schedule"
        pending={createSchedule.isPending}
        error={createSchedule.error}
        onSubmit={onSubmit}
        onCancel={() => navigate("/scheduling")}
      />
    </div>
  );
}
