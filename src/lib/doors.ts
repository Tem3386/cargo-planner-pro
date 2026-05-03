import type { DoorLocation } from './types';

/** Default door configurations per aircraft type */
export function getDoorsForAircraft(aircraftType: string): DoorLocation[] {
  const type = aircraftType.toUpperCase();

  if (type.includes('787-8') || type.includes('787-800')) {
    return [
      { id: 'fwd-cargo-l', label: 'FWD Cargo', side: 'right', position: 0.25, type: 'cargo' },
      { id: 'aft-cargo-l', label: 'AFT Cargo', side: 'right', position: 0.65, type: 'cargo' },
      { id: 'bulk-l', label: 'Bulk', side: 'right', position: 0.82, type: 'bulk' },
      { id: '1l', label: '1L', side: 'left', position: 0.1, type: 'passenger' },
      { id: '2l', label: '2L', side: 'left', position: 0.45, type: 'passenger' },
      { id: '3l', label: '3L', side: 'left', position: 0.75, type: 'passenger' },
    ];
  }

  if (type.includes('787-9') || type.includes('787-900')) {
    return [
      { id: 'fwd-cargo', label: 'FWD Cargo', side: 'right', position: 0.22, type: 'cargo' },
      { id: 'aft-cargo', label: 'AFT Cargo', side: 'right', position: 0.6, type: 'cargo' },
      { id: 'bulk', label: 'Bulk', side: 'right', position: 0.8, type: 'bulk' },
      { id: '1l', label: '1L', side: 'left', position: 0.08, type: 'passenger' },
      { id: '2l', label: '2L', side: 'left', position: 0.35, type: 'passenger' },
      { id: '3l', label: '3L', side: 'left', position: 0.6, type: 'passenger' },
      { id: '4l', label: '4L', side: 'left', position: 0.8, type: 'passenger' },
    ];
  }

  if (type.includes('A350-9') || type.includes('350-900')) {
    return [
      { id: 'fwd-cargo', label: 'FWD Cargo', side: 'right', position: 0.2, type: 'cargo' },
      { id: 'aft-cargo', label: 'AFT Cargo', side: 'right', position: 0.6, type: 'cargo' },
      { id: 'bulk', label: 'Bulk', side: 'right', position: 0.82, type: 'bulk' },
      { id: '1l', label: '1L', side: 'left', position: 0.08, type: 'passenger' },
      { id: '2l', label: '2L', side: 'left', position: 0.32, type: 'passenger' },
      { id: '3l', label: '3L', side: 'left', position: 0.55, type: 'passenger' },
      { id: '4l', label: '4L', side: 'left', position: 0.78, type: 'passenger' },
    ];
  }

  if (type.includes('A350-1') || type.includes('350-1000')) {
    return [
      { id: 'fwd-cargo', label: 'FWD Cargo', side: 'right', position: 0.18, type: 'cargo' },
      { id: 'aft-cargo', label: 'AFT Cargo', side: 'right', position: 0.55, type: 'cargo' },
      { id: 'bulk', label: 'Bulk', side: 'right', position: 0.78, type: 'bulk' },
      { id: '1l', label: '1L', side: 'left', position: 0.06, type: 'passenger' },
      { id: '2l', label: '2L', side: 'left', position: 0.28, type: 'passenger' },
      { id: '3l', label: '3L', side: 'left', position: 0.5, type: 'passenger' },
      { id: '4l', label: '4L', side: 'left', position: 0.72, type: 'passenger' },
      { id: '5l', label: '5L', side: 'left', position: 0.88, type: 'passenger' },
    ];
  }

  if (type.includes('777-200') || type.includes('777200')) {
    return [
      { id: 'fwd-cargo', label: 'FWD Cargo', side: 'right', position: 0.2, type: 'cargo' },
      { id: 'aft-cargo', label: 'AFT Cargo', side: 'right', position: 0.6, type: 'cargo' },
      { id: 'bulk', label: 'Bulk', side: 'right', position: 0.85, type: 'bulk' },
      { id: '1l', label: '1L', side: 'left', position: 0.08, type: 'passenger' },
      { id: '2l', label: '2L', side: 'left', position: 0.35, type: 'passenger' },
      { id: '3l', label: '3L', side: 'left', position: 0.65, type: 'passenger' },
      { id: '4l', label: '4L', side: 'left', position: 0.85, type: 'passenger' },
    ];
  }

  if (type.includes('777-300') || type.includes('777300')) {
    return [
      { id: 'fwd-cargo', label: 'FWD Cargo', side: 'right', position: 0.18, type: 'cargo' },
      { id: 'aft-cargo', label: 'AFT Cargo', side: 'right', position: 0.55, type: 'cargo' },
      { id: 'bulk', label: 'Bulk', side: 'right', position: 0.8, type: 'bulk' },
      { id: '1l', label: '1L', side: 'left', position: 0.06, type: 'passenger' },
      { id: '2l', label: '2L', side: 'left', position: 0.25, type: 'passenger' },
      { id: '3l', label: '3L', side: 'left', position: 0.45, type: 'passenger' },
      { id: '4l', label: '4L', side: 'left', position: 0.65, type: 'passenger' },
      { id: '5l', label: '5L', side: 'left', position: 0.85, type: 'passenger' },
    ];
  }

  // Generic fallback
  return [
    { id: 'fwd-cargo', label: 'FWD Cargo', side: 'right', position: 0.25, type: 'cargo' },
    { id: 'aft-cargo', label: 'AFT Cargo', side: 'right', position: 0.65, type: 'cargo' },
    { id: 'bulk', label: 'Bulk', side: 'right', position: 0.85, type: 'bulk' },
  ];
}
