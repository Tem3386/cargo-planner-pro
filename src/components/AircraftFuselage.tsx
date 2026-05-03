import React from 'react';
import type { CellData, CellStatus, DoorLocation, HoldCompartment } from '@/lib/types';

interface AircraftFuselageProps {
  rows: number;
  cols: number;
  cells: CellData[];
  doors: DoorLocation[];
  holdCompartments?: HoldCompartment[];
  selectedCell: { row: number; col: number } | null;
  getCellStatus: (cell: CellData) => CellStatus;
  onCellTap: (cell: CellData) => void;
}

const AircraftFuselage: React.FC<AircraftFuselageProps> = ({
  rows, cols, cells, doors, holdCompartments, selectedCell, getCellStatus, onCellTap,
}) => {
  const enabledCells = cells.filter(c => c.enabled);

  // Horizontal layout: nose on left, tail on right
  const cellW = 52;
  const cellH = 44;
  const padding = 50;
  const noseLen = 60;
  const tailLen = 50;
  const compartmentGap = 8;

  // Calculate compartment widths
  const compartments = holdCompartments || [];
  const hasCompartments = compartments.length > 0;

  // Build column groups from compartments
  let gridW = cols * cellW;
  let compartmentOffsets: { startX: number; label: string; width: number }[] = [];

  if (hasCompartments) {
    let x = 0;
    for (const comp of compartments) {
      const colCount = comp.endCol - comp.startCol + 1;
      const w = colCount * cellW;
      compartmentOffsets.push({ startX: x, label: comp.label, width: w });
      x += w + compartmentGap;
    }
    gridW = x - compartmentGap;
  }

  const gridH = rows * cellH;
  const fuselageW = gridW + noseLen + tailLen + 40;
  const fuselageH = gridH + 40;
  const svgW = fuselageW + padding * 2;
  const svgH = fuselageH + padding * 2 + 30; // extra for compartment labels

  const fuselageX = padding;
  const fuselageY = padding + 20;
  const bodyLeft = fuselageX + noseLen;
  const bodyRight = fuselageX + fuselageW - tailLen;
  const centerY = fuselageY + fuselageH / 2;
  const gridX = bodyLeft + 20;
  const gridY = centerY - gridH / 2;

  // Get column X position accounting for compartment gaps
  const getColX = (col: number): number => {
    if (!hasCompartments) return gridX + col * cellW;
    for (const comp of compartments) {
      if (col >= comp.startX / cellW) continue;
    }
    // Find which compartment this col belongs to
    let x = gridX;
    for (const compOff of compartmentOffsets) {
      const compDef = holdCompartments!.find(h => h.label === compOff.label)!;
      if (col >= compDef.startCol && col <= compDef.endCol) {
        return x + (col - compDef.startCol) * cellW;
      }
      const colCount = compDef.endCol - compDef.startCol + 1;
      x += colCount * cellW + compartmentGap;
    }
    return gridX + col * cellW;
  };

  const statusColors: Record<CellStatus, string> = {
    empty: 'hsl(220, 10%, 25%)',
    loaded: 'hsl(142, 60%, 35%)',
    overload: 'hsl(0, 72%, 45%)',
    conflict: 'hsl(38, 92%, 45%)',
    active: 'hsl(210, 70%, 50%)',
  };

  const statusStrokes: Record<CellStatus, string> = {
    empty: 'hsl(220, 10%, 38%)',
    loaded: 'hsl(142, 60%, 48%)',
    overload: 'hsl(0, 72%, 58%)',
    conflict: 'hsl(38, 92%, 58%)',
    active: 'hsl(210, 70%, 62%)',
  };

  // Get unique column labels (deduplicated for multi-row)
  const colLabels = new Map<number, string>();
  for (const cell of enabledCells) {
    if (cell.label && !colLabels.has(cell.col)) {
      colLabels.set(cell.col, cell.label);
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full"
        style={{ minHeight: '220px', maxHeight: '340px' }}
      >
        <defs>
          <linearGradient id="fuselageGradH" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(220, 15%, 20%)" />
            <stop offset="100%" stopColor="hsl(220, 15%, 15%)" />
          </linearGradient>
          <filter id="shadowH">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Fuselage outline - horizontal */}
        <path
          d={`
            M ${fuselageX} ${centerY}
            Q ${fuselageX} ${fuselageY} ${bodyLeft} ${fuselageY}
            L ${bodyRight} ${fuselageY}
            Q ${fuselageX + fuselageW} ${fuselageY} ${fuselageX + fuselageW} ${fuselageY + fuselageH * 0.35}
            L ${fuselageX + fuselageW} ${fuselageY + fuselageH * 0.65}
            Q ${fuselageX + fuselageW} ${fuselageY + fuselageH} ${bodyRight} ${fuselageY + fuselageH}
            L ${bodyLeft} ${fuselageY + fuselageH}
            Q ${fuselageX} ${fuselageY + fuselageH} ${fuselageX} ${centerY}
            Z
          `}
          fill="url(#fuselageGradH)"
          stroke="hsl(220, 15%, 32%)"
          strokeWidth="1.5"
          filter="url(#shadowH)"
        />

        {/* Center line along fuselage */}
        <line
          x1={bodyLeft + 5} y1={centerY}
          x2={bodyRight - 5} y2={centerY}
          stroke="hsl(220, 15%, 22%)"
          strokeWidth="0.5"
          strokeDasharray="4,3"
        />

        {/* FWD / AFT labels */}
        <text x={fuselageX + 12} y={centerY + 4} textAnchor="middle" fill="hsl(215, 15%, 50%)" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="600">FWD</text>
        <text x={fuselageX + fuselageW - 12} y={centerY + 4} textAnchor="middle" fill="hsl(215, 15%, 50%)" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="600">AFT</text>

        {/* Door locations */}
        {doors.map(door => {
          const doorX = bodyLeft + (bodyRight - bodyLeft) * door.position;
          const isTop = door.side === 'left';
          const doorY = isTop ? fuselageY - 2 : fuselageY + fuselageH + 2;
          const doorW = 22;
          const doorH = 6;
          const textY = isTop ? doorY - 6 : doorY + doorH + 10;
          const doorColor = door.type === 'cargo' ? 'hsl(210, 70%, 55%)' : door.type === 'bulk' ? 'hsl(38, 92%, 50%)' : 'hsl(220, 10%, 45%)';

          return (
            <g key={door.id}>
              <rect
                x={doorX - doorW / 2} y={isTop ? doorY - doorH : doorY}
                width={doorW} height={doorH}
                rx={1.5}
                fill={doorColor} opacity={0.8}
              />
              <text x={doorX} y={textY} textAnchor="middle" fill={doorColor} fontSize="7" fontFamily="JetBrains Mono, monospace" fontWeight="500">
                {door.label}
              </text>
            </g>
          );
        })}

        {/* Hold compartment brackets and labels */}
        {hasCompartments && compartmentOffsets.map((comp, i) => {
          const x1 = getColX(holdCompartments![i].startCol);
          const x2 = getColX(holdCompartments![i].endCol) + cellW;
          const bracketY = gridY + gridH + 8;

          return (
            <g key={comp.label}>
              {/* Bracket */}
              <line x1={x1} y1={bracketY} x2={x2} y2={bracketY} stroke="hsl(215, 15%, 45%)" strokeWidth="1" />
              <line x1={x1} y1={bracketY - 3} x2={x1} y2={bracketY + 3} stroke="hsl(215, 15%, 45%)" strokeWidth="1" />
              <line x1={x2} y1={bracketY - 3} x2={x2} y2={bracketY + 3} stroke="hsl(215, 15%, 45%)" strokeWidth="1" />
              {/* Label */}
              <text x={(x1 + x2) / 2} y={bracketY + 14} textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                {comp.label}
              </text>
            </g>
          );
        })}

        {/* Compartment dividers */}
        {hasCompartments && compartmentOffsets.slice(1).map((comp, i) => {
          const compDef = holdCompartments![i + 1];
          const x = getColX(compDef.startCol) - compartmentGap / 2;
          return (
            <line key={`div-${i}`}
              x1={x} y1={gridY - 2} x2={x} y2={gridY + gridH + 2}
              stroke="hsl(215, 15%, 40%)" strokeWidth="1" strokeDasharray="3,2"
            />
          );
        })}

        {/* Cargo position cells */}
        {enabledCells.map(cell => {
          const cx = getColX(cell.col);
          const cy = gridY + cell.row * cellH;
          const status = getCellStatus(cell);
          const isSelected = selectedCell?.row === cell.row && selectedCell?.col === cell.col;
          const label = cell.label || `${cell.col + 1}`;

          return (
            <g
              key={`${cell.row}-${cell.col}`}
              onClick={() => onCellTap(cell)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
            >
              <rect
                x={cx + 1} y={cy + 1}
                width={cellW - 2} height={cellH - 2}
                rx={4}
                fill={statusColors[status]}
                stroke={isSelected ? 'hsl(210, 70%, 65%)' : statusStrokes[status]}
                strokeWidth={isSelected ? 2 : 1}
                strokeDasharray={isSelected ? '3,1.5' : 'none'}
              />
              {cell.entry ? (
                <>
                  <text x={cx + cellW / 2} y={cy + 14} textAnchor="middle" fill="white" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                    {cell.entry.uldType}
                  </text>
                  <text x={cx + cellW / 2} y={cy + 24} textAnchor="middle" fill="white" fontSize="7" fontFamily="JetBrains Mono, monospace" opacity="0.85">
                    {cell.entry.uldId.slice(0, 7)}
                  </text>
                  <text x={cx + cellW / 2} y={cy + 33} textAnchor="middle" fill="white" fontSize="7" fontFamily="JetBrains Mono, monospace" opacity="0.7">
                    {cell.entry.weight}kg
                  </text>
                </>
              ) : (
                <text x={cx + cellW / 2} y={cy + cellH / 2 + 3} textAnchor="middle" fill="hsl(215, 15%, 50%)" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  {label}
                </text>
              )}
              {status === 'conflict' && (
                <text x={cx + cellW - 10} y={cy + 12} fill="white" fontSize="10" fontWeight="bold">⚠</text>
              )}
              {status === 'overload' && (
                <text x={cx + cellW - 14} y={cy + 11} fill="white" fontSize="6" fontFamily="JetBrains Mono, monospace" fontWeight="bold">OVR</text>
              )}
            </g>
          );
        })}

        {/* Row labels (L/R or position numbering) */}
        {rows === 2 && (
          <>
            <text x={gridX - 8} y={gridY + cellH / 2 + 3} textAnchor="middle" fill="hsl(215, 15%, 45%)" fontSize="8" fontFamily="JetBrains Mono, monospace">R</text>
            <text x={gridX - 8} y={gridY + cellH + cellH / 2 + 3} textAnchor="middle" fill="hsl(215, 15%, 45%)" fontSize="8" fontFamily="JetBrains Mono, monospace">R</text>
          </>
        )}
      </svg>
    </div>
  );
};

export default AircraftFuselage;
