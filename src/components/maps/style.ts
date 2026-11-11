/** Muted navy map style used by the dark templates. */
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
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
