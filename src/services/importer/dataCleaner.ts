import { Subject, Teacher } from '../../types';
import { CleanedStaffRow, ColumnMappingItem, NewSubjectSuggestion } from './types';

// Preset colors palette for auto-generated subjects
const SUBJECT_COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#eab308', '#6366f1', '#14b8a6', '#f43f5e'
];

// Spelling normalization dictionary for standard curriculum subjects
const SUBJECT_CANONICAL_MAP: Record<string, string> = {
  'mathamatics': 'Mathematics',
  'maths': 'Mathematics',
  'math': 'Mathematics',
  'mathematics': 'Mathematics',
  'science': 'Science',
  'social science': 'Social Science',
  'social': 'Social Science',
  'sst': 'Social Science',
  'tamil': 'Tamil',
  'english': 'English',
  'hindi': 'Hindi',
  'computer': 'Computer Science',
  'computer science': 'Computer Science',
  'cs': 'Computer Science',
  'physics': 'Physics',
  'chemistry': 'Chemistry',
  'biology': 'Biology',
  'accountancy': 'Accountancy',
  'accounts': 'Accountancy',
  'commerce': 'Commerce',
  'economics': 'Economics',
  'pt': 'Physical Education',
  'pet': 'Physical Education',
  'physical education': 'Physical Education',
  'art': 'Art',
  'library': 'Library',
};

/**
 * Checks if a value is a placeholder like "None", "-", "N/A", "Nil".
 */
export function isPlaceholder(val: any): boolean {
  if (val === null || val === undefined) return true;
  const s = String(val).trim().toLowerCase();
  return s === '' || s === '-' || s === '--' || s === 'none' || s === 'n/a' || s === 'na' || s === 'nil';
}

/**
 * Cleans and normalizes personal names.
 * Collapses whitespace, removes stray double dots ("GAYATHRI. .P" -> "Gayathri P", "K.divya" -> "K. Divya").
 * Preserves Tamil and Hindi characters without deformation.
 */
export function cleanPersonName(raw: string): string {
  if (isPlaceholder(raw)) return '';

  let s = String(raw).trim();

  // If text contains dot followed immediately by a letter without space: "K.divya" -> "K. Divya"
  s = s.replace(/\b([A-Za-z])\.([A-Za-z])/g, '$1. $2');

  // Strip stray dots on multi-letter words ("GAYATHRI." -> "GAYATHRI", but keep "Dr." or "Mr.")
  s = s.replace(/([A-Za-z]{3,})\.+/g, '$1');

  // Remove stray standalone dots or double dots (" . " -> " ", ".." -> ".")
  s = s.replace(/\s+\.+\s+/g, ' ');
  s = s.replace(/\.{2,}/g, '.');

  // Strip leading dots or trailing dots on words: ".P" -> "P"
  s = s.replace(/(?<=\s)\.([A-Za-z])/g, '$1');
  s = s.replace(/^\.([A-Za-z])/g, '$1');

  // Strip trailing stray dots
  s = s.replace(/\s*\.+$/g, '').trim();

  // Word capitalization & initial preservation
  s = s
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      // Handle titles like Dr., Prof., Mr., Mrs.
      if (/^(dr|mr|mrs|ms|prof)\.?$/i.test(lower)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1).replace(/\./g, '') + '.';
      }
      // Check if word is an initial like "K." or "S."
      if (/^[A-Za-z]\.$/.test(word)) {
        return word.toUpperCase();
      }
      if (/^[A-Za-z]$/.test(word)) {
        return word.toUpperCase();
      }
      const cleanWord = word.replace(/\./g, '').trim();
      if (cleanWord.length === 0) return '';
      return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
    })
    .filter((w) => w.length > 0)
    .join(' ');

  return s.trim();
}

/**
 * Normalizes phone numbers: handles scientific notation ("9.84012E+09"),
 * strips "+91", hyphens, spaces, and validates 10 digits.
 */
export function cleanPhoneNumber(raw: any): { phone: string; isValid: boolean } {
  if (isPlaceholder(raw)) return { phone: '', isValid: true };

  let s = String(raw).trim();

  // Handle scientific notation from Excel (e.g. 9.84012E+09)
  if (/[eE][+-]?\d+/.test(s)) {
    const num = parseFloat(s);
    if (!isNaN(num)) {
      s = Math.round(num).toString();
    }
  }

  // Strip non-digit characters
  let digits = s.replace(/\D/g, '');

  // Strip country code 91 if 12 digits starting with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  const isValid = digits.length === 10;
  return { phone: digits, isValid };
}

/**
 * Normalizes email address.
 */
export function cleanEmail(raw: any): { email: string; isValid: boolean } {
  if (isPlaceholder(raw)) return { email: '', isValid: true };

  const s = String(raw).trim().toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  return { email: s, isValid };
}

/**
 * Splits multi-subject strings into distinct subjects.
 * Example: "Tamil, English, Mathamatics, Science, Social Science" -> 5 subjects
 */
export function splitAndNormalizeSubjects(raw: any): string[] {
  if (isPlaceholder(raw)) return [];

  const text = String(raw);

  // Split on comma, semicolon, slash, '&', 'and', newline
  const parts = text
    .split(/[,;\n/]|(?:\s+and\s+)|\s*&\s*/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !isPlaceholder(p));

  const result: string[] = [];

  for (const part of parts) {
    const key = part.toLowerCase();
    const normalized = SUBJECT_CANONICAL_MAP[key] || capitalizeWords(part);
    if (!result.includes(normalized)) {
      result.push(normalized);
    }
  }

  return result;
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Parses class teacher string variants:
 * "class 1 - section A" -> { grade: "1", section: "A" }
 * "Class 9 -section C"  -> { grade: "9", section: "C" }
 * "LKG", "Ukg"          -> { grade: "LKG", section: "" }
 * "Accounts assistant"  -> { isClass: false, warning: "Not a class (skipped)" }
 */
export function parseClassTeacherString(raw: any): {
  grade?: string;
  section?: string;
  isClass: boolean;
  warning?: string;
} {
  if (isPlaceholder(raw)) {
    return { isClass: false };
  }

  const text = String(raw).trim();

  // Pattern 1: LKG / UKG / Pre-KG
  if (/^(pre-?kg|lkg|ukg|nursery|kindergarten)$/i.test(text)) {
    return { grade: text.toUpperCase(), section: '', isClass: true };
  }

  // Pattern 2: "class 1 - section A" or "Grade 10 - Sec B" or "10-A" or "Class 9 -section C"
  const match1 = text.match(/(?:class|grade|std)?\s*(\d{1,2}|lkg|ukg)\s*[-–/]\s*(?:section|sec)?\s*([a-zA-Z])/i);
  if (match1) {
    return {
      grade: match1[1].trim(),
      section: match1[2].toUpperCase().trim(),
      isClass: true,
    };
  }

  // Pattern 3: Simple "Class 8" or "Grade 12"
  const match2 = text.match(/^(?:class|grade|std)\s*(\d{1,2}|lkg|ukg)$/i);
  if (match2) {
    return { grade: match2[1].trim(), section: '', isClass: true };
  }

  // Non-class roles (e.g. "Accounts assistant", "Office", "Admin")
  return {
    isClass: false,
    warning: `"${text}" is not a recognized class format (skipped).`,
  };
}

/**
 * Generates a short uppercase unique code for a person or subject.
 */
export function generateShortCode(name: string, existingCodes: string[]): string {
  const parts = name.split(/\s+/).filter((p) => p.length > 0);
  let baseCode = '';

  if (parts.length >= 2) {
    baseCode = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (name.length >= 2) {
    baseCode = name.slice(0, 3).toUpperCase();
  } else {
    baseCode = (name + 'X').toUpperCase();
  }

  // If code collision occurs, append counter
  let finalCode = baseCode;
  let counter = 1;
  while (existingCodes.includes(finalCode)) {
    finalCode = `${baseCode}${counter}`;
    counter++;
  }

  return finalCode;
}

/**
 * Cleans all imported staff rows and performs validation & duplicate analysis.
 */
export function cleanAndValidateStaffRows(
  rows: any[][],
  mappings: ColumnMappingItem[],
  existingTeachers: Teacher[],
  existingSubjects: Subject[]
): {
  cleanedRows: CleanedStaffRow[];
  newSubjectSuggestions: NewSubjectSuggestion[];
} {
  const fieldToColIdx: Record<string, number> = {};
  for (const m of mappings) {
    if (m.mappedField !== 'ignore') {
      fieldToColIdx[m.mappedField] = m.columnIndex;
    }
  }

  const existingCodes = existingTeachers.map((t) => t.code);
  const existingNamesLower = existingTeachers.map((t) => t.name.toLowerCase().trim());
  const existingPhones = existingTeachers.map((t) => (t.phone || '').trim()).filter((p) => p.length > 0);
  const existingEmails = existingTeachers.map((t) => (t.email || '').toLowerCase().trim()).filter((e) => e.length > 0);

  const newSubjectsMap = new Map<string, number>();
  const cleanedRows: CleanedStaffRow[] = [];

  rows.forEach((row, rowIdx) => {
    const rawName = fieldToColIdx.name !== undefined ? row[fieldToColIdx.name] : '';
    const rawGender = fieldToColIdx.gender !== undefined ? row[fieldToColIdx.gender] : '';
    const rawPhone = fieldToColIdx.phone !== undefined ? row[fieldToColIdx.phone] : '';
    const rawEmail = fieldToColIdx.email !== undefined ? row[fieldToColIdx.email] : '';
    const rawQual = fieldToColIdx.qualification !== undefined ? row[fieldToColIdx.qualification] : '';
    const rawSubs = fieldToColIdx.subjects !== undefined ? row[fieldToColIdx.subjects] : '';
    const rawClassTeacher = fieldToColIdx.classTeacher !== undefined ? row[fieldToColIdx.classTeacher] : '';

    const name = cleanPersonName(rawName);
    const { phone, isValid: isPhoneValid } = cleanPhoneNumber(rawPhone);
    const { email, isValid: isEmailValid } = cleanEmail(rawEmail);
    const parsedSubjectNames = splitAndNormalizeSubjects(rawSubs);
    const classTeacherResult = parseClassTeacherString(rawClassTeacher);

    const warnings: string[] = [];
    const errors: string[] = [];

    // Validation
    if (!name) {
      errors.push('Missing staff name.');
    }

    if (rawPhone && !isPhoneValid) {
      warnings.push(`Phone number "${rawPhone}" is not a standard 10-digit number.`);
    }

    if (rawEmail && !isEmailValid) {
      warnings.push(`Email "${rawEmail}" format is invalid.`);
    }

    if (parsedSubjectNames.length === 0) {
      warnings.push('No subjects assigned. Can be configured later.');
    }

    if (classTeacherResult.warning) {
      warnings.push(classTeacherResult.warning);
    }

    // Identify which subjects are new vs existing
    const linkedSubjectIds: string[] = [];
    for (const subName of parsedSubjectNames) {
      const match = existingSubjects.find(
        (s) => s.name.toLowerCase() === subName.toLowerCase() || s.code.toLowerCase() === subName.toLowerCase()
      );
      if (match) {
        linkedSubjectIds.push(match.id);
      } else {
        newSubjectsMap.set(subName, (newSubjectsMap.get(subName) || 0) + 1);
      }
    }

    // Duplicate detection
    let isDuplicate = false;
    let duplicateMatchReason = '';

    if (name && existingNamesLower.includes(name.toLowerCase())) {
      isDuplicate = true;
      duplicateMatchReason = 'Matches existing teacher name';
    } else if (phone && existingPhones.includes(phone)) {
      isDuplicate = true;
      duplicateMatchReason = 'Matches existing phone number';
    } else if (email && existingEmails.includes(email)) {
      isDuplicate = true;
      duplicateMatchReason = 'Matches existing email address';
    }

    const code = generateShortCode(name || 'Staff', existingCodes);
    existingCodes.push(code);

    let status: CleanedStaffRow['status'] = 'ready';
    if (errors.length > 0) status = 'error';
    else if (isDuplicate) status = 'duplicate';
    else if (warnings.length > 0) status = 'warning';

    cleanedRows.push({
      rowIndex: rowIdx + 1,
      originalData: { name: rawName, phone: rawPhone, email: rawEmail, subjects: rawSubs, classTeacher: rawClassTeacher },
      status,
      selected: errors.length === 0,
      warnings,
      errors,
      name,
      code,
      gender: String(rawGender || '').trim(),
      phone,
      email,
      qualification: String(rawQual || '').trim(),
      rawSubjectsText: String(rawSubs || ''),
      parsedSubjectNames,
      subjectIds: linkedSubjectIds,
      rawClassTeacherText: String(rawClassTeacher || ''),
      parsedClassGrade: classTeacherResult.grade,
      parsedClassSection: classTeacherResult.section,
      isDuplicate,
      duplicateAction: isDuplicate ? 'skip' : undefined,
      duplicateMatchReason,
    });
  });

  // Prepare auto-creation list for new subjects
  const existingSubCodes = existingSubjects.map((s) => s.code);
  const newSubjectSuggestions: NewSubjectSuggestion[] = Array.from(newSubjectsMap.entries()).map(([subName, count], idx) => {
    const code = generateShortCode(subName, existingSubCodes);
    existingSubCodes.push(code);
    return {
      tempId: `new_sub_${idx}`,
      name: subName,
      code,
      color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
      selected: true,
      count,
    };
  });

  return { cleanedRows, newSubjectSuggestions };
}

/**
 * Checks whether an existing teacher record in the database is corrupted
 * (e.g., from a prior buggy binary import that read .xlsx as raw text).
 */
export function isCorruptedStaffRecord(teacher: Teacher): boolean {
  const name = teacher.name || '';
  const code = teacher.code || '';

  // 1. Unicode replacement char or control characters
  if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(name) || /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(code)) {
    return true;
  }

  // 2. Excel OOXML / ZIP archive header signatures
  if (/^(PK|KK)/i.test(name) || /^(PK|KK)/i.test(code)) {
    return true;
  }

  // 3. XML filenames from OOXML zip parts
  if (
    /sharedstrings\.xml|content_types|\.xml|\.rels|workbook\.xml|styles\.xml/i.test(name) ||
    /sharedstrings\.xml|content_types|\.xml|\.rels|workbook\.xml|styles\.xml/i.test(code)
  ) {
    return true;
  }

  // 4. Repeated question mark artifact patterns like ""
  if (/\uFFFD{2,}|[?]{3,}/.test(name) || /\uFFFD{2,}|[?]{3,}/.test(code)) {
    return true;
  }

  return false;
}

/**
 * Normalizes and validates rows for direct Subject catalog import.
 */
export function cleanAndValidateSubjectRows(
  rows: any[][],
  mappings: ColumnMappingItem[],
  existingSubjects: Subject[]
): {
  cleanedRows: import('./types').CleanedSubjectRow[];
} {
  const existingNamesLower = existingSubjects.map((s) => s.name.toLowerCase().trim());
  const existingCodes = existingSubjects.map((s) => s.code.toUpperCase().trim());

  const cleanedRows: import('./types').CleanedSubjectRow[] = [];

  rows.forEach((row, rowIdx) => {
    let rawName = '';
    let rawCode = '';
    let rawType = '';
    let rawPeriods = '';
    let rawDouble = '';
    let rawMorning = '';

    mappings.forEach((m) => {
      const val = row[m.columnIndex];
      if (m.mappedField === 'name') rawName = val;
      if (m.mappedField === 'code') rawCode = val;
      if (m.mappedField === 'type') rawType = val;
      if (m.mappedField === 'defaultPeriods') rawPeriods = val;
      if (m.mappedField === 'doublePeriod') rawDouble = val;
      if (m.mappedField === 'morningPreference') rawMorning = val;
    });

    const name = cleanPersonName(rawName) || String(rawName || '').trim();
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!name) {
      errors.push('Subject name is required.');
    }

    let code = String(rawCode || '').trim().toUpperCase();
    if (!code && name) {
      code = generateShortCode(name, existingCodes);
    }
    existingCodes.push(code);

    let type: Subject['type'] = 'theory';
    const lowerType = String(rawType || '').toLowerCase();
    if (lowerType.includes('lab') || lowerType.includes('prac')) type = 'lab';
    else if (lowerType.includes('sport') || lowerType.includes('pt') || lowerType.includes('pe')) type = 'sports';
    else if (lowerType.includes('act') || lowerType.includes('lib') || lowerType.includes('art')) type = 'activity';

    const periods = parseInt(String(rawPeriods || ''), 10);
    const periodsPerWeek = !isNaN(periods) && periods >= 1 && periods <= 15 ? periods : 5;

    const lowerDouble = String(rawDouble || '').toLowerCase();
    const requiresDoublePeriod = lowerDouble.includes('yes') || lowerDouble.includes('true') || lowerDouble === '1';

    const lowerMorning = String(rawMorning || '').toLowerCase();
    const isMorningPreferred = lowerMorning.includes('yes') || lowerMorning.includes('true') || lowerMorning === '1';

    let isDuplicate = false;
    let duplicateMatchReason = '';
    if (name && existingNamesLower.includes(name.toLowerCase())) {
      isDuplicate = true;
      duplicateMatchReason = 'Matches existing subject name';
    }

    let status: import('./types').RowValidationStatus = 'ready';
    if (errors.length > 0) status = 'error';
    else if (isDuplicate) status = 'duplicate';
    else if (warnings.length > 0) status = 'warning';

    cleanedRows.push({
      rowIndex: rowIdx + 1,
      originalData: { name: rawName, code: rawCode, type: rawType },
      status,
      selected: errors.length === 0,
      warnings,
      errors,
      name,
      code,
      type,
      periodsPerWeek,
      maxPerDay: 2,
      requiresDoublePeriod,
      isMorningPreferred,
      color: SUBJECT_COLORS[rowIdx % SUBJECT_COLORS.length],
      isDuplicate,
      duplicateAction: isDuplicate ? 'skip' : undefined,
      duplicateMatchReason,
    });
  });

  return { cleanedRows };
}

