export interface Position {
  row: number;
  col: number;
  maxWeight: number;
  enabled: boolean;
}

export interface ULDEntry {
  uldId: string;
  weight: number;
  commodity: string;
}

export interface CellData {
  row: number;
  col: number;
  maxWeight: number;
  enabled: boolean;
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
