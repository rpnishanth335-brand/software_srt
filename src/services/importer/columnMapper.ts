import { ColumnMappingItem, ImportTargetEntity, StaffFieldKey, SubjectFieldKey, ClassFieldKey } from './types';

// Sensitive keywords to auto-ignore and safeguard
const SENSITIVE_KEYWORDS = ['password', 'pwd', 'passcode', 'secret', 'pin', 'credentials'];

// Staff field synonyms dictionary
const STAFF_SYNONYMS: Record<StaffFieldKey, string[]> = {
  name: [
    'name', 'teacher name', 'staff', 'full name', 'faculty', 'staff name', 
    'employee name', 'teacher', 'name of the staff', 'faculty name'
  ],
  gender: ['gender', 'sex'],
  phone: [
    'phone', 'phone number', 'mobile', 'mobile number', 'contact', 
    'contact number', 'cell', 'cell number', 'contact no', 'whatsapp', 'phone no'
  ],
  qualification: [
    'qualification', 'degree', 'education', 'educational qualification', 'degrees'
  ],
  subjects: [
    'subject', 'subjects', 'handling subject', 'handling subjects', 'teaches', 
    'subject handled', 'subjects handled', 'subject name', 'curriculum', 'subjects taught'
  ],
  classTeacher: [
    'class teacher', 'class in-charge', 'incharge', 'class coordinator', 
    'class in charge', 'class teacher of', 'class handling', 'in-charge'
  ],
  email: [
    'sign in with google mail id', 'gmail', 'email', 'email address', 
    'mail id', 'google id', 'mail', 'e-mail'
  ],
  ignore: ['timestamp', 'created at', 'submission date', 'id', 's.no', 's no', 'sl no'],
};

// Subjects field synonyms dictionary
const SUBJECT_SYNONYMS: Record<SubjectFieldKey, string[]> = {
  name: ['subject name', 'subject', 'title', 'name', 'course name', 'course'],
  code: ['code', 'short code', 'abbreviation', 'sub code', 'subject code'],
  type: ['type', 'category', 'theory / lab', 'subject type'],
  defaultPeriods: ['default periods', 'periods/wk', 'periods per week', 'weekly periods', 'periods', 'default periods/week'],
  doublePeriod: ['double period', 'requires double', 'block period', 'is double period'],
  morningPreference: ['morning preference', 'prefer morning', 'morning slot', 'is morning preferred'],
  ignore: ['s.no', 's no', 'sl no', 'id'],
};

// Classes field synonyms dictionary
const CLASS_SYNONYMS: Record<ClassFieldKey, string[]> = {
  name: ['grade', 'standard', 'class', 'class name', 'cohort', 'standard/grade'],
  section: ['section', 'sec', 'division', 'group'],
  strength: ['strength', 'students', 'student count', 'capacity', 'total students'],
  roomLabel: ['room', 'room number', 'room label', 'classroom', 'allocated room'],
  ignore: ['s.no', 's no', 'sl no', 'id'],
};

/**
 * Normalizes header string by lowercasing and stripping punctuation.
 */
function cleanHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[_\-./\\#*():]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tests if header is sensitive (passwords, PINs, etc.).
 */
export function isSensitiveColumn(rawHeader: string): boolean {
  const cleaned = cleanHeader(rawHeader);
  return SENSITIVE_KEYWORDS.some((kw) => cleaned.includes(kw));
}

/**
 * Automatically creates column mappings based on headers and sample row values.
 */
export function autoMapColumns(
  headers: string[],
  sampleRows: any[][],
  entity: ImportTargetEntity
): ColumnMappingItem[] {
  const savedMappings = getSavedMapping(entity);

  return headers.map((rawHeader, colIdx) => {
    const cleaned = cleanHeader(rawHeader);
    const samples = sampleRows
      .slice(0, 5)
      .map((r) => String(r[colIdx] ?? '').trim())
      .filter((v) => v.length > 0);

    // 1. Critical Security Shield: Check for Sensitive Columns (Passwords, PINs)
    if (isSensitiveColumn(rawHeader)) {
      return {
        columnIndex: colIdx,
        headerName: rawHeader,
        mappedField: 'ignore',
        confidence: 'ignored',
        isSensitive: true,
        sampleValues: ['[REDACTED SENSITIVE DATA]'],
      };
    }

    // 2. Check if user previously saved a manual mapping for this exact header
    if (savedMappings[rawHeader]) {
      return {
        columnIndex: colIdx,
        headerName: rawHeader,
        mappedField: savedMappings[rawHeader],
        confidence: 'high',
        isSensitive: false,
        sampleValues: samples.slice(0, 3),
      };
    }

    // 3. Match against synonyms dictionary
    let matchedField = 'ignore';
    let confidence: ColumnMappingItem['confidence'] = 'manual';

    if (entity === 'staff') {
      matchedField = findBestMatch(cleaned, samples, STAFF_SYNONYMS);
    } else if (entity === 'subjects') {
      matchedField = findBestMatch(cleaned, samples, SUBJECT_SYNONYMS);
    } else if (entity === 'classes') {
      matchedField = findBestMatch(cleaned, samples, CLASS_SYNONYMS);
    }

    if (matchedField !== 'ignore') {
      confidence = 'high';
    }

    // Special fallback for email: If sample values contain '@', check if it could be email
    if (entity === 'staff' && matchedField === 'ignore') {
      const looksLikeEmail = samples.some((s) => s.includes('@') && s.includes('.'));
      if (looksLikeEmail && (cleaned.includes('id') || cleaned.includes('user') || cleaned.includes('account'))) {
        matchedField = 'email';
        confidence = 'medium';
      }
    }

    return {
      columnIndex: colIdx,
      headerName: rawHeader,
      mappedField: matchedField,
      confidence,
      isSensitive: false,
      sampleValues: samples.slice(0, 3),
    };
  });
}

function findBestMatch(
  cleanedHeader: string,
  _samples: string[],
  synonyms: Record<string, string[]>
): string {
  // Exact match
  for (const [field, synList] of Object.entries(synonyms)) {
    if (synList.includes(cleanedHeader)) {
      return field;
    }
  }

  // Substring match
  for (const [field, synList] of Object.entries(synonyms)) {
    for (const syn of synList) {
      if (cleanedHeader.includes(syn) || syn.includes(cleanedHeader)) {
        return field;
      }
    }
  }

  return 'ignore';
}

/**
 * Storage key for persisting user column mappings.
 */
function getStorageKey(entity: ImportTargetEntity): string {
  return `chronoforge_import_mapping_${entity}`;
}

export function saveUserMapping(entity: ImportTargetEntity, mappings: ColumnMappingItem[]): void {
  try {
    const mapObj: Record<string, string> = {};
    for (const item of mappings) {
      if (!item.isSensitive && item.mappedField !== 'ignore') {
        mapObj[item.headerName] = item.mappedField;
      }
    }
    localStorage.setItem(getStorageKey(entity), JSON.stringify(mapObj));
  } catch (e) {
    console.warn('Could not save column mapping to localStorage:', e);
  }
}

export function getSavedMapping(entity: ImportTargetEntity): Record<string, string> {
  try {
    const raw = localStorage.getItem(getStorageKey(entity));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
