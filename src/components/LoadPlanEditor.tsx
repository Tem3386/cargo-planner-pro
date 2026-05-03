import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveFlightPlan, saveVersion, getVersionsByFlight } from '@/lib/db';
import { checkSegregation, COMMODITIES } from '@/lib/segregation';
import { getDoorsForAircraft } from '@/lib/doors';
import type { FlightPlan, CellData, CellStatus, FlightVersion, ULDType } from '@/lib/types';
import { ULD_TYPES } from '@/lib/types';
import AircraftFuselage from '@/components/AircraftFuselage';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Save, RotateCcw, History } from 'lucide-react';

interface LoadPlanEditorProps {
  plan: FlightPlan;
  onBack: () => void;
}

const LoadPlanEditor: React.FC<LoadPlanEditorProps> = ({ plan: initialPlan, onBack }) => {
  const { toast } = useToast();
  const [plan, setPlan] = useState<FlightPlan>(initialPlan);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [entryForm, setEntryForm] = useState({ uldId: '', weight: '', commodity: '', uldType: '' as string });
  const [conflicts, setConflicts] = useState<Map<string, string[]>>(new Map());
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<{ message: string }[]>([]);
  const [versions, setVersions] = useState<FlightVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const doors = useMemo(() => getDoorsForAircraft(plan.aircraftType), [plan.aircraftType]);

  useEffect(() => {
    getVersionsByFlight(plan.id).then(setVersions);
  }, [plan.id, plan.version]);

  useEffect(() => {
    const newConflicts = new Map<string, string[]>();
    for (const cell of plan.cells) {
      if (!cell.entry) continue;
      const results = checkSegregation(cell.entry.commodity, cell.row, cell.col, plan.cells);
      if (results.length > 0) {
        newConflicts.set(`${cell.row}-${cell.col}`, results.map(r => r.reason));
        for (const r of results) {
          const key = `${r.conflicting.row}-${r.conflicting.col}`;
          const existing = newConflicts.get(key) || [];
          if (!existing.includes(r.reason)) {
            newConflicts.set(key, [...existing, r.reason]);
          }
        }
      }
    }
    setConflicts(newConflicts);
  }, [plan.cells]);

  const getCellStatus = useCallback((cell: CellData): CellStatus => {
    if (!cell.entry) return 'empty';
    if (cell.entry.weight > cell.maxWeight) return 'overload';
    if (conflicts.has(`${cell.row}-${cell.col}`)) return 'conflict';
    return 'loaded';
  }, [conflicts]);

  const handleCellTap = (cell: CellData) => {
    setSelectedCell({ row: cell.row, col: cell.col });
    if (cell.entry) {
      setEntryForm({
        uldId: cell.entry.uldId,
        weight: String(cell.entry.weight),
        commodity: cell.entry.commodity,
        uldType: cell.entry.uldType || '',
      });
    } else {
      setEntryForm({ uldId: '', weight: '', commodity: '', uldType: '' });
    }

    const key = `${cell.row}-${cell.col}`;
    if (conflicts.has(key)) {
      setConflictDetails(conflicts.get(key)!.map(reason => ({ message: reason })));
      setShowConflictModal(true);
    }
  };

  const handleSaveEntry = () => {
    if (!selectedCell) return;
    if (!entryForm.uldId.trim() || !entryForm.weight || !entryForm.commodity || !entryForm.uldType) {
      toast({ title: 'Error', description: 'All fields required (including ULD type)', variant: 'destructive' });
      return;
    }

    const weight = Number(entryForm.weight);
    const updatedCells = plan.cells.map(c => {
      if (c.row === selectedCell.row && c.col === selectedCell.col) {
        return {
          ...c,
          entry: {
            uldId: entryForm.uldId.trim(),
            weight,
            commodity: entryForm.commodity,
            uldType: entryForm.uldType as ULDType,
          },
        };
      }
      return c;
    });

    const segregationResults = checkSegregation(entryForm.commodity, selectedCell.row, selectedCell.col, updatedCells);
    if (segregationResults.length > 0) {
      setConflictDetails(segregationResults.map(r => ({
        message: `Warning: ${entryForm.commodity} and ${r.conflicting.entry?.commodity} cannot be adjacent — ${r.reason}`,
      })));
      setShowConflictModal(true);
    }

    const cell = plan.cells.find(c => c.row === selectedCell.row && c.col === selectedCell.col);
    if (cell && weight > cell.maxWeight) {
      toast({ title: '⚠️ Overweight', description: `${weight}kg exceeds limit of ${cell.maxWeight}kg`, variant: 'destructive' });
    }

    setPlan(prev => ({ ...prev, cells: updatedCells }));
    setSelectedCell(null);
  };

  const handleClearEntry = () => {
    if (!selectedCell) return;
    const updatedCells = plan.cells.map(c => {
      if (c.row === selectedCell.row && c.col === selectedCell.col) {
        const { entry, ...rest } = c;
        return rest as CellData;
      }
      return c;
    });
    setPlan(prev => ({ ...prev, cells: updatedCells }));
    setSelectedCell(null);
    setEntryForm({ uldId: '', weight: '', commodity: '', uldType: '' });
  };

  const handleSavePlan = async () => {
    const newVersion = plan.version + 1;
    const version: FlightVersion = {
      id: crypto.randomUUID(),
      flightPlanId: plan.id,
      version: plan.version,
      cells: [...plan.cells],
      savedAt: Date.now(),
    };
    await saveVersion(version);
    const updatedPlan = { ...plan, version: newVersion, updatedAt: Date.now() };
    await saveFlightPlan(updatedPlan);
    setPlan(updatedPlan);
    toast({ title: 'Saved', description: `Version ${newVersion} saved` });
  };

  const handleRestoreVersion = async (version: FlightVersion) => {
    const newVersion = plan.version + 1;
    const updatedPlan = { ...plan, cells: version.cells, version: newVersion, updatedAt: Date.now() };
    const versionRecord: FlightVersion = {
      id: crypto.randomUUID(),
      flightPlanId: plan.id,
      version: plan.version,
      cells: [...plan.cells],
      savedAt: Date.now(),
      note: `Before restore to v${version.version}`,
    };
    await saveVersion(versionRecord);
    await saveFlightPlan(updatedPlan);
    setPlan(updatedPlan);
    setShowVersions(false);
    toast({ title: 'Restored', description: `Restored to v${version.version}, saved as v${newVersion}` });
  };

  const totalWeight = plan.cells.reduce((sum, c) => sum + (c.entry?.weight || 0), 0);
  const loadedCount = plan.cells.filter(c => c.entry).length;
  const totalPositions = plan.cells.filter(c => c.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="touch-target px-2">←</Button>
          <div>
            <h2 className="text-lg font-semibold">{plan.flightNumber}</h2>
            <p className="text-xs text-muted-foreground font-mono">
              {plan.aircraftType} • v{plan.version} • {plan.mode.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowVersions(true)} className="touch-target">
            <History className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={handleSavePlan} className="touch-target">
            <Save className="w-4 h-4 mr-1" />Save
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary rounded-lg p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Loaded</div>
          <div className="text-lg font-mono font-bold">{loadedCount}/{totalPositions}</div>
        </div>
        <div className="bg-secondary rounded-lg p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Weight</div>
          <div className="text-lg font-mono font-bold">{totalWeight.toLocaleString()}<span className="text-xs">kg</span></div>
        </div>
        <div className="bg-secondary rounded-lg p-2 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Conflicts</div>
          <div className={`text-lg font-mono font-bold ${conflicts.size > 0 ? 'text-status-conflict' : 'text-status-loaded'}`}>
            {conflicts.size}
          </div>
        </div>
      </div>

      {/* Door Legend */}
      <div className="flex gap-3 justify-center text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary inline-block" /> Cargo Door</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-status-conflict inline-block" /> Bulk Door</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground inline-block" /> Pax Door</span>
      </div>

      {/* 2D Aircraft Fuselage - Portrait View */}
      <AircraftFuselage
        rows={plan.rows}
        cols={plan.cols}
        cells={plan.cells}
        doors={doors}
        selectedCell={selectedCell}
        getCellStatus={getCellStatus}
        onCellTap={handleCellTap}
      />

      {/* Legend */}
      <div className="flex gap-3 justify-center text-xs flex-wrap">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded cell-empty" /> Empty</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded cell-loaded" /> Loaded</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded cell-overload" /> Overload</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded cell-conflict" /> Conflict</div>
      </div>

      {/* ULD Entry Form */}
      {selectedCell && (
        <div className="bg-card rounded-lg p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              Position {String.fromCharCode(65 + selectedCell.row)}{selectedCell.col + 1}
              <span className="text-muted-foreground font-normal ml-2">
                (Max: {plan.cells.find(c => c.row === selectedCell.row && c.col === selectedCell.col)?.maxWeight}kg)
              </span>
            </Label>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCell(null)}>✕</Button>
          </div>

          {/* ULD Type selector - prominent */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase">Container / Pallet Type</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {ULD_TYPES.map(u => (
                <button
                  key={u.value}
                  onClick={() => setEntryForm(prev => ({ ...prev, uldType: u.value }))}
                  className={`p-2 rounded-md text-center text-xs font-mono transition-all border ${
                    entryForm.uldType === u.value
                      ? 'bg-primary/20 border-primary text-primary-foreground'
                      : 'bg-secondary border-border text-muted-foreground hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="font-semibold">{u.value}</div>
                  <div className="text-[9px] opacity-70 leading-tight mt-0.5">{u.value.startsWith('P') ? 'Pallet' : 'Container'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase">ULD ID</Label>
              <Input
                value={entryForm.uldId}
                onChange={e => setEntryForm(prev => ({ ...prev, uldId: e.target.value }))}
                placeholder="AKE12345"
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase">Weight (kg)</Label>
              <Input
                type="number"
                value={entryForm.weight}
                onChange={e => setEntryForm(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="0"
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase">Commodity</Label>
              <Select value={entryForm.commodity} onValueChange={v => setEntryForm(prev => ({ ...prev, commodity: v }))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {COMMODITIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleClearEntry}>
              <RotateCcw className="w-3 h-3 mr-1" />Clear
            </Button>
            <Button size="sm" onClick={handleSaveEntry}>Assign</Button>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      <Dialog open={showConflictModal} onOpenChange={setShowConflictModal}>
        <DialogContent className="bg-card border-status-conflict/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-status-conflict">
              <AlertTriangle className="w-5 h-5" />
              Segregation Warning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {conflictDetails.map((c, i) => (
              <div key={i} className="bg-secondary rounded p-3 text-sm">{c.message}</div>
            ))}
          </div>
          <Button onClick={() => setShowConflictModal(false)}>Acknowledge</Button>
        </DialogContent>
      </Dialog>

      {/* Version History Modal */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {versions.length === 0 && <p className="text-sm text-muted-foreground">No previous versions</p>}
            {versions.map(v => (
              <div key={v.id} className="flex items-center justify-between bg-secondary rounded p-3">
                <div>
                  <span className="font-mono font-semibold">v{v.version}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(v.savedAt).toLocaleString()}
                  </span>
                  {v.note && <p className="text-xs text-muted-foreground">{v.note}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleRestoreVersion(v)}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoadPlanEditor;
