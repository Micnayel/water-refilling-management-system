import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PendingRegistrationsPanel } from "./PendingRegistrationsPanel";

export function PendingRegistrationsPage() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="Pending registrations"
        description="Self-registered accounts are pre-assigned the Customer role but stay inactive with no grants until approved."
        actions={
          <Link to="/administration/users" className={buttonVariants({ variant: "outline" })}>
            Back to users
          </Link>
        }
      />
      <PendingRegistrationsPanel />
    </div>
  );
}
