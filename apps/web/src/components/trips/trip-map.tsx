"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapSegment {
  title: string;
  type: string;
  payload?: Record<string, unknown>;
}

interface TripMapProps {
  segments: MapSegment[];
  destination?: string;
}

// IATA → approximate coordinates for common airports/cities
const IATA_COORDS: Record<string, [number, number]> = {
  RUH: [46.6989, 24.9576],
  JED: [39.1568, 21.6796],
  DXB: [55.3644, 25.2532],
  LHR: [-0.4543, 51.4775],
  HND: [139.7797, 35.5494],
  NRT: [140.3929, 35.7647],
  CAI: [31.4056, 30.1219],
  BKK: [100.7501, 13.6811],
  IST: [28.8174, 40.9762],
  CDG: [2.5479, 49.0097],
  JFK: [-73.7789, 40.6413],
};

function getFlightCoords(
  payload: Record<string, unknown>
): [[number, number], [number, number]] | null {
  const origin = (payload.origin as string)?.toUpperCase();
  const dest = (payload.destination as string)?.toUpperCase();
  if (!origin || !dest) return null;
  const from = IATA_COORDS[origin];
  const to = IATA_COORDS[dest];
  if (!from || !to) return null;
  return [from, to];
}

export function TripMap({ segments, destination }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      zoom: 2,
      center: [40, 25], // default: Middle East / Asia view
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      const bounds = new mapboxgl.LngLatBounds();
      let hasPoints = false;

      for (const seg of segments) {
        if (seg.type === "FLIGHT" && seg.payload) {
          const coords = getFlightCoords(seg.payload);
          if (!coords) continue;
          const [from, to] = coords;

          // Arc line between airports
          const lineId = `flight-${seg.title}-${Math.random()}`;
          map.addSource(lineId, {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: { type: "LineString", coordinates: [from, to] },
              properties: {},
            },
          });
          map.addLayer({
            id: lineId,
            type: "line",
            source: lineId,
            paint: {
              "line-color": "#B85C38",
              "line-width": 1.5,
              "line-dasharray": [4, 3],
              "line-opacity": 0.7,
            },
          });

          // Markers
          new mapboxgl.Marker({ color: "#B85C38", scale: 0.6 })
            .setLngLat(from)
            .setPopup(new mapboxgl.Popup({ offset: 8 }).setText(seg.payload.origin as string))
            .addTo(map);
          new mapboxgl.Marker({ color: "#1F4F4A", scale: 0.6 })
            .setLngLat(to)
            .setPopup(new mapboxgl.Popup({ offset: 8 }).setText(seg.payload.destination as string))
            .addTo(map);

          bounds.extend(from);
          bounds.extend(to);
          hasPoints = true;
        }

        if (seg.type === "LODGING" && seg.payload?.coordinates) {
          const [lng, lat] = seg.payload.coordinates as [number, number];
          new mapboxgl.Marker({ color: "#C9A24B", scale: 0.6 })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup({ offset: 8 }).setText(seg.title))
            .addTo(map);
          bounds.extend([lng, lat]);
          hasPoints = true;
        }
      }

      if (hasPoints) {
        map.fitBounds(bounds, { padding: 40, maxZoom: 6, duration: 800 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [segments, destination]);

  return (
    <div className="rounded-xl overflow-hidden border border-line" style={{ height: 200 }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
