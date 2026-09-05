'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon paths in bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RelayHop {
  hop_number?: number;
  ip_address?: string;
  ip?: string;
  server_name?: string;
  helo_domain?: string;
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  asn?: string;
  latitude?: number;
  longitude?: number;
  enrichment_status?: string;
  timestamp?: string;
  delay_seconds?: number;
  raw_header?: string;
  raw?: string;
}

interface NetworkMapProps {
  hops: RelayHop[];
}

function createHopIcon(hopNumber: number, isOrigin: boolean, isFinal: boolean): L.DivIcon {
  const bg = isOrigin ? '#ef4444' : isFinal ? '#22c55e' : '#6366f1';
  const border = isOrigin ? '#fca5a5' : isFinal ? '#86efac' : '#a5b4fc';
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${bg};
      border: 2px solid ${border};
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: white;
      font-family: ui-monospace, monospace;
      box-shadow: 0 0 12px ${bg}80, 0 0 24px ${bg}40;
    ">${hopNumber}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/** Auto-fit the map bounds to the markers */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
  }, [positions, map]);
  return null;
}

export default function NetworkMap({ hops }: NetworkMapProps) {
  const geoHops = hops.filter(
    (h) => h.latitude != null && h.longitude != null && h.latitude !== 0 && h.longitude !== 0
  );

  if (geoHops.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-950/60 rounded-xl border border-slate-800">
        <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h4 className="text-sm font-medium text-slate-400 mb-1">Geolocation Unavailable</h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Geolocation data unavailable for internal or masked routing. Coordinates could not be resolved for the extracted relay IPs.
        </p>
      </div>
    );
  }

  const positions: [number, number][] = geoHops.map(h => [h.latitude!, h.longitude!]);

  return (
    <MapContainer
      center={positions[0]}
      zoom={3}
      className="h-full w-full rounded-xl"
      style={{ minHeight: '400px', background: '#0f172a' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      <FitBounds positions={positions} />

      {/* Dashed polyline connecting hops */}
      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{
            color: '#22d3ee',
            weight: 2.5,
            dashArray: '8, 6',
            opacity: 0.8,
          }}
        />
      )}

      {/* Markers for each hop */}
      {geoHops.map((hop, idx) => {
        const hopNum = hop.hop_number || idx + 1;
        const isOrigin = idx === 0;
        const isFinal = idx === geoHops.length - 1;
        const ip = hop.ip_address || hop.ip || 'Unknown';
        const location = [hop.city, hop.region, hop.country].filter(Boolean).join(', ');

        return (
          <Marker
            key={`hop-${hopNum}-${ip}`}
            position={[hop.latitude!, hop.longitude!]}
            icon={createHopIcon(hopNum, isOrigin, isFinal)}
          >
            <Popup className="leaflet-popup-dark">
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', lineHeight: '1.5', color: '#e2e8f0', minWidth: '180px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', color: isOrigin ? '#fca5a5' : isFinal ? '#86efac' : '#a5b4fc' }}>
                  HOP {hopNum} — {isOrigin ? 'ORIGIN' : isFinal ? 'DESTINATION' : 'RELAY'}
                </div>
                <div style={{ color: '#818cf8' }}>{ip}</div>
                {location && <div style={{ color: '#94a3b8', marginTop: '2px' }}>{location}</div>}
                {hop.isp && <div style={{ color: '#64748b', marginTop: '2px' }}>{hop.isp}</div>}
                {hop.asn && <div style={{ color: '#475569', marginTop: '2px' }}>{hop.asn}</div>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
