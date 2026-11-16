export type ImportTargetEntity = 'staff' | 'subjects' | 'classes' | 'rooms';

export type DetectedFileType = 'xlsx' | 'xls' | 'csv' | 'tsv' | 'unsupported';

export interface ParsedSheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  previewRows: any[][];
}

export interface RawParsedWorkbook {
  fileName: string;
  fileSize: number;
  fileType: DetectedFileType;
  sheets: ParsedSheetInfo[];
  selectedSheetName: string;
  headers: string[];
  rows: any[][]; // 2D array of rows
  headerRowIndex: number;
}

export type StaffFieldKey = 
  | 'name' 
  | 'gender' 
  | 'phone' 
  | 'qualification' 
  | 'subjects' 
  | 'classTeacher' 
  | 'email'
  | 'ignore';

export type SubjectFieldKey = 
  | 'name' 
  | 'code' 
  | 'type' 
  | 'defaultPeriods' 
  | 'doublePeriod' 
  | 'morningPreference' 
  | 'ignore';

export type ClassFieldKey = 
  | 'name' 
  | 'section' 
  | 'strength' 
  | 'roomLabel' 
  | 'ignore';

export interface ColumnMappingItem {
  columnIndex: number;
  headerName: string;
  mappedField: string; // field key or 'ignore'
  confidence: 'exact' | 'high' | 'medium' | 'manual' | 'ignored';
  isSensitive?: boolean;
  sampleValues: string[];
}

export type RowValidationStatus = 'ready' | 'warning' | 'error' | 'duplicate';

export interface CleanedStaffRow {
  rowIndex: number;
  originalData: Record<string, any>;
  status: RowValidationStatus;
  selected: boolean;
  warnings: string[];
  errors: string[];
  // Normalized Staff Attributes
  name: string;
  code: string;
  gender?: string;
  phone?: string;
  email?: string;
  qualification?: string;
  rawSubjectsText: string;
  parsedSubjectNames: string[];
  subjectIds: string[]; // Linked subject IDs
  rawClassTeacherText?: string;
  parsedClassGrade?: string;
  parsedClassSection?: string;
  isDuplicate?: boolean;
  duplicateAction?: 'skip' | 'update' | 'new';
  duplicateMatchReason?: string;
}

export interface CleanedSubjectRow {
  rowIndex: number;
  originalData: Record<string, any>;
  status: RowValidationStatus;
  selected: boolean;
  warnings: string[];
  errors: string[];
  name: string;
  code: string;
  type: 'theory' | 'lab' | 'sports' | 'activity';
  periodsPerWeek: number;
  maxPerDay: number;
  requiresDoublePeriod: boolean;
  isMorningPreferred: boolean;
  color: string;
  isDuplicate?: boolean;
  duplicateAction?: 'skip' | 'update' | 'new';
  duplicateMatchReason?: string;
}

export interface NewSubjectSuggestion {
  tempId: string;
  name: string;
  code: string;
  color: string;
  selected: boolean;
  count: number;
}

export interface ImportExecutionResult {
  success: boolean;
  createdStaffCount: number;
  updatedStaffCount: number;
  skippedStaffCount: number;
  createdSubjectsCount: number;
  createdClassesCount: number;
  reportRows: {
    rowNumber: number;
    name: string;
    status: string;
    reason: string;
  }[];
  rollbackData?: {
    createdTeacherIds: string[];
    createdSubjectIds: string[];
    createdClassIds: string[];
  };
}
