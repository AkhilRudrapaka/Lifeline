'use client';

import { useState, type FormEvent } from 'react';
import { RankedHospitalData, ReservationRequestPayload, ReservationResultData, BedTypeData } from './types';

interface ReservationModalProps {
  hospital: RankedHospitalData;
  isDark: boolean;
  isSubmitting: boolean;
  error: string | null;
  result: ReservationResultData | null;
  onClose: () => void;
  onSubmit: (payload: ReservationRequestPayload) => void;
}

export default function ReservationModal({
  hospital,
  isDark,
  isSubmitting,
  error,
  result,
  onClose,
  onSubmit,
}: ReservationModalProps) {
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [bedType, setBedType] = useState<BedTypeData>(hospital.er_beds_available > 0 ? 'ER' : 'ICU');
  const [notes, setNotes] = useState('');

  const panelBg = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const mutedColor = isDark ? 'rgba(241,245,249,0.65)' : 'rgba(15,23,42,0.6)';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) return;
    onSubmit({
      patient_name: patientName.trim(),
      patient_age: patientAge ? Number(patientAge) : undefined,
      bed_type: bedType,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: panelBg,
          borderRadius: 16,
          padding: 22,
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          border: `1px solid ${borderColor}`,
        }}
      >
        {result ? (
          <div>
            <div style={{ fontSize: 32, textAlign: 'center' }}>✅</div>
            <h3 id="reservation-modal-title" style={{ color: '#16a34a', textAlign: 'center', margin: '8px 0 4px' }}>
              Bed Reserved
            </h3>
            <p style={{ textAlign: 'center', color: mutedColor, fontSize: 13, margin: '0 0 16px' }}>
              {result.hospital_name}
            </p>
            <div
              style={{
                background: isDark ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.08)',
                borderRadius: 10,
                padding: 14,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 11, color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Confirmation code
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: textColor, letterSpacing: 1 }}>
                {result.confirmation_code}
              </div>
            </div>
            <div style={{ fontSize: 13, color: textColor, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Patient: {result.patient_name}</span>
              <span>Bed type: {result.bed_type}</span>
              <span>
                Remaining beds: {result.remaining_er_beds} ER &middot; {result.remaining_icu_beds} ICU
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: 18,
                width: '100%',
                padding: '10px 0',
                borderRadius: 10,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 id="reservation-modal-title" style={{ color: textColor, margin: '0 0 2px' }}>
              Reserve a bed
            </h3>
            <p style={{ color: mutedColor, fontSize: 13, margin: '0 0 16px' }}>{hospital.hospital_name}</p>

            <label htmlFor="reservation-patient-name" style={{ fontSize: 12, color: mutedColor, display: 'block', marginBottom: 4 }}>
              Patient name *
            </label>
            <input
              id="reservation-patient-name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              placeholder="Full name"
              style={{
                width: '100%',
                padding: '9px 10px',
                borderRadius: 8,
                border: `1px solid ${borderColor}`,
                background: isDark ? '#1e293b' : '#f8fafc',
                color: textColor,
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="reservation-patient-age" style={{ fontSize: 12, color: mutedColor, display: 'block', marginBottom: 4 }}>
                  Age
                </label>
                <input
                  id="reservation-patient-age"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Optional"
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    background: isDark ? '#1e293b' : '#f8fafc',
                    color: textColor,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="reservation-bed-type" style={{ fontSize: 12, color: mutedColor, display: 'block', marginBottom: 4 }}>
                  Bed type
                </label>
                <select
                  id="reservation-bed-type"
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value as BedTypeData)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    background: isDark ? '#1e293b' : '#f8fafc',
                    color: textColor,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="ER" disabled={hospital.er_beds_available === 0}>
                    ER ({hospital.er_beds_available} available)
                  </option>
                  <option value="ICU" disabled={hospital.icu_beds_available === 0}>
                    ICU ({hospital.icu_beds_available} available)
                  </option>
                </select>
              </div>
            </div>

            <label htmlFor="reservation-notes" style={{ fontSize: 12, color: mutedColor, display: 'block', marginBottom: 4 }}>
              Dispatch notes
            </label>
            <textarea
              id="reservation-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for the receiving hospital"
              rows={2}
              style={{
                width: '100%',
                padding: '9px 10px',
                borderRadius: 8,
                border: `1px solid ${borderColor}`,
                background: isDark ? '#1e293b' : '#f8fafc',
                color: textColor,
                marginBottom: 12,
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />

            {error && (
              <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                  background: 'transparent',
                  color: textColor,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !patientName.trim()}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: isSubmitting ? '#94a3b8' : '#dc2626',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'default' : 'pointer',
                }}
              >
                {isSubmitting ? 'Reserving…' : 'Confirm reservation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
