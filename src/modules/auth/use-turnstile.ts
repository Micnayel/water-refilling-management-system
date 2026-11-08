import { useEffect, useRef, useState } from "react";
import { fetchTurnstileKey } from "./service";

interface TurnstileApi {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      theme?: "light" | "dark";
    },
  ) => string;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "wrms-turnstile-script";

export function useTurnstile(onToken: (token: string) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const callbackRef = useRef(onToken);
  callbackRef.current = onToken;

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const siteKey = await fetchTurnstileKey();
      if (cancelled || !siteKey) return;
      if (!window.turnstile) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
          if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error("turnstile_script")));
            return;
          }
          const script = document.createElement("script");
          script.id = SCRIPT_ID;
          script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("turnstile_script"));
          document.head.appendChild(script);
        });
      }
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => callbackRef.current(token),
        theme: document.documentElement.dataset.theme === "midnight" ? "dark" : "light",
      });
    };

    render().catch(() => {
      if (!cancelled) setUnavailable(true);
    });

    return () => {
      cancelled = true;
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, []);

  return { containerRef, unavailable };
}
