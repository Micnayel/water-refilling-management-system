import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface MaskedValueProps {
  value: string;
  revealed: boolean;
  canReveal: boolean;
  onReveal: () => void;
  onHide?: () => void;
  revealLabel?: string;
  className?: string;
}

export function MaskedValue({
  value,
  revealed,
  canReveal,
  onReveal,
  onHide,
  revealLabel = "Reveal sensitive value",
  className,
}: MaskedValueProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn(!revealed && "select-none text-muted-foreground")}>{value}</span>
      {canReveal ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label={revealed ? "Hide sensitive value" : revealLabel}
          aria-pressed={revealed}
          onClick={revealed ? onHide ?? onReveal : onReveal}
        >
          {revealed ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
        </Button>
      ) : null}
    </span>
  );
}
