import Dexie, { type EntityTable } from 'dexie';
import { Project } from '../types';

export class ChronoForgeDatabase extends Dexie {
  projects!: EntityTable<Project, 'id'>;

  constructor() {
    super('ChronoForgeDB');
    this.version(1).stores({
      projects: 'id, updatedAt, school.name',
    });
  }
}

export const db = new ChronoForgeDatabase();

export const isIndexedDBAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
};

/**
 * Persist a complete project to IndexedDB.
 */
export async function saveProjectToDB(project: Project): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    await db.projects.put({
      ...project,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.warn('IndexedDB save skipped:', e);
  }
}

/**
 * Retrieve a project by ID from IndexedDB.
 */
export async function loadProjectFromDB(id: string): Promise<Project | undefined> {
  if (!isIndexedDBAvailable()) return undefined;
  try {
    return await db.projects.get(id);
  } catch {
    return undefined;
  }
}

/**
 * List all saved projects in IndexedDB, sorted by most recently updated.
 */
export async function listSavedProjects(): Promise<Project[]> {
  if (!isIndexedDBAvailable()) return [];
  try {
    return await db.projects.orderBy('updatedAt').reverse().toArray();
  } catch {
    return [];
  }
}

/**
 * Delete a project from IndexedDB.
 */
export async function deleteProjectFromDB(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    await db.projects.delete(id);
  } catch (e) {
    console.warn('IndexedDB delete skipped:', e);
  }
}
