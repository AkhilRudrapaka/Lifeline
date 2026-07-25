/**
 * Local mirrors of the server's tool output shapes. The widget Next.js
 * project has its own tsconfig (moduleResolution: bundler, no access to
 * src/server) so shapes are duplicated here rather than imported.
 */

export interface RankedHospitalData {
  hospital_id: string;
  hospital_name: string;
  city: string;
  latitude: number;
  longitude: number;
  capabilities: string[];
  er_beds_available: number;
  icu_beds_available: number;
  estimated_er_wait_minutes: number;
  languages: string[];
  verification_status: string;
  data_type: 'SYNTHETIC_DEMO';
  distance_km: number;
  eta_minutes: number;
  match_score: number;
  is_recommended: boolean;
}

export interface RankingWeightsData {
  specialization_match: number;
  icu_beds_available: number;
  er_beds_available: number;
  distance: number;
  eta: number;
  wait_time: number;
}

export interface RankHospitalsOutputData {
  hospitals: RankedHospitalData[];
  recommended_hospital_id: string | null;
  ranking_weights: RankingWeightsData;
}

export interface RankHospitalsToolInputData {
  required_capability: string;
  origin_latitude: number;
  origin_longitude: number;
}

export interface GeoJSONRouteData {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: {
    distanceKm: number;
    durationMinutes: number;
    summary?: string;
  };
}

export interface RouteResultData {
  distance_km: number;
  eta_minutes: number;
  route: GeoJSONRouteData;
}

export type BedTypeData = 'ER' | 'ICU';

export interface ReservationResultData {
  reservation_id: string;
  confirmation_code: string;
  status: string;
  hospital_id: string;
  hospital_name: string;
  patient_name: string;
  bed_type: BedTypeData;
  reserved_at: string;
  remaining_er_beds: number;
  remaining_icu_beds: number;
}

export interface ReservationRequestPayload {
  patient_name: string;
  patient_age?: number;
  bed_type: BedTypeData;
  notes?: string;
}
