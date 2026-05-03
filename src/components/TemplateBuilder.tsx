import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveTemplate } from '@/lib/db';
import type { AircraftTemplate, Position } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface TemplateBuilderProps {
  onSaved: () => void;
  editTemplate?: AircraftTemplate;
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ onSaved, editTemplate }) => {
  const { toast } = useToast();
  const [name, setName] = useState(editTemplate?.name || '');
  const [aircraftType, setAircraftType] = useState(editTemplate?.aircraftType || '');
  const [rows, setRows] = useState(editTemplate?.rows || 3);
  const [cols, setCols] = useState(editTemplate?.cols || 6);
  const [positions, setPositions] = useState<Position[]>(() => {
    if (editTemplate) return editTemplate.positions;
    return generatePositions(3, 6);
  });

  function generatePositions(r: number, c: number): Position[] {
    const pos: Position[] = [];
    for (let row = 0; row < r; row++) {
      for (let col = 0; col < c; col++) {
        pos.push({ row, col, maxWeight: 5000, enabled: true });
      }
    }
    return pos;
  }

  const handleGridChange = useCallback((newRows: number, newCols: number) => {
    setRows(newRows);
    setCols(newCols);
    setPositions(prev => {
      const newPositions = generatePositions(newRows, newCols);
      // Preserve existing settings
      return newPositions.map(np => {
        const existing = prev.find(p => p.row === np.row && p.col === np.col);
        return existing || np;
      });
    });
  }, []);

  const togglePosition = (row: number, col: number) => {
    setPositions(prev =>
      prev.map(p =>
        p.row === row && p.col === col ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const updateMaxWeight = (row: number, col: number, weight: number) => {
    setPositions(prev =>
      prev.map(p =>
        p.row === row && p.col === col ? { ...p, maxWeight: weight } : p
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !aircraftType.trim()) {
      toast({ title: 'Error', description: 'Name and aircraft type required', variant: 'destructive' });
      return;
    }

    const template: AircraftTemplate = {
      id: editTemplate?.id || crypto.randomUUID(),
      name: name.trim(),
      aircraftType: aircraftType.trim(),
      rows,
      cols,
      positions: positions.filter(p => p.enabled),
      createdAt: editTemplate?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await saveTemplate(template);
    toast({ title: 'Template Saved', description: `${template.name} saved successfully` });
    onSaved();
  };

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Template Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., B777-300ER Lower Hold" className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Aircraft Type</Label>
          <Input value={aircraftType} onChange={e => setAircraftType(e.target.value)} placeholder="e.g., B777-300ER" className="bg-secondary border-border" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Rows</Label>
          <Input type="number" min={1} max={10} value={rows} onChange={e => handleGridChange(Number(e.target.value), cols)} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Columns</Label>
          <Input type="number" min={1} max={20} value={cols} onChange={e => handleGridChange(rows, Number(e.target.value))} className="bg-secondary border-border" />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-muted-foreground text-xs uppercase tracking-wider">
          Hold Layout — Tap to toggle positions, select to set weight
        </Label>
        
        {/* Aircraft silhouette container */}
        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-center mb-3">
            <div className="h-0.5 flex-1 bg-muted-foreground/30 rounded" />
            <span className="px-3 text-xs text-muted-foreground font-mono">FWD</span>
            <div className="h-0.5 flex-1 bg-muted-foreground/30 rounded" />
          </div>
          
          <div
            className="grid gap-2 mx-auto"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `${cols * 80}px` }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const pos = positions.find(p => p.row === r && p.col === c);
                const isEnabled = pos?.enabled ?? true;
                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCell(null);
                      } else {
                        setSelectedCell({ row: r, col: c });
                      }
                    }}
                    onDoubleClick={() => togglePosition(r, c)}
                    className={`
                      touch-target aspect-square rounded-md flex flex-col items-center justify-center text-xs font-mono transition-all
                      ${isEnabled ? 'cell-empty' : 'bg-background/50 border-2 border-dashed border-muted-foreground/20 opacity-40'}
                      ${isSelected ? 'cell-active' : ''}
                    `}
                  >
                    <span className="text-foreground/70">{String.fromCharCode(65 + r)}{c + 1}</span>
                    {isEnabled && <span className="text-[10px] text-muted-foreground">{pos?.maxWeight || 5000}kg</span>}
                  </button>
                );
              })
            )}
          </div>
          
          <div className="flex items-center justify-center mt-3">
            <div className="h-0.5 flex-1 bg-muted-foreground/30 rounded" />
            <span className="px-3 text-xs text-muted-foreground font-mono">AFT</span>
            <div className="h-0.5 flex-1 bg-muted-foreground/30 rounded" />
          </div>
        </div>
      </div>

      {selectedCell && (
        <div className="bg-secondary rounded-lg p-4 border border-border space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">
            Position {String.fromCharCode(65 + selectedCell.row)}{selectedCell.col + 1} — Max Weight (kg)
          </Label>
          <div className="flex gap-3">
            <Input
              type="number"
              min={0}
              value={positions.find(p => p.row === selectedCell.row && p.col === selectedCell.col)?.maxWeight || 5000}
              onChange={e => updateMaxWeight(selectedCell.row, selectedCell.col, Number(e.target.value))}
              className="bg-background border-border"
            />
            <Button
              variant="outline"
              onClick={() => togglePosition(selectedCell.row, selectedCell.col)}
              className="shrink-0"
            >
              {positions.find(p => p.row === selectedCell.row && p.col === selectedCell.col)?.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onSaved}>Cancel</Button>
        <Button onClick={handleSave}>Save Template</Button>
      </div>
    </div>
  );
};

export default TemplateBuilder;
