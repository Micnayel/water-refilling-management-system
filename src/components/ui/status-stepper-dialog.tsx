import { useEffect, useState, type ReactNode } from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { Badge } from "./badge";
import { CheckIcon } from "./icons";
import { cn } from "@/lib/utils";

export interface StatusStepperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: string;
  steps: string[];
  options: string[];
  onConfirm: (status: string) => void;
  pending?: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
}

export function StatusStepperDialog({
  open,
  onOpenChange,
  current,
  steps,
  options,
  onConfirm,
  pending,
  title = "Update status",
  description,
  children,
}: StatusStepperDialogProps) {
  const currentIndex = steps.indexOf(current);
  const [selected, setSelected] = useState(options[0] ?? "");

  useEffect(() => {
    if (open) setSelected(options[0] ?? "");
  }, [open, options]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => onConfirm(selected)}
            disabled={!selected}
            loading={pending}
          >
            <CheckIcon /> Confirm
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <ol className="flex flex-wrap items-center gap-1.5" aria-label="Schedule lifecycle">
          {steps.map((step, index) => {
            const state =
              index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
            return (
              <li key={step} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs",
                    state === "done" && "border-success/40 bg-success/10 text-success",
                    state === "current" && "border-primary/50 bg-primary/10 text-primary",
                    state === "upcoming" && "border-border text-muted-foreground",
                  )}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {step}
                </span>
                {index < steps.length - 1 ? <span className="text-muted-foreground">›</span> : null}
              </li>
            );
          })}
        </ol>

        <fieldset className="space-y-1.5">
          <legend className="mb-1 text-xs font-medium text-muted-foreground">Move to</legend>
          {options.length === 0 ? (
            <p className="text-xs text-muted-foreground">No further changes are allowed.</p>
          ) : null}
          {options.map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 rounded-md border p-2 text-sm",
                selected === option ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status-option"
                  value={option}
                  checked={selected === option}
                  onChange={() => setSelected(option)}
                />
                {option}
              </span>
              <Badge tone={option === "Cancelled" ? "destructive" : "neutral"}>{option}</Badge>
            </label>
          ))}
        </fieldset>

        {children}
      </div>
    </Dialog>
  );
}
