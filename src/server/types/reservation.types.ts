import { DepartmentType } from './triage.types.js';

export type ReservationStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'EXPIRED';

/**
 * Input structure for reserve_icu_bed tool
 */
export interface BedReservationInput {
  hospitalId: string;
  patientName: string;
  patientAge?: number;
  department?: DepartmentType;
  notes?: string;
}

/**
 * Response model generated upon successful bed reservation
 */
export interface BedReservationResult {
  reservationId: string;
  hospitalId: string;
  hospitalName: string;
  patientName: string;
  department: DepartmentType;
  status: ReservationStatus;
  reservedAt: string; // ISO 8601 timestamp
  remainingBeds: number;
  remainingIcuBeds: number;
  confirmationCode: string;
}
