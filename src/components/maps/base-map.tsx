import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { hasMapsKey, loadGoogleMaps, mapLoadErrorMessage, type MapsStatus } from "./loader";
import { clearOverlays, createHeatCells, createMarkers } from "./overlays";
import type { MapPoint } from "./types";

export interface BaseMapProps {
  points: MapPoint[];
  mode?: "markers" | "heat";
  height?: string;
  ariaLabel?: string;
  className?: string;
}

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };

/** Muted navy map style used by the dark templates. */
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1f37" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8f9bba" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1437" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2d3656" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f7b9c" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#16224a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#252c4d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7c88a8" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#20284a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1730" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4f5f8a" }] },
];


export function BaseMap({
  points,
  mode = "markers",
  height = "20rem",
  ariaLabel = "Map of aggregated customer locations",
  className,
}: BaseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<Array<google.maps.Marker | google.maps.Circle>>([]);
  const [status, setStatus] = useState<MapsStatus>(hasMapsKey() ? "loading" : "missing-key");

  useEffect(() => {
    if (!hasMapsKey()) {
      setStatus("missing-key");
      return;
    }
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const dark = document.documentElement.dataset.bsTheme === "dark";
        mapRef.current = new maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: dark ? DARK_MAP_STYLE : undefined,
          backgroundColor: dark ? "#1a1f37" : undefined,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    clearOverlays(overlaysRef.current);
    overlaysRef.current =
      mode === "heat" ? createHeatCells(map, points) : createMarkers(map, points);

    if (points.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      for (const point of points) {
        bounds.extend({ lat: point.latitude, lng: point.longitude });
      }
      map.fitBounds(bounds, 48);
    }
  }, [points, mode, status]);

  const message = mapLoadErrorMessage(status);

  if (message) {
    return (
      <div className={className}>
        <Alert tone="warning">{message}</Alert>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full overflow-hidden rounded-md border border-border", className)} style={{ height }}>
      {status === "loading" ? (
        <Skeleton className="absolute inset-0" aria-label="Loading map" />
      ) : null}
      <div ref={containerRef} className="size-full" role="application" aria-label={ariaLabel} />
      {status === "ready" && points.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs text-muted-foreground">
          No mapped locations for this view.
        </div>
      ) : null}
    </div>
  );
}
