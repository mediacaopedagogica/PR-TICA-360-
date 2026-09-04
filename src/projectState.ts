import { AppliedMaterials, PlacedObject, Wall } from './types';

export interface ProjectStateSnapshot {
  schemaVersion: 1;
  challengeId: string;
  roomDimensions: { width: number; depth: number; height: number };
  placedObjects: PlacedObject[];
  walls: Wall[];
  appliedMaterials: AppliedMaterials;
  designFee: number;
  savedAt: string;
}

const STORAGE_PREFIX = 'pratica360.project.v1';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export function projectStorageKey(challengeId: string) {
  return `${STORAGE_PREFIX}.${challengeId}`;
}

export function saveProjectSnapshot(snapshot: Omit<ProjectStateSnapshot, 'schemaVersion' | 'savedAt'>) {
  const payload: ProjectStateSnapshot = {
    ...clone(snapshot),
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(projectStorageKey(snapshot.challengeId), JSON.stringify(payload));
  return payload;
}

export function loadProjectSnapshot(challengeId: string): ProjectStateSnapshot | null {
  const raw = localStorage.getItem(projectStorageKey(challengeId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ProjectStateSnapshot;
    if (parsed?.schemaVersion !== 1 || parsed.challengeId !== challengeId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearProjectSnapshot(challengeId: string) {
  localStorage.removeItem(projectStorageKey(challengeId));
}
