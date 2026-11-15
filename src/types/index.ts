export type ID = string;

export interface DayPeriod {
  day: number;
  period: number;
}

export interface School {
  name: string;
  year: string;
  academicYear?: string;
  logo?: string; // base64 or URL
  logoUrl?: string;
  days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  workingDays?: number[];
  periodsByDay: Record<number, number>; // day -> period count
  periodsPerDay?: number;
  periodTimes: PeriodTime[];
  breaks: Break[];
}

export interface PeriodTime {
  period: number;
  startTime: string; // "08:30"
  endTime: string;   // "09:15"
  durationMinutes: number;
}

export interface Break {
  id: ID;
  name: string; // "Recess", "Lunch"
  afterPeriod: number; // break occurs after this period
  durationMinutes: number;
}

export interface Room {
  id: ID;
  name: string;
  number: string;
  code?: string;
  type: 'classroom' | 'lab' | 'sports' | 'auditorium' | 'ground' | 'other';
  capacity: number;
  building?: string;
}

export interface ClassRoom {
  id: ID;
  name: string;      // e.g. "Grade 10"
  section: string;   // e.g. "A"
  selected: boolean; // whether included in generation
  room?: string;
  roomId?: ID;
  classTeacherId?: ID;
  strength?: number;
}

export interface Subject {
  id: ID;
  name: string;
  code: string;
  color: string;
  type: 'theory' | 'lab' | 'sports' | 'activity';
  doublePeriod: boolean;
  maxPerDay: number;
  preferMorning: boolean;
  specialRoomId?: ID;
}

export interface Teacher {
  id: ID;
  name: string;
  code: string;
  employeeId?: string;
  email?: string;
  phone?: string;
  subjectIds: ID[];
  classIds: ID[];
  maxPerDay: number;
  maxPerWeek: number;
  maxConsecutive: number;
  blocked: Array<{ day: number; period: number }>;
  preferredOffDay?: number;
}

export interface Assignment {
  classId: ID;
  subjectId: ID;
  teacherId: ID;
  periodsPerWeek: number;
}

export interface Slot {
  id?: string;
  classId: ID;
  day: number;
  period: number;
  subjectId: ID | null;
  teacherId: ID | null;
  locked: boolean;
  isDoublePeriodPart?: 1 | 2;
}

export interface TimetableVersion {
  id: ID;
  name?: string;
  createdAt: number;
  seed: number;
  qualityMode: 'fast' | 'balanced' | 'best';
  slots: Slot[];
  hardConflicts: number;
  softScore: number;
  runtimeMs: number;
  metadata?: {
    runtimeMs?: number;
    iterations?: number;
    seed?: number;
  };
}

export interface RuleConfig {
  hardRules: {
    noTeacherClash: boolean;
    noClassClash: boolean;
    respectTeacherBlocked: boolean;
    respectMaxPerDay: boolean;
    respectMaxPerWeek: boolean;
    doublePeriodsConsecutive: boolean;
    doublePeriodsNoBreakCrossing: boolean;
    specialRoomClash: boolean;
  };
  softWeights: {
    spreadSubjectEvenly?: number;       // 0 - 100
    heavySubjectsMorning?: number;      // 0 - 100
    minimizeTeacherGaps?: number;       // 0 - 100
    limitConsecutiveTeacher?: number;   // 0 - 100
    consistentSubjectPeriod?: number;   // 0 - 100
    avoidEdgePeriodsTeacher?: number;   // 0 - 100
    sportsActivityLastPeriods?: number; // 0 - 100
    spreadSubjects?: number;
    preferMorningForCore?: number;
    respectPreferredOffDay?: number;
    balanceDailyLoad?: number;
    respectRoomCapacity?: number;
    [key: string]: number | undefined;
  };
  allowFreePeriods: boolean;
  maxFreePeriodsPerClass: number;
}

export interface Project {
  id: ID;
  school: School;
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  assignments: Assignment[];
  rules: RuleConfig;
  timetables: TimetableVersion[];
  currentVersionId?: ID;
  updatedAt: number;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

export type AppRoute =
  | 'dashboard'
  | 'school'
  | 'school-settings'
  | 'classes'
  | 'subjects'
  | 'staff'
  | 'rooms'
  | 'assignments'
  | 'rules'
  | 'feasibility'
  | 'generate'
  | 'viewer'
  | 'export'
  | 'settings';

export interface DiagnosticItem {
  id: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  affected: string[];
  suggestion?: string;
}

export interface FeasibilityResult {
  isFeasible: boolean;
  blockingErrors: DiagnosticItem[];
  warnings: DiagnosticItem[];
  suggestions: DiagnosticItem[];
  totalSlotsPerClass: Record<ID, number>;
  totalRequiredPerClass: Record<ID, number>;
  teacherLoadMap: Record<ID, { required: number; max: number; available: number }>;
}
