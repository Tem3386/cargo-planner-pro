export interface Position {
  row: number;
  col: number;
  maxWeight: number;
  enabled: boolean;
  label?: string; // e.g. "11", "25", "BULK"
}

export type ULDType = 'LD3' | 'LD7' | 'LD11' | 'LD26' | 'LD29' | 'PMC' | 'PAG' | 'PLA';

export interface ULDEntry {
  uldId: string;
  weight: number;
  commodity: string;
  uldType: ULDType;
}

export interface DoorLocation {
  id: string;
  label: string;
  side: 'left' | 'right';
  /** Position along fuselage as fraction 0 (nose) to 1 (tail) */
  position: number;
  type: 'cargo' | 'bulk' | 'passenger';
}

export const ULD_TYPES: { value: ULDType; label: string; description: string }[] = [
  { value: 'LD3', label: 'LD3', description: 'Half-width lower deck container' },
  { value: 'LD7', label: 'LD7', description: 'Full-width lower deck container' },
  { value: 'LD11', label: 'LD11', description: 'Lower deck container (wide)' },
  { value: 'LD26', label: 'LD26', description: 'Half-width lower deck container' },
  { value: 'LD29', label: 'LD29', description: 'Full-width lower deck container' },
  { value: 'PMC', label: 'PMC Pallet', description: '96×125" main deck pallet' },
  { value: 'PAG', label: 'PAG Pallet', description: '88×125" main deck pallet' },
  { value: 'PLA', label: 'PLA Pallet', description: '88×108" lower deck pallet' },
];

export interface HoldCompartment {
  id: string;
  label: string; // e.g. "H1", "H2", "BULK"
  startCol: number;
  endCol: number; // inclusive
  type: 'container' | 'pallet' | 'bulk';
}

export interface CellData {
  row: number;
  col: number;
  maxWeight: number;
  enabled: boolean;
  label?: string;
  entry?: ULDEntry;
  sequenceNumber?: number;
}

export interface AircraftTemplate {
  id: string;
  name: string;
  aircraftType: string;
  rows: number;
  cols: number;
  positions: Position[];
  holdCompartments?: HoldCompartment[];
  createdAt: number;
  updatedAt: number;
}

export interface FlightPlan {
  id: string;
  flightNumber: string;
  templateId: string;
  templateName: string;
  aircraftType: string;
  rows: number;
  cols: number;
  cells: CellData[];
  holdCompartments?: HoldCompartment[];
  mode: 'loading' | 'unloading';
  version: number;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'completed';
}

export interface FlightVersion {
  id: string;
  flightPlanId: string;
  version: number;
  cells: CellData[];
  savedAt: number;
  note?: string;
}

export type CellStatus = 'empty' | 'loaded' | 'overload' | 'conflict' | 'active';

export interface SegregationRule {
  productA: string;
  productB: string;
  reason: string;
}
