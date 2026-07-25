import { DepartmentType } from './triage.types.js';

/**
 * Geographic latitude and longitude coordinates
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Department availability status within a hospital
 */
export interface DepartmentAvailability {
  name: DepartmentType;
  availableBeds: number;
  totalBeds: number;
  isOperational: boolean;
}

/**
 * Hospital record model in the database
 */
export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  contact: {
    phone: string;
    emergencyLine: string;
  };
  departments: DepartmentType[];
  availableBeds: number;
  icuBeds: number;
  departmentAvailability?: Record<DepartmentType, number>;
}

/**
 * Input query for finding and routing emergency care
 */
export interface FindHospitalsInput {
  currentLatitude: number;
  currentLongitude: number;
  requiredSpecialty: DepartmentType;
  maxDistanceKm?: number;
}

/**
 * GeoJSON Feature LineString representing calculated route
 */
export interface GeoJSONGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [longitude, latitude]
}

export interface GeoJSONProperties {
  distanceKm: number;
  durationMinutes: number;
  summary?: string;
}

export interface GeoJSONRoute {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: GeoJSONProperties;
}

/**
 * Hospital result augmented with distance, ETA, and route metadata
 */
export interface RoutedHospital extends Hospital {
  distanceKm: number;
  etaMinutes: number;
  route: GeoJSONRoute;
}
