import { ID, Slot, Project } from '../types';

export interface Lesson {
  id: string; // unique lesson unit ID
  classId: ID;
  subjectId: ID;
  teacherId: ID;
  isDoublePeriod: boolean;
  part?: 1 | 2; // 1 or 2 for double period blocks
  pairedWithLessonId?: string;
  specialRoomId?: ID;
  preferMorning: boolean;
  maxPerDay: number;
  fixedDay?: number;
  fixedPeriod?: number;
  locked?: boolean;
}

export interface SolverProgress {
  phase: 'init' | 'construction' | 'annealing' | 'repair' | 'done' | 'failed' | 'aborted';
  phaseProgress: number; // 0 to 100
  iterations: number;
  hardConflicts: number;
  softScore: number;
  softTrend: number[];
  temperature?: number;
  runtimeMs: number;
  message?: string;
}

export interface SolverConfig {
  seed: number;
  qualityMode: 'fast' | 'balanced' | 'best';
  selectedClassIds?: ID[];
  maxRuntimeMs?: number;
}

export interface SolverResult {
  success: boolean;
  slots: Slot[];
  hardConflicts: number;
  softScore: number;
  runtimeMs: number;
  seed: number;
  iterations: number;
  unsatisfiableCore?: string[];
}

export interface SolverInput {
  project: Project;
  config: SolverConfig;
  lockedSlots?: Slot[];
}
