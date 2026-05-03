import React, { useState, useEffect } from 'react';
import { getTemplates, getFlightPlan, deleteTemplate } from '@/lib/db';
import type { AircraftTemplate, FlightPlan } from '@/lib/types';
import TemplateBuilder from '@/components/TemplateBuilder';
import FlightManager from '@/components/FlightManager';
import LoadPlanEditor from '@/components/LoadPlanEditor';
import { Button } from '@/components/ui/button';
import { Plane, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type View = 'flights' | 'templates' | 'template-builder' | 'load-editor';

const Index = () => {
  const { toast } = useToast();
  const [view, setView] = useState<View>('flights');
  const [templates, setTemplates] = useState<AircraftTemplate[]>([]);
  const [activePlan, setActivePlan] = useState<FlightPlan | null>(null);
  const [editTemplate, setEditTemplate] = useState<AircraftTemplate | undefined>(undefined);

  const loadTemplates = async () => {
    const t = await getTemplates();
    setTemplates(t.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpenPlan = (plan: FlightPlan) => {
    setActivePlan(plan);
    setView('load-editor');
  };

  const handleBackFromEditor = async () => {
    if (activePlan) {
      const refreshed = await getFlightPlan(activePlan.id);
      if (refreshed) setActivePlan(refreshed);
    }
    setActivePlan(null);
    setView('flights');
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    await loadTemplates();
    toast({ title: 'Template deleted' });
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-5xl mx-auto">
      {/* App header */}
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Plane className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Aircraft Load Planner</h1>
          <p className="text-xs text-muted-foreground font-mono">Offline Ramp Operations</p>
        </div>
      </header>

      {/* Views */}
      {view === 'flights' && (
        <FlightManager
          onOpenPlan={handleOpenPlan}
          onOpenTemplateBuilder={() => setView('templates')}
          templates={templates}
          refreshTemplates={loadTemplates}
        />
      )}

      {view === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setView('flights')}>← Flights</Button>
            <Button onClick={() => { setEditTemplate(undefined); setView('template-builder'); }}>
              + New Template
            </Button>
          </div>
          
          {templates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No templates yet</p>
              <p className="text-xs mt-1">Create your first aircraft hold template</p>
            </div>
          )}

          {templates.map(t => (
            <div key={t.id} className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {t.aircraftType} • {t.rows}×{t.cols} • {t.positions.length} positions
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditTemplate(t); setView('template-builder'); }}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(t.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'template-builder' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{editTemplate ? 'Edit Template' : 'New Template'}</h2>
          <TemplateBuilder
            editTemplate={editTemplate}
            onSaved={() => { loadTemplates(); setView('templates'); }}
          />
        </div>
      )}

      {view === 'load-editor' && activePlan && (
        <LoadPlanEditor plan={activePlan} onBack={handleBackFromEditor} />
      )}
    </div>
  );
};

export default Index;
