import type { AircraftTemplate, HoldCompartment } from './types';

/**
 * Position generator with airline-style labels.
 * Labels follow the convention: first digit = hold section, second digit = position within section.
 * For 2-row configs (LD3 containers), each column has 2 rows (L/R or top/bottom pair).
 */
function containerPositions(
  sections: { prefix: number; count: number; maxWeight: number }[],
  rows: number
) {
  const positions: { row: number; col: number; maxWeight: number; enabled: boolean; label: string }[] = [];
  let col = 0;
  for (const section of sections) {
    for (let i = 1; i <= section.count; i++) {
      const label = `${section.prefix}${i}`;
      for (let r = 0; r < rows; r++) {
        positions.push({ row: r, col, maxWeight: section.maxWeight, enabled: true, label });
      }
      col++;
    }
  }
  return { positions, totalCols: col };
}

function bulkPosition(col: number, rows: number, maxWeight = 1500) {
  const positions = [];
  for (let r = 0; r < rows; r++) {
    positions.push({ row: r, col, maxWeight, enabled: true, label: 'BULK' });
  }
  return positions;
}

function makeCompartments(
  sections: { prefix: number; count: number; holdLabel: string }[],
  hasBulk: boolean,
  totalCols: number
): HoldCompartment[] {
  const compartments: HoldCompartment[] = [];
  let col = 0;
  for (const section of sections) {
    compartments.push({
      id: section.holdLabel.toLowerCase(),
      label: section.holdLabel,
      startCol: col,
      endCol: col + section.count - 1,
      type: 'container',
    });
    col += section.count;
  }
  if (hasBulk) {
    compartments.push({
      id: 'bulk',
      label: 'BULK',
      startCol: totalCols,
      endCol: totalCols,
      type: 'bulk',
    });
  }
  return compartments;
}

export const DEFAULT_TEMPLATES: Omit<AircraftTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = (() => {
  // ===== B787-8 =====
  const b788Sections = [
    { prefix: 1, count: 5, maxWeight: 4500, holdLabel: 'H1' },
    { prefix: 2, count: 4, maxWeight: 4500, holdLabel: 'H2' },
    { prefix: 3, count: 4, maxWeight: 4500, holdLabel: 'H3' },
    { prefix: 4, count: 3, maxWeight: 4500, holdLabel: 'H4' },
  ];
  const b788 = containerPositions(b788Sections.map(s => ({ prefix: s.prefix, count: s.count, maxWeight: s.maxWeight })), 2);
  const b788Bulk = bulkPosition(b788.totalCols, 1, 1500);

  // ===== B787-9 (matches reference image) =====
  const b789Sections = [
    { prefix: 1, count: 5, maxWeight: 4500, holdLabel: 'H1' },
    { prefix: 2, count: 5, maxWeight: 4500, holdLabel: 'H2' },
    { prefix: 3, count: 4, maxWeight: 4500, holdLabel: 'H3' },
    { prefix: 4, count: 4, maxWeight: 4500, holdLabel: 'H4' },
  ];
  const b789 = containerPositions(b789Sections.map(s => ({ prefix: s.prefix, count: s.count, maxWeight: s.maxWeight })), 2);
  const b789Bulk = bulkPosition(b789.totalCols, 1, 1500);

  // ===== A350-900 =====
  const a359Sections = [
    { prefix: 1, count: 5, maxWeight: 5000, holdLabel: 'H1' },
    { prefix: 2, count: 5, maxWeight: 5000, holdLabel: 'H2' },
    { prefix: 3, count: 4, maxWeight: 5000, holdLabel: 'H3' },
    { prefix: 4, count: 4, maxWeight: 5000, holdLabel: 'H4' },
  ];
  const a359 = containerPositions(a359Sections.map(s => ({ prefix: s.prefix, count: s.count, maxWeight: s.maxWeight })), 2);
  const a359Bulk = bulkPosition(a359.totalCols, 1, 1500);

  // ===== A350-1000 =====
  const a35kSections = [
    { prefix: 1, count: 6, maxWeight: 5000, holdLabel: 'H1' },
    { prefix: 2, count: 5, maxWeight: 5000, holdLabel: 'H2' },
    { prefix: 3, count: 5, maxWeight: 5000, holdLabel: 'H3' },
    { prefix: 4, count: 4, maxWeight: 5000, holdLabel: 'H4' },
    { prefix: 5, count: 3, maxWeight: 5000, holdLabel: 'H5' },
  ];
  const a35k = containerPositions(a35kSections.map(s => ({ prefix: s.prefix, count: s.count, maxWeight: s.maxWeight })), 2);
  const a35kBulk = bulkPosition(a35k.totalCols, 1, 1500);

  // ===== B777-200LR =====
  const b772Sections = [
    { prefix: 1, count: 5, maxWeight: 5400, holdLabel: 'H1' },
    { prefix: 2, count: 5, maxWeight: 5400, holdLabel: 'H2' },
    { prefix: 3, count: 4, maxWeight: 5400, holdLabel: 'H3' },
    { prefix: 4, count: 4, maxWeight: 5400, holdLabel: 'H4' },
  ];
  const b772 = containerPositions(b772Sections.map(s => ({ prefix: s.prefix, count: s.count, maxWeight: s.maxWeight })), 2);
  const b772Bulk = bulkPosition(b772.totalCols, 1, 1500);

  // ===== B777-300ER =====
  const b773Sections = [
    { prefix: 1, count: 6, maxWeight: 5400, holdLabel: 'H1' },
    { prefix: 2, count: 5, maxWeight: 5400, holdLabel: 'H2' },
    { prefix: 3, count: 5, maxWeight: 5400, holdLabel: 'H3' },
    { prefix: 4, count: 5, maxWeight: 5400, holdLabel: 'H4' },
    { prefix: 5, count: 3, maxWeight: 5400, holdLabel: 'H5' },
  ];
  const b773 = containerPositions(b773Sections.map(s => ({ prefix: s.prefix, count: s.count, maxWeight: s.maxWeight })), 2);
  const b773Bulk = bulkPosition(b773.totalCols, 1, 1500);

  return [
    {
      name: 'B787-8 Lower Hold',
      aircraftType: 'B787-800',
      rows: 2,
      cols: b788.totalCols + 1,
      positions: [...b788.positions, ...b788Bulk],
      holdCompartments: [
        ...makeCompartments(b788Sections, false, b788.totalCols),
        { id: 'bulk', label: 'BULK', startCol: b788.totalCols, endCol: b788.totalCols, type: 'bulk' as const },
      ],
    },
    {
      name: 'B787-9 Lower Hold',
      aircraftType: 'B787-900',
      rows: 2,
      cols: b789.totalCols + 1,
      positions: [...b789.positions, ...b789Bulk],
      holdCompartments: [
        ...makeCompartments(b789Sections, false, b789.totalCols),
        { id: 'bulk', label: 'BULK', startCol: b789.totalCols, endCol: b789.totalCols, type: 'bulk' as const },
      ],
    },
    {
      name: 'A350-900 Lower Hold',
      aircraftType: 'A350-900',
      rows: 2,
      cols: a359.totalCols + 1,
      positions: [...a359.positions, ...a359Bulk],
      holdCompartments: [
        ...makeCompartments(a359Sections, false, a359.totalCols),
        { id: 'bulk', label: 'BULK', startCol: a359.totalCols, endCol: a359.totalCols, type: 'bulk' as const },
      ],
    },
    {
      name: 'A350-1000 Lower Hold',
      aircraftType: 'A350-1000',
      rows: 2,
      cols: a35k.totalCols + 1,
      positions: [...a35k.positions, ...a35kBulk],
      holdCompartments: [
        ...makeCompartments(a35kSections, false, a35k.totalCols),
        { id: 'bulk', label: 'BULK', startCol: a35k.totalCols, endCol: a35k.totalCols, type: 'bulk' as const },
      ],
    },
    {
      name: 'B777-200LR Lower Hold',
      aircraftType: 'B777-200LR',
      rows: 2,
      cols: b772.totalCols + 1,
      positions: [...b772.positions, ...b772Bulk],
      holdCompartments: [
        ...makeCompartments(b772Sections, false, b772.totalCols),
        { id: 'bulk', label: 'BULK', startCol: b772.totalCols, endCol: b772.totalCols, type: 'bulk' as const },
      ],
    },
    {
      name: 'B777-300ER Lower Hold',
      aircraftType: 'B777-300ER',
      rows: 2,
      cols: b773.totalCols + 1,
      positions: [...b773.positions, ...b773Bulk],
      holdCompartments: [
        ...makeCompartments(b773Sections, false, b773.totalCols),
        { id: 'bulk', label: 'BULK', startCol: b773.totalCols, endCol: b773.totalCols, type: 'bulk' as const },
      ],
    },
  ];
})();
