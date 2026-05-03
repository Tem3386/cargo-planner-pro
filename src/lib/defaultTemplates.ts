import type { AircraftTemplate } from './types';

function pos(rows: number, cols: number, maxWeight = 5000) {
  const positions = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      positions.push({ row: r, col: c, maxWeight, enabled: true });
  return positions;
}

export const DEFAULT_TEMPLATES: Omit<AircraftTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'B787-8 Lower Hold',
    aircraftType: 'B787-800',
    rows: 2,
    cols: 8,
    positions: pos(2, 8, 4500),
  },
  {
    name: 'B787-9 Lower Hold',
    aircraftType: 'B787-900',
    rows: 2,
    cols: 10,
    positions: pos(2, 10, 4500),
  },
  {
    name: 'A350-900 Lower Hold',
    aircraftType: 'A350-900',
    rows: 2,
    cols: 10,
    positions: pos(2, 10, 5000),
  },
  {
    name: 'A350-1000 Lower Hold',
    aircraftType: 'A350-1000',
    rows: 3,
    cols: 10,
    positions: pos(3, 10, 5000),
  },
  {
    name: 'B777-200LR Lower Hold',
    aircraftType: 'B777-200LR',
    rows: 2,
    cols: 10,
    positions: pos(2, 10, 5400),
  },
  {
    name: 'B777-300ER Lower Hold',
    aircraftType: 'B777-300ER',
    rows: 3,
    cols: 12,
    positions: pos(3, 12, 5400),
  },
];
