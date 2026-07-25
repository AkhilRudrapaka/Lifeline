/**
 * Medical Department Specializations supported by Lifeline Triage
 */
export type DepartmentType =
  | 'Cardiac Cath Lab'
  | 'Trauma Level 1'
  | 'Stroke Center'
  | 'Pediatric ICU'
  | 'General ER';

/**
 * Patient Symptom Severity Levels
 */
export type SeverityLevel = 'Critical' | 'Severe' | 'Moderate' | 'Mild';

/**
 * Input payload for triage_symptoms tool
 */
export interface SymptomTriageInput {
  symptoms: string;
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
}

/**
 * Triage analysis output model returned by triage_symptoms tool
 */
export interface SymptomTriageResult {
  severity: SeverityLevel;
  requiredDepartment: DepartmentType;
  confidence: number; // 0.0 to 1.0
  reasoning?: string;
}
