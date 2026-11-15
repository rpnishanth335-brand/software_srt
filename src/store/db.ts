import Dexie, { type EntityTable } from 'dexie';
import { Project } from '../types';

export class ChronoForgeDatabase extends Dexie {
  projects!: EntityTable<Project, 'id'>;

  constructor() {
    super('ChronoForgeDB');
    this.version(1).stores({
      projects: 'id, updatedAt, school.name',
    });
    // Version 2: Index projects by userId for per-user isolation
    this.version(2).stores({
      projects: 'id, userId, updatedAt, school.name',
    }).upgrade(tx => {
      return tx.table('projects').toCollection().modify(project => {
        if (!project.userId) {
          project.userId = 'demo_administrator_uid';
        }
      });
    });
  }
}

export const db = new ChronoForgeDatabase();

export const isIndexedDBAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
};

/**
 * Persist a complete project to IndexedDB, namespaced by user uid.
 */
export async function saveProjectToDB(project: Project, userId?: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    await db.projects.put({
      ...project,
      userId: userId || project.userId || 'demo_administrator_uid',
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
 * List all saved projects in IndexedDB, optionally filtered by userId.
 */
export async function listSavedProjects(userId?: string): Promise<Project[]> {
  if (!isIndexedDBAvailable()) return [];
  try {
    if (userId) {
      return await db.projects.where('userId').equals(userId).reverse().sortBy('updatedAt');
    }
    return await db.projects.orderBy('updatedAt').reverse().toArray();
  } catch {
    return [];
  }
}

/**
 * Delete a saved project from IndexedDB.
 */
export async function deleteProjectFromDB(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    await db.projects.delete(id);
  } catch (e) {
    console.warn('IndexedDB delete skipped:', e);
  }
}
