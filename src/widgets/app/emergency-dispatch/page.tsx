'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useWidgetSDK, useWidgetState, useTheme } from '@nitrostack/widgets';
import HospitalList from './HospitalList';
import ReservationModal from './ReservationModal';
import { parseToolResult } from './utils';
import {
  RankHospitalsOutputData,
  RankHospitalsToolInputData,
  RouteResultData,
  ReservationResultData,
  ReservationRequestPayload,
} from './types';

// Leaflet touches `window` at import time; this project statically exports
// (next.config.js output: 'export'), so the map must never render during
// server-side build.
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <MapPlaceholder label="Loading map…" />,
});

interface EmergencyDispatchState {
  selectedHospitalId: string | null;
  [key: string]: unknown;
}

function MapPlaceholder({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(148,163,184,0.9)',
        fontSize: 13,
      }}
    >
      {label}
    </div>
  );
}

export default function EmergencyDispatchWidget() {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const { isReady, getToolOutput, getToolInput, callTool } = useWidgetSDK();

  const [state, setState] = useWidgetState<EmergencyDispatchState>(() => ({ selectedHospitalId: null }));

  const output = getToolOutput<RankHospitalsOutputData>();
  const toolInput = getToolInput<RankHospitalsToolInputData & { origin_latitude: number; origin_longitude: number }>();

  const [route, setRoute] = useState<RouteResultData | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [reservingHospitalId, setReservingHospitalId] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationResult, setReservationResult] = useState<ReservationResultData | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);

  const hospitals = output?.hospitals ?? [];
  const selectedHospitalId =
    state?.selectedHospitalId ?? output?.recommended_hospital_id ?? hospitals[0]?.hospital_id ?? null;
  const selectedHospital = hospitals.find((h) => h.hospital_id === selectedHospitalId) ?? null;
  const origin = toolInput ? { latitude: toolInput.origin_latitude, longitude: toolInput.origin_longitude } : null;
  const reservingHospital = hospitals.find((h) => h.hospital_id === reservingHospitalId) ?? null;

  useEffect(() => {
    if (!selectedHospital || !origin) {
      setRoute(null);
      return;
    }

    let cancelled = false;
    setIsLoadingRoute(true);
    setRouteError(null);

    callTool('calculate_route', {
      origin_latitude: origin.latitude,
      origin_longitude: origin.longitude,
      destination_latitude: selectedHospital.latitude,
      destination_longitude: selectedHospital.longitude,
    })
      .then((response) => {
        if (cancelled) return;
        setRoute(parseToolResult<RouteResultData>(response));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setRoute(null);
        setRouteError(error instanceof Error ? error.message : 'Failed to calculate route.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRoute(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHospitalId, origin?.latitude, origin?.longitude]);

  function handleSelectHospital(hospitalId: string) {
    setState({ selectedHospitalId: hospitalId });
  }

  function openReservationModal(hospitalId: string) {
    setReservationResult(null);
    setReservationError(null);
    setReservingHospitalId(hospitalId);
  }

  function closeReservationModal() {
    setReservingHospitalId(null);
    setReservationResult(null);
    setReservationError(null);
  }

  async function submitReservation(payload: ReservationRequestPayload) {
    if (!reservingHospital) return;
    setIsReserving(true);
    setReservationError(null);

    try {
      const response = await callTool('request_emergency_reservation', {
        hospital_id: reservingHospital.hospital_id,
        ...payload,
      });
      setReservationResult(parseToolResult<ReservationResultData>(response));
    } catch (error) {
      setReservationError(error instanceof Error ? error.message : 'Reservation failed. Please try again.');
    } finally {
      setIsReserving(false);
    }
  }

  const bg = isDark ? '#0b1220' : '#f8fafc';
  const panelBg = isDark ? '#111827' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const mutedColor = isDark ? 'rgba(241,245,249,0.65)' : 'rgba(15,23,42,0.6)';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';

  if (!isReady) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: mutedColor, fontFamily: 'system-ui, sans-serif' }}>
        Connecting to Lifeline dispatch…
      </div>
    );
  }

  if (!output || hospitals.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: mutedColor, fontFamily: 'system-ui, sans-serif' }}>
        No ranked hospitals available yet. Run <code>rank_hospitals</code> to populate this view.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 480,
        background: bg,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: textColor,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${borderColor}`,
          background: panelBg,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>🚑 Lifeline Emergency Dispatch</div>
          <div style={{ fontSize: 12, color: mutedColor }}>{hospitals.length} hospital(s) ranked by match score</div>
        </div>
        {routeError && <div style={{ fontSize: 12, color: '#dc2626' }}>{routeError}</div>}
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: '1.2 1 0%', minHeight: 320, borderRight: `1px solid ${borderColor}` }}>
          <MapView
            origin={origin}
            hospitals={hospitals}
            selectedHospitalId={selectedHospitalId}
            route={route?.route ?? null}
            onSelectHospital={handleSelectHospital}
          />
        </div>
        <div style={{ flex: '1 1 0%', padding: 12, background: bg, overflowY: 'auto' }}>
          <HospitalList
            hospitals={hospitals}
            selectedHospitalId={selectedHospitalId}
            isDark={isDark}
            isLoadingRoute={isLoadingRoute}
            onSelect={handleSelectHospital}
            onReserve={openReservationModal}
          />
        </div>
      </div>

      {reservingHospital && (
        <ReservationModal
          hospital={reservingHospital}
          isDark={isDark}
          isSubmitting={isReserving}
          error={reservationError}
          result={reservationResult}
          onClose={closeReservationModal}
          onSubmit={submitReservation}
        />
      )}
    </div>
  );
}
