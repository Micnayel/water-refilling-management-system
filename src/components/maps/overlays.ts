import type { MapPoint } from "./types";

const COLORS = ["#0e7490", "#0891b2", "#06b6d4", "#22d3ee"];

export function markerColor(count: number): string {
  if (count >= 12) return COLORS[3] ?? "#22d3ee";
  if (count >= 6) return COLORS[2] ?? "#06b6d4";
  if (count >= 3) return COLORS[1] ?? "#0891b2";
  return COLORS[0] ?? "#0e7490";
}

export function createMarkers(
  map: google.maps.Map,
  points: MapPoint[],
): google.maps.Marker[] {
  return points.map((point) => {
    const marker = new google.maps.Marker({
      map,
      position: { lat: point.latitude, lng: point.longitude },
      title: `${point.label} (${point.count})`,
      label: {
        text: String(point.count),
        color: "#ffffff",
        fontSize: "10px",
        fontWeight: "600",
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 13,
        fillColor: markerColor(point.count),
        fillOpacity: 0.95,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });
    return marker;
  });
}

export function createHeatCells(
  map: google.maps.Map,
  points: MapPoint[],
): google.maps.Circle[] {
  const max = Math.max(1, ...points.map((point) => point.count));
  return points.map((point) => {
    const weight = point.count / max;
    return new google.maps.Circle({
      map,
      center: { lat: point.latitude, lng: point.longitude },
      radius: 350 + weight * 900,
      fillColor: markerColor(point.count),
      fillOpacity: 0.18 + weight * 0.32,
      strokeColor: markerColor(point.count),
      strokeOpacity: 0.5,
      strokeWeight: 1,
    });
  });
}

export function clearOverlays(
  overlays: Array<google.maps.Marker | google.maps.Circle>,
): void {
  for (const overlay of overlays) overlay.setMap(null);
}
