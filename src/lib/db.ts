import type { AircraftTemplate, FlightPlan, FlightVersion } from './types';
import { DEFAULT_TEMPLATES } from './defaultTemplates';

const DB_NAME = 'AircraftLoadPlanner';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('templates')) {
        const tStore = db.createObjectStore('templates', { keyPath: 'id' });
        tStore.createIndex('name', 'name', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('flightPlans')) {
        const fStore = db.createObjectStore('flightPlans', { keyPath: 'id' });
        fStore.createIndex('flightNumber', 'flightNumber', { unique: false });
        fStore.createIndex('createdAt', 'createdAt', { unique: false });
        fStore.createIndex('status', 'status', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('versions')) {
        const vStore = db.createObjectStore('versions', { keyPath: 'id' });
        vStore.createIndex('flightPlanId', 'flightPlanId', { unique: false });
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      seedDefaults(db).then(() => resolve(db)).catch(() => resolve(db));
    };
    request.onerror = () => reject(request.error);
  });
}

async function seedDefaults(db: IDBDatabase): Promise<void> {
  const tx = db.transaction('templates', 'readwrite');
  const store = tx.objectStore('templates');
  const existing: AircraftTemplate[] = await new Promise((res, rej) => {
    const r = store.getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  if (existing.length > 0) return;
  const now = Date.now();
  for (const t of DEFAULT_TEMPLATES) {
    const full: AircraftTemplate = { ...t, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    store.put(full);
  }
  return new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}
}

async function getStore(storeName: string, mode: IDBTransactionMode = 'readonly') {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put<T>(storeName: string, data: T): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function remove(storeName: string, id: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Templates
export const saveTemplate = (t: AircraftTemplate) => put('templates', t);
export const getTemplates = () => getAll<AircraftTemplate>('templates');
export const getTemplate = (id: string) => getById<AircraftTemplate>('templates', id);
export const deleteTemplate = (id: string) => remove('templates', id);

// Flight Plans
export const saveFlightPlan = (f: FlightPlan) => put('flightPlans', f);
export const getFlightPlans = () => getAll<FlightPlan>('flightPlans');
export const getFlightPlan = (id: string) => getById<FlightPlan>('flightPlans', id);
export const deleteFlightPlan = (id: string) => remove('flightPlans', id);

// Versions
export const saveVersion = (v: FlightVersion) => put('versions', v);
export const getVersions = () => getAll<FlightVersion>('versions');
export const getVersionsByFlight = async (flightPlanId: string): Promise<FlightVersion[]> => {
  const all = await getAll<FlightVersion>('versions');
  return all.filter(v => v.flightPlanId === flightPlanId).sort((a, b) => a.version - b.version);
};

// Cleanup old records (> 1 year)
export async function cleanupOldRecords(): Promise<void> {
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const plans = await getFlightPlans();
  for (const plan of plans) {
    if (plan.createdAt < oneYearAgo) {
      const versions = await getVersionsByFlight(plan.id);
      for (const v of versions) await remove('versions', v.id);
      await remove('flightPlans', plan.id);
    }
  }
}

// Full export
export async function exportAll(): Promise<string> {
  const [templates, flightPlans, versions] = await Promise.all([
    getTemplates(),
    getFlightPlans(),
    getVersions(),
  ]);
  return JSON.stringify({ templates, flightPlans, versions, exportedAt: new Date().toISOString() }, null, 2);
}

// Full import
export async function importAll(jsonStr: string): Promise<void> {
  const data = JSON.parse(jsonStr);
  if (data.templates) for (const t of data.templates) await saveTemplate(t);
  if (data.flightPlans) for (const f of data.flightPlans) await saveFlightPlan(f);
  if (data.versions) for (const v of data.versions) await saveVersion(v);
}
