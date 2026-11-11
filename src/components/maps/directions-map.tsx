import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { hasMapsKey, loadGoogleMaps, mapLoadErrorMessage, type MapsStatus } from "./loader";
import { createMarkers } from "./overlays";
import { DARK_MAP_STYLE } from "./style";

export interface LatLngPoint {
  latitude: number;
  longitude: number;
}

export interface DirectionsMapProps {
  origin: LatLngPoint;
  destination: LatLngPoint;
  destinationLabel?: string;
  height?: string;
  ariaLabel?: string;
  className?: string;
}

interface RouteSummary {
  distance: string;
  duration: string;
}

function formatDistance(meters: number | undefined): string {
  if (typeof meters !== "number") return "—";
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(millis: number | null | undefined): string {
  if (typeof millis !== "number") return "—";
  const minutes = Math.max(1, Math.round(millis / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ${minutes % 60} min`;
}

/**
 * In-app driving route from the station to a destination, drawn with the Maps
 * JavaScript Routes library. The request stays inside the Maps SDK, so no
 * coordinates or addresses go into a URL. If a route cannot be computed, both
 * points are still shown as markers.
 */
export function DirectionsMap({
  origin,
  destination,
  destinationLabel = "Destination",
  height = "16rem",
  ariaLabel = "Driving directions map",
  className,
}: DirectionsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState<MapsStatus>(hasMapsKey() ? "loading" : "missing-key");
  const [summary, setSummary] = useState<RouteSummary | null>(null);
  const [routeFailed, setRouteFailed] = useState(false);

  const originLat = origin.latitude;
  const originLng = origin.longitude;
  const destinationLat = destination.latitude;
  const destinationLng = destination.longitude;

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
          center: { lat: destinationLat, lng: destinationLng },
          zoom: 13,
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
    // The map instance is created once; the route effect updates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    let cancelled = false;
    const overlays: Array<google.maps.Marker | google.maps.Polyline> = [];
    setSummary(null);
    setRouteFailed(false);

    const originPoint = { lat: originLat, lng: originLng };
    const destinationPoint = { lat: destinationLat, lng: destinationLng };

    const showPointsOnly = () => {
      setRouteFailed(true);
      overlays.push(
        ...createMarkers(map, [
          { label: "Station", latitude: originLat, longitude: originLng, count: 1 },
          {
            label: destinationLabel,
            latitude: destinationLat,
            longitude: destinationLng,
            count: 1,
          },
        ]),
      );
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(originPoint);
      bounds.extend(destinationPoint);
      map.fitBounds(bounds, 48);
    };

    google.maps
      .importLibrary("routes")
      .then(async ({ Route }) => {
        if (cancelled) return;
        const { routes } = await Route.computeRoutes({
          origin: originPoint,
          destination: destinationPoint,
          travelMode: "DRIVING",
          fields: ["path", "distanceMeters", "durationMillis"],
        });
        if (cancelled) return;
        const route = routes?.[0];
        const path = route?.path;
        if (!route || !path || path.length === 0) {
          showPointsOnly();
          return;
        }
        const line = path.map((point) => ({ lat: point.lat, lng: point.lng }));
        overlays.push(
          new google.maps.Polyline({
            map,
            path: line,
            strokeColor: "#3fd0a4",
            strokeWeight: 5,
            strokeOpacity: 0.9,
          }),
          ...createMarkers(map, [
            { label: "Station", latitude: originLat, longitude: originLng, count: 1 },
            {
              label: destinationLabel,
              latitude: destinationLat,
              longitude: destinationLng,
              count: 1,
            },
          ]),
        );
        const bounds = new google.maps.LatLngBounds();
        for (const point of line) bounds.extend(point);
        map.fitBounds(bounds, 48);
        setSummary({
          distance: formatDistance(route.distanceMeters),
          duration: formatDuration(route.durationMillis),
        });
      })
      .catch(() => {
        if (!cancelled) showPointsOnly();
      });

    return () => {
      cancelled = true;
      for (const overlay of overlays) overlay.setMap(null);
    };
  }, [status, originLat, originLng, destinationLat, destinationLng, destinationLabel]);

  const message = mapLoadErrorMessage(status);
  if (message) {
    return (
      <div className={className}>
        <Alert tone="warning">{message}</Alert>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative w-full overflow-hidden rounded-md border border-border" style={{ height }}>
        {status === "loading" ? (
          <Skeleton className="absolute inset-0" aria-label="Loading map" />
        ) : null}
        <div ref={containerRef} className="size-full" role="application" aria-label={ariaLabel} />
      </div>
      {routeFailed ? (
        <p className="text-xs text-warning">
          Directions are unavailable right now. Both points are still marked on the map.
        </p>
      ) : summary ? (
        <p className="text-xs text-muted-foreground">
          Driving route · {summary.distance} · about {summary.duration} from the station
        </p>
      ) : null}
    </div>
  );
}
