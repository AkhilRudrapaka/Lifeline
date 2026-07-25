'use client';

import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import { RankedHospitalData, GeoJSONRouteData } from './types';
import { LEAFLET_CORE_CSS } from './leaflet-styles';

/**
 * Custom divIcon markers avoid the well-known Next.js/webpack issue where
 * Leaflet's default marker PNG assets fail to resolve after bundling.
 */
function createMarkerIcon(background: string, emoji: string): L.DivIcon {
  return L.divIcon({
    className: 'lifeline-marker',
    html: `<div style="background:${background};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.45);font-size:15px;line-height:1;">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

const originIcon = createMarkerIcon('#dc2626', '📍');
const hospitalIcon = createMarkerIcon('#2563eb', '🏥');
const selectedIcon = createMarkerIcon('#16a34a', '🏥');

const DEFAULT_CENTER: [number, number] = [11.0168, 76.9558];

interface MapViewProps {
  origin: { latitude: number; longitude: number } | null;
  hospitals: RankedHospitalData[];
  selectedHospitalId: string | null;
  route: GeoJSONRouteData | null;
  onSelectHospital: (hospitalId: string) => void;
}

export default function MapView({ origin, hospitals, selectedHospitalId, route, onSelectHospital }: MapViewProps) {
  const center: [number, number] = origin
    ? [origin.latitude, origin.longitude]
    : hospitals.length > 0
      ? [hospitals[0].latitude, hospitals[0].longitude]
      : DEFAULT_CENTER;

  return (
    <>
      <style>{LEAFLET_CORE_CSS}</style>
      <MapContainer center={center} zoom={11} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {origin && (
        <Marker position={[origin.latitude, origin.longitude]} icon={originIcon}>
          <Popup>Emergency location</Popup>
        </Marker>
      )}

      {hospitals.map((hospital) => (
        <Marker
          key={hospital.hospital_id}
          position={[hospital.latitude, hospital.longitude]}
          icon={hospital.hospital_id === selectedHospitalId ? selectedIcon : hospitalIcon}
          eventHandlers={{ click: () => onSelectHospital(hospital.hospital_id) }}
        >
          <Popup>
            <strong>{hospital.hospital_name}</strong>
            <br />
            Match score: {hospital.match_score}/100
            <br />
            ER beds: {hospital.er_beds_available} &middot; ICU beds: {hospital.icu_beds_available}
            <br />
            {hospital.distance_km.toFixed(1)} km &middot; ~{hospital.eta_minutes} min
          </Popup>
        </Marker>
      ))}

      {route && (
        <GeoJSON
          key={`${route.geometry.coordinates[0]?.join(',')}-${route.geometry.coordinates.length}`}
          data={route as unknown as GeoJsonObject}
          style={{ color: '#2563eb', weight: 4, opacity: 0.85 }}
        />
      )}
      </MapContainer>
    </>
  );
}
