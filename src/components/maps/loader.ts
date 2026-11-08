import { Loader } from "@googlemaps/js-api-loader";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export type MapsStatus = "missing-key" | "loading" | "ready" | "error";

let loaderPromise: Promise<typeof google.maps> | null = null;

export function hasMapsKey(): boolean {
  return Boolean(apiKey);
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (!apiKey) {
    return Promise.reject(new Error("missing_key"));
  }
  if (!loaderPromise) {
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["maps"],
    });
    loaderPromise = loader.load().then(() => google.maps);
  }
  return loaderPromise;
}

export function mapLoadErrorMessage(status: MapsStatus): string | null {
  switch (status) {
    case "missing-key":
      return "Google Maps is not configured. The list or table view still shows the same data.";
    case "error":
      return "The map could not load. Check your connection or the Maps key, then try again. The list view still works.";
    default:
      return null;
  }
}
