import { getCsrfToken } from "./api-client";

export interface DownloadOptions {
  method?: "GET" | "POST";
  body?: unknown;
}

export async function downloadFile(path: string, options: DownloadOptions = {}): Promise<void> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { accept: "text/csv" };
  if (options.body !== undefined) headers["content-type"] = "application/json";
  const csrf = getCsrfToken();
  if (csrf) headers["x-csrf-token"] = csrf;

  const response = await fetch(`/api/v1${path}`, {
    method,
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    throw new Error("The export could not be created.");
  }
  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get("content-disposition")) ?? "export.csv";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function filenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] ?? null;
}
