import { useToastStore } from "@/stores/toast-store";
import { XIcon } from "./icons";
import { cn } from "@/lib/utils";

const toneClass = {
  success: "border-success/40 bg-success/10 text-foreground",
  error: "border-destructive/40 bg-destructive/10 text-foreground",
  info: "border-border bg-card text-foreground",
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
          className={cn("flex items-start justify-between gap-2 rounded-md border p-2.5 text-sm shadow-md", toneClass[message.tone])}
        >
          <span>{message.title}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            className="rounded p-0.5 hover:bg-muted"
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
