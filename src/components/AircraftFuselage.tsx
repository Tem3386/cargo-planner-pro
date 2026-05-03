import React from 'react';
import type { CellData, CellStatus, DoorLocation } from '@/lib/types';

interface AircraftFuselageProps {
  rows: number;
  cols: number;
  cells: CellData[];
  doors: DoorLocation[];
  selectedCell: { row: number; col: number } | null;
  getCellStatus: (cell: CellData) => CellStatus;
  onCellTap: (cell: CellData) => void;
}

const AircraftFuselage: React.FC<AircraftFuselageProps> = ({
  rows, cols, cells, doors, selectedCell, getCellStatus, onCellTap,
}) => {
  const sortedCells = [...cells].filter(c => c.enabled).sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row);

  // SVG dimensions - portrait orientation (tall & narrow)
  const padding = 40;
  const cellW = 64;
  const cellH = 56;
  const gridW = rows * cellW; // rows = across fuselage width
  const gridH = cols * cellH; // cols = along fuselage length
  const fuselageW = gridW + 80;
  const fuselageH = gridH + 160;
  const svgW = fuselageW + padding * 2;
  const svgH = fuselageH + padding * 2;
  const fuselageX = padding;
  const fuselageY = padding;

  // Nose tip and tail
  const noseY = fuselageY;
  const noseEndY = fuselageY + 80;
  const tailY = fuselageY + fuselageH - 60;
  const bodyTop = noseEndY;
  const bodyBottom = tailY;
  const centerX = fuselageX + fuselageW / 2;

  // Grid origin
  const gridX = centerX - gridW / 2;
  const gridY = bodyTop + (bodyBottom - bodyTop - gridH) / 2;

  const statusColors: Record<CellStatus, string> = {
    empty: 'hsl(220, 10%, 30%)',
    loaded: 'hsl(142, 60%, 40%)',
    overload: 'hsl(0, 72%, 51%)',
    conflict: 'hsl(38, 92%, 50%)',
    active: 'hsl(210, 70%, 55%)',
  };

  const statusBorders: Record<CellStatus, string> = {
    empty: 'hsl(220, 10%, 40%)',
    loaded: 'hsl(142, 60%, 50%)',
    overload: 'hsl(0, 72%, 61%)',
    conflict: 'hsl(38, 92%, 60%)',
    active: 'hsl(210, 70%, 65%)',
  };

  return (
    <div className="w-full overflow-auto flex justify-center">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full max-w-sm"
        style={{ minHeight: '500px' }}
      >
        <defs>
          <linearGradient id="fuselageGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(220, 15%, 18%)" />
            <stop offset="100%" stopColor="hsl(220, 15%, 14%)" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="black" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Fuselage outline */}
        <path
          d={`
            M ${centerX} ${noseY}
            Q ${fuselageX + fuselageW} ${noseY + 30} ${fuselageX + fuselageW} ${noseEndY}
            L ${fuselageX + fuselageW} ${tailY}
            Q ${fuselageX + fuselageW} ${fuselageY + fuselageH} ${centerX} ${fuselageY + fuselageH}
            Q ${fuselageX} ${fuselageY + fuselageH} ${fuselageX} ${tailY}
            L ${fuselageX} ${noseEndY}
            Q ${fuselageX} ${noseY + 30} ${centerX} ${noseY}
            Z
          `}
          fill="url(#fuselageGrad)"
          stroke="hsl(220, 15%, 30%)"
          strokeWidth="2"
          filter="url(#shadow)"
        />

        {/* Center line */}
        <line
          x1={centerX} y1={noseEndY + 10}
          x2={centerX} y2={tailY - 10}
          stroke="hsl(220, 15%, 25%)"
          strokeWidth="1"
          strokeDasharray="6,4"
        />

        {/* FWD / AFT labels */}
        <text x={centerX} y={noseY + 24} textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">FWD</text>
        <text x={centerX} y={fuselageY + fuselageH - 16} textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">AFT</text>

        {/* Door locations */}
        {doors.map(door => {
          const doorY = noseEndY + (bodyBottom - bodyTop) * door.position;
          const doorX = door.side === 'left' ? fuselageX - 2 : fuselageX + fuselageW + 2;
          const doorW = 8;
          const doorH = 28;
          const textX = door.side === 'left' ? doorX - 4 : doorX + doorW + 4;
          const anchor = door.side === 'left' ? 'end' : 'start';
          const doorColor = door.type === 'cargo' ? 'hsl(210, 70%, 55%)' : door.type === 'bulk' ? 'hsl(38, 92%, 50%)' : 'hsl(220, 10%, 45%)';

          return (
            <g key={door.id}>
              <rect
                x={doorX}
                y={doorY - doorH / 2}
                width={doorW}
                height={doorH}
                rx={2}
                fill={doorColor}
                opacity={0.8}
              />
              <text
                x={textX}
                y={doorY + 4}
                textAnchor={anchor}
                fill={doorColor}
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="500"
              >
                {door.label}
              </text>
            </g>
          );
        })}

        {/* Cargo positions - row = across width, col = along length */}
        {sortedCells.map(cell => {
          const cx = gridX + cell.row * cellW;
          const cy = gridY + cell.col * cellH;
          const status = getCellStatus(cell);
          const isSelected = selectedCell?.row === cell.row && selectedCell?.col === cell.col;

          return (
            <g
              key={`${cell.row}-${cell.col}`}
              onClick={() => onCellTap(cell)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
            >
              <rect
                x={cx + 2}
                y={cy + 2}
                width={cellW - 4}
                height={cellH - 4}
                rx={6}
                fill={statusColors[status]}
                stroke={isSelected ? 'hsl(210, 70%, 65%)' : statusBorders[status]}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeDasharray={isSelected ? '4,2' : 'none'}
                opacity={0.95}
              />
              {cell.entry ? (
                <>
                  <text x={cx + cellW / 2} y={cy + 16} textAnchor="middle" fill="white" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                    {cell.entry.uldType || ''}
                  </text>
                  <text x={cx + cellW / 2} y={cy + 28} textAnchor="middle" fill="white" fontSize="8" fontFamily="JetBrains Mono, monospace" opacity="0.9">
                    {cell.entry.uldId.slice(0, 8)}
                  </text>
                  <text x={cx + cellW / 2} y={cy + 39} textAnchor="middle" fill="white" fontSize="8" fontFamily="JetBrains Mono, monospace" opacity="0.7">
                    {cell.entry.weight}kg
                  </text>
                  <text x={cx + cellW / 2} y={cy + 49} textAnchor="middle" fill="white" fontSize="7" fontFamily="JetBrains Mono, monospace" opacity="0.6">
                    {cell.entry.commodity.slice(0, 8)}
                  </text>
                </>
              ) : (
                <text x={cx + cellW / 2} y={cy + cellH / 2 + 4} textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="10" fontFamily="JetBrains Mono, monospace">
                  {String.fromCharCode(65 + cell.row)}{cell.col + 1}
                </text>
              )}
              {status === 'conflict' && (
                <text x={cx + cellW - 10} y={cy + 14} fill="hsl(0, 0%, 100%)" fontSize="12" fontWeight="bold">⚠</text>
              )}
              {status === 'overload' && (
                <text x={cx + cellW - 16} y={cy + 13} fill="hsl(0, 0%, 100%)" fontSize="7" fontFamily="JetBrains Mono, monospace" fontWeight="bold">OVR</text>
              )}
            </g>
          );
        })}

        {/* Hold compartment labels */}
        {cols > 4 && (
          <>
            <line x1={gridX} y1={gridY + Math.floor(cols / 2) * cellH} x2={gridX + gridW} y2={gridY + Math.floor(cols / 2) * cellH}
              stroke="hsl(215, 15%, 40%)" strokeWidth="1" strokeDasharray="3,3" />
            <text x={centerX} y={gridY + Math.floor(cols / 2) * cellH - 4} textAnchor="middle" fill="hsl(215, 15%, 45%)" fontSize="8" fontFamily="JetBrains Mono, monospace">
              FWD HOLD ↑ | ↓ AFT HOLD
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

export default AircraftFuselage;
