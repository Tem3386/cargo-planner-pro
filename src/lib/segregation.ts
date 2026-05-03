import type { SegregationRule, CellData } from './types';

// Hard-coded Perishable Segregation Chart
export const SEGREGATION_RULES: SegregationRule[] = [
  { productA: 'Flowers', productB: 'Apples', reason: 'Ethylene Sensitivity — Apples emit ethylene which damages flowers' },
  { productA: 'Flowers', productB: 'Bananas', reason: 'Ethylene Sensitivity — Bananas emit ethylene which damages flowers' },
  { productA: 'Flowers', productB: 'Avocados', reason: 'Ethylene Sensitivity — Avocados emit ethylene which damages flowers' },
  { productA: 'Flowers', productB: 'Tomatoes', reason: 'Ethylene Sensitivity — Tomatoes emit ethylene which damages flowers' },
  { productA: 'Flowers', productB: 'Mangoes', reason: 'Ethylene Sensitivity — Mangoes emit ethylene which damages flowers' },
  { productA: 'Lettuce', productB: 'Apples', reason: 'Ethylene Sensitivity — Apples cause browning in lettuce' },
  { productA: 'Lettuce', productB: 'Bananas', reason: 'Ethylene Sensitivity — Bananas cause browning in lettuce' },
  { productA: 'Broccoli', productB: 'Apples', reason: 'Ethylene Sensitivity — Apples cause yellowing in broccoli' },
  { productA: 'Broccoli', productB: 'Tomatoes', reason: 'Ethylene Sensitivity — Tomatoes cause yellowing in broccoli' },
  { productA: 'Fish', productB: 'Dairy', reason: 'Odor Contamination — Fish odors contaminate dairy products' },
  { productA: 'Fish', productB: 'Fruits', reason: 'Odor Contamination — Fish odors contaminate fruits' },
  { productA: 'Onions', productB: 'Dairy', reason: 'Odor Contamination — Onion odors contaminate dairy products' },
  { productA: 'Onions', productB: 'Eggs', reason: 'Odor Contamination — Onion odors contaminate eggs' },
  { productA: 'Meat', productB: 'Vegetables', reason: 'Cross-Contamination Risk — Raw meat juices can contaminate vegetables' },
  { productA: 'Meat', productB: 'Fruits', reason: 'Cross-Contamination Risk — Raw meat juices can contaminate fruits' },
  { productA: 'Chemicals', productB: 'Food', reason: 'Hazmat Segregation — Chemicals must be separated from all food items' },
  { productA: 'DryIce', productB: 'LiveAnimals', reason: 'CO2 Hazard — Dry ice sublimation produces CO2 dangerous to live animals' },
];

export const COMMODITIES = [
  'Flowers', 'Apples', 'Bananas', 'Avocados', 'Tomatoes', 'Mangoes',
  'Lettuce', 'Broccoli', 'Fish', 'Dairy', 'Fruits', 'Onions', 'Eggs',
  'Meat', 'Vegetables', 'Chemicals', 'Food', 'DryIce', 'LiveAnimals',
  'Pharmaceuticals', 'Electronics', 'Textiles', 'General Cargo',
];

export function checkSegregation(
  commodity: string,
  row: number,
  col: number,
  cells: CellData[]
): { conflicting: CellData; reason: string }[] {
  const conflicts: { conflicting: CellData; reason: string }[] = [];
  
  // 8-way adjacency
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  for (const [dr, dc] of directions) {
    const adjRow = row + dr;
    const adjCol = col + dc;
    const neighbor = cells.find(c => c.row === adjRow && c.col === adjCol && c.entry);
    
    if (!neighbor?.entry) continue;

    const neighborCommodity = neighbor.entry.commodity;
    const rule = SEGREGATION_RULES.find(
      r =>
        (r.productA === commodity && r.productB === neighborCommodity) ||
        (r.productA === neighborCommodity && r.productB === commodity)
    );

    if (rule) {
      conflicts.push({ conflicting: neighbor, reason: rule.reason });
    }
  }

  return conflicts;
}
