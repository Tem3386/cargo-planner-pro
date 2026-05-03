import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getTemplates, getFlightPlans, saveFlightPlan, deleteFlightPlan, exportAll, importAll, cleanupOldRecords } from '@/lib/db';
import type { AircraftTemplate, FlightPlan, CellData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Plane, Plus, Download, Upload, Trash2, Search } from 'lucide-react';

interface FlightManagerProps {
  onOpenPlan: (plan: FlightPlan) => void;
  onOpenTemplateBuilder: () => void;
  templates: AircraftTemplate[];
  refreshTemplates: () => void;
}

const FlightManager: React.FC<FlightManagerProps> = ({ onOpenPlan, onOpenTemplateBuilder, templates, refreshTemplates }) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<FlightPlan[]>([]);
  const [showNewFlight, setShowNewFlight] = useState(false);
  const [newFlight, setNewFlight] = useState({ flightNumber: '', templateId: '', mode: 'loading' as 'loading' | 'unloading' });
  const [search, setSearch] = useState('');

  const loadPlans = async () => {
    const p = await getFlightPlans();
    setPlans(p.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  useEffect(() => {
    loadPlans();
    cleanupOldRecords();
  }, []);

  const handleCreateFlight = async () => {
    if (!newFlight.flightNumber.trim() || !newFlight.templateId) {
      toast({ title: 'Error', description: 'Flight number and template required', variant: 'destructive' });
      return;
    }

    const template = templates.find(t => t.id === newFlight.templateId);
    if (!template) return;

    const cells: CellData[] = template.positions.map((pos, idx) => ({
      row: pos.row,
      col: pos.col,
      maxWeight: pos.maxWeight,
      enabled: pos.enabled,
      label: pos.label,
      sequenceNumber: idx + 1,
    }));

    const plan: FlightPlan = {
      id: crypto.randomUUID(),
      flightNumber: newFlight.flightNumber.trim().toUpperCase(),
      templateId: template.id,
      templateName: template.name,
      aircraftType: template.aircraftType,
      rows: template.rows,
      cols: template.cols,
      cells,
      holdCompartments: template.holdCompartments,
      mode: newFlight.mode,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
    };

    await saveFlightPlan(plan);
    setShowNewFlight(false);
    setNewFlight({ flightNumber: '', templateId: '', mode: 'loading' });
    await loadPlans();
    toast({ title: 'Created', description: `Flight ${plan.flightNumber} created` });
  };

  const handleDelete = async (id: string) => {
    await deleteFlightPlan(id);
    await loadPlans();
    toast({ title: 'Deleted' });
  };

  const handleExport = async () => {
    const data = await exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aircraft-load-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Full backup downloaded' });
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        await importAll(text);
        await loadPlans();
        refreshTemplates();
        toast({ title: 'Imported', description: 'Data restored successfully' });
      } catch {
        toast({ title: 'Error', description: 'Invalid backup file', variant: 'destructive' });
      }
    };
    input.click();
  };

  const filtered = plans.filter(p =>
    p.flightNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.aircraftType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowNewFlight(true)} className="touch-target">
          <Plus className="w-4 h-4 mr-1" />New Flight
        </Button>
        <Button variant="outline" onClick={onOpenTemplateBuilder} className="touch-target">
          <Plane className="w-4 h-4 mr-1" />Templates
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleExport} className="touch-target">
          <Download className="w-4 h-4 mr-1" />Export
        </Button>
        <Button variant="outline" size="sm" onClick={handleImport} className="touch-target">
          <Upload className="w-4 h-4 mr-1" />Import
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search flights..."
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* Flight List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No flight plans yet</p>
            <p className="text-xs mt-1">Create a template first, then start a new flight</p>
          </div>
        )}
        {filtered.map(plan => {
          const loaded = plan.cells.filter(c => c.entry).length;
          const total = plan.cells.filter(c => c.enabled).length;
          const totalWeight = plan.cells.reduce((s, c) => s + (c.entry?.weight || 0), 0);
          const hasConflicts = plan.cells.some(c => c.entry && c.entry.weight > c.maxWeight);

          return (
            <button
              key={plan.id}
              onClick={() => onOpenPlan(plan)}
              className="w-full bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors text-left touch-target"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-base">{plan.flightNumber}</div>
                    <div className="text-xs text-muted-foreground">{plan.aircraftType} • {plan.templateName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                    {plan.status}
                  </Badge>
                  <Badge variant="outline">{plan.mode}</Badge>
                  <Badge variant="outline">v{plan.version}</Badge>
                  {hasConflicts && <Badge variant="destructive">OVR</Badge>}
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground font-mono">
                <span>Loaded: {loaded}/{total}</span>
                <span>Weight: {totalWeight.toLocaleString()}kg</span>
                <span>{new Date(plan.updatedAt).toLocaleString()}</span>
              </div>
              <div
                className="flex items-center justify-end mt-1"
                onClick={e => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </button>
          );
        })}
      </div>

      {/* New Flight Dialog */}
      <Dialog open={showNewFlight} onOpenChange={setShowNewFlight}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>New Flight Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Flight Number</Label>
              <Input
                value={newFlight.flightNumber}
                onChange={e => setNewFlight(prev => ({ ...prev, flightNumber: e.target.value }))}
                placeholder="e.g., SQ321"
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Template</Label>
              <Select value={newFlight.templateId} onValueChange={v => setNewFlight(prev => ({ ...prev, templateId: v }))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.aircraftType})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground">No templates. Create one first.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Mode</Label>
              <Select value={newFlight.mode} onValueChange={v => setNewFlight(prev => ({ ...prev, mode: v as 'loading' | 'unloading' }))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loading">Loading</SelectItem>
                  <SelectItem value="unloading">Unloading</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewFlight(false)}>Cancel</Button>
              <Button onClick={handleCreateFlight}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlightManager;
