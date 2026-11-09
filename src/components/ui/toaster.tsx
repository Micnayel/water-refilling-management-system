import { useToastStore } from "@/stores/toast-store";
import { XIcon } from "./icons";
import { cn } from "@/lib/utils";

const toneClass = {
  success: "border-success/40 bg-card text-foreground before:bg-success",
  error: "border-destructive/40 bg-card text-foreground before:bg-destructive",
  info: "border-border bg-card text-foreground before:bg-primary",
};

export function Toaster() {
  const messages = useToastStore((state) => state.messages);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-3 right-3 z-[60] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "animate-rise relative flex items-start justify-between gap-2 overflow-hidden rounded-lg border p-2.5 pl-3.5 text-sm before:absolute before:inset-y-0 before:left-0 before:w-1",
            "shadow-[var(--shadow-raised)]",
            toneClass[message.tone],
          )}
        >
          <span>{message.title}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            className="btn-reset rounded p-0.5 hover:bg-muted"
            onClick={() => dismiss(message.id)}
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  return useToastStore((state) => state.push);
}
