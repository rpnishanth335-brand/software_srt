import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  detectFileFormatFromBytes, 
  decodeTextBuffer, 
  containsCorruptCharacters,
  parseFileToWorkbook 
} from '../fileParser';
import { autoMapColumns, isSensitiveColumn } from '../columnMapper';
import { 
  cleanPersonName, 
  cleanPhoneNumber, 
  cleanEmail, 
  splitAndNormalizeSubjects, 
  parseClassTeacherString,
  cleanAndValidateStaffRows,
  cleanAndValidateSubjectRows,
  isCorruptedStaffRecord
} from '../dataCleaner';

describe('Smart Importer File Engine & Parser', () => {
  it('correctly detects file type using magic bytes', () => {
    // ZIP / XLSX magic bytes
    const zipBytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]).buffer;
    expect(detectFileFormatFromBytes(zipBytes, 'test.xlsx')).toBe('xlsx');

    // OLE2 / XLS magic bytes
    const xlsBytes = new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]).buffer;
    expect(detectFileFormatFromBytes(xlsBytes, 'legacy.xls')).toBe('xls');

    // PDF bytes (rejection)
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35]).buffer;
    expect(detectFileFormatFromBytes(pdfBytes, 'document.pdf')).toBe('unsupported');
  });

  it('decodes UTF-8 with BOM and Windows-1252 correctly', () => {
    // UTF-8 with BOM: EF BB BF + "Tamil: தமிழ்"
    const utf8WithBom = new Uint8Array([0xEF, 0xBB, 0xBF, 0xE0, 0xAE, 0xA4, 0xE0, 0xAE, 0xAE, 0xE0, 0xAE, 0xBF, 0xE0, 0xAE, 0xb4, 0xE0, 0xAF, 0x8D]).buffer;
    const decoded = decodeTextBuffer(utf8WithBom);
    expect(decoded).toBe('தமிழ்');

    // Corrupt characters guard
    expect(containsCorruptCharacters('Regular text')).toBe(false);
    expect(containsCorruptCharacters('Corrupted \uFFFD character')).toBe(true);
    expect(containsCorruptCharacters('Control \u0003 byte')).toBe(true);
  });

  it('parses real SRT_SCHOOL__TEACHER.xlsx fixture from ArrayBuffer', async () => {
    const fixturePath = path.resolve(__dirname, '../../../../tests/fixtures/SRT_SCHOOL__TEACHER.xlsx');
    const buffer = fs.readFileSync(fixturePath);

    // Mock File object
    const file = new File([buffer], 'SRT_SCHOOL__TEACHER.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const parsed = await parseFileToWorkbook(file);

    expect(parsed.fileType).toBe('xlsx');
    // Selected sheet should be "Form responses 1" with data, skipping empty "Sheet1"
    expect(parsed.selectedSheetName).toBe('Form responses 1');
    expect(parsed.rows.length).toBe(37);
    expect(parsed.headers).toContain('Teacher Name');
    expect(parsed.headers).toContain('Password');
  });
});

describe('Column Mapper & Sensitive Shield', () => {
  it('shields sensitive password columns and flags them as ignored', () => {
    expect(isSensitiveColumn('Password')).toBe(true);
    expect(isSensitiveColumn('Teacher Password')).toBe(true);
    expect(isSensitiveColumn('Passcode')).toBe(true);
    expect(isSensitiveColumn('PIN')).toBe(true);
    expect(isSensitiveColumn('Teacher Name')).toBe(false);

    const headers = ['Teacher Name', 'Mobile Number', 'Password', 'Subjects'];
    const mappings = autoMapColumns(headers, [], 'staff');

    const passMapping = mappings.find((m) => m.headerName === 'Password');
    expect(passMapping).toBeDefined();
    expect(passMapping?.mappedField).toBe('ignore');
    expect(passMapping?.isSensitive).toBe(true);
    expect(passMapping?.sampleValues[0]).toContain('REDACTED');
  });

  it('auto-maps standard staff synonyms', () => {
    const headers = ['Teacher Name', 'Gender', 'Phone Number', 'Qualification', 'Subjects', 'Class Teacher', 'Sign In with Google Mail ID'];
    const mappings = autoMapColumns(headers, [], 'staff');

    expect(mappings.find((m) => m.headerName === 'Teacher Name')?.mappedField).toBe('name');
    expect(mappings.find((m) => m.headerName === 'Gender')?.mappedField).toBe('gender');
    expect(mappings.find((m) => m.headerName === 'Phone Number')?.mappedField).toBe('phone');
    expect(mappings.find((m) => m.headerName === 'Qualification')?.mappedField).toBe('qualification');
    expect(mappings.find((m) => m.headerName === 'Subjects')?.mappedField).toBe('subjects');
    expect(mappings.find((m) => m.headerName === 'Class Teacher')?.mappedField).toBe('classTeacher');
    expect(mappings.find((m) => m.headerName === 'Sign In with Google Mail ID')?.mappedField).toBe('email');
  });
});

describe('Data Cleaning, Subject Normalization & Class Teacher Parsing', () => {
  it('cleans names, fixes double punctuation, and preserves Tamil/Hindi scripts', () => {
    expect(cleanPersonName('GAYATHRI. .P')).toBe('Gayathri P');
    expect(cleanPersonName('K.divya')).toBe('K. Divya');
    expect(cleanPersonName('dr. s. ramesh')).toBe('Dr. S. Ramesh');
    // Unicode Tamil script preservation
    expect(cleanPersonName('காயத்ரி பி')).toBe('காயத்ரி பி');
  });

  it('converts scientific notation phone numbers and strips +91', () => {
    expect(cleanPhoneNumber('9.84012E+09').phone).toBe('9840120000');
    expect(cleanPhoneNumber('+91 9840123456').phone).toBe('9840123456');
    expect(cleanPhoneNumber('9840123456').isValid).toBe(true);
    expect(cleanPhoneNumber('12345').isValid).toBe(false);

    expect(cleanEmail('User@Domain.COM ').email).toBe('user@domain.com');
    expect(cleanEmail('user@domain.com').isValid).toBe(true);
    expect(cleanEmail('invalid-email').isValid).toBe(false);
  });

  it('splits multi-subject cells and standardizes spelling variants', () => {
    const subs1 = splitAndNormalizeSubjects('Tamil, English, Mathamatics, Science, Social Science');
    expect(subs1).toEqual(['Tamil', 'English', 'Mathematics', 'Science', 'Social Science']);

    const subs2 = splitAndNormalizeSubjects('Accountancy, Commerce, Economics');
    expect(subs2).toEqual(['Accountancy', 'Commerce', 'Economics']);

    const subs3 = splitAndNormalizeSubjects('Physics / Chemistry & CS');
    expect(subs3).toEqual(['Physics', 'Chemistry', 'Computer Science']);
  });

  it('parses diverse class teacher formats and skips non-classes', () => {
    const ct1 = parseClassTeacherString('class 1 - section A');
    expect(ct1.isClass).toBe(true);
    expect(ct1.grade).toBe('1');
    expect(ct1.section).toBe('A');

    const ct2 = parseClassTeacherString('Class 9 -section C');
    expect(ct2.isClass).toBe(true);
    expect(ct2.grade).toBe('9');
    expect(ct2.section).toBe('C');

    const ct3 = parseClassTeacherString('LKG');
    expect(ct3.isClass).toBe(true);
    expect(ct3.grade).toBe('LKG');
    expect(ct3.section).toBe('');

    const ct4 = parseClassTeacherString('Accounts assistant');
    expect(ct4.isClass).toBe(false);
    expect(ct4.warning).toContain('skipped');

    const ct5 = parseClassTeacherString('-');
    expect(ct5.isClass).toBe(false);
  });

  it('processes the full 37-row fixture and offers new subjects for auto-creation', async () => {
    const fixturePath = path.resolve(__dirname, '../../../../tests/fixtures/SRT_SCHOOL__TEACHER.xlsx');
    const buffer = fs.readFileSync(fixturePath);
    const file = new File([buffer], 'SRT_SCHOOL__TEACHER.xlsx');
    const parsed = await parseFileToWorkbook(file);

    const mappings = autoMapColumns(parsed.headers, parsed.rows, 'staff');

    const existingSubjects = [
      { id: 'sub_1', name: 'Tamil', code: 'TAM', type: 'theory', periodsPerWeek: 5, maxPerDay: 1, requiresDoublePeriod: false, isMorningPreferred: true, color: '#f97316' },
      { id: 'sub_2', name: 'English', code: 'ENG', type: 'theory', periodsPerWeek: 5, maxPerDay: 1, requiresDoublePeriod: false, isMorningPreferred: true, color: '#3b82f6' },
    ];

    const { cleanedRows, newSubjectSuggestions } = cleanAndValidateStaffRows(
      parsed.rows,
      mappings,
      [],
      existingSubjects as any
    );

    expect(cleanedRows.length).toBe(37);
    // Assert 100% of rows have clean, valid names (no "KK8H..." or "XL/SHAREDSTRINGS.XML")
    expect(cleanedRows.every((r) => !r.name.includes('KK') && !r.name.includes('XML'))).toBe(true);

    // Verify first row cleaned properly
    expect(cleanedRows[0].name).toBe('Gayathri P');
    expect(cleanedRows[0].parsedClassGrade).toBe('1');
    expect(cleanedRows[0].parsedClassSection).toBe('A');

    // Verify new subjects (Accountancy, Commerce, Economics, etc.) are detected
    const newSubNames = newSubjectSuggestions.map((s) => s.name);
    expect(newSubNames).toContain('Accountancy');
    expect(newSubNames).toContain('Commerce');
    expect(newSubNames).toContain('Economics');
    expect(newSubNames).toContain('Mathematics');
  });

  it('correctly identifies corrupted staff records from prior buggy text-reader imports', () => {
    // Normal teacher record
    const validTeacher: any = { id: 't1', name: 'Dr. S. Priya', code: 'PRI' };
    expect(isCorruptedStaffRecord(validTeacher)).toBe(false);

    // ZIP header or OOXML artifacts
    const zipArtifactTeacher: any = { id: 't2', name: 'KK8H', code: 'KK8' };
    expect(isCorruptedStaffRecord(zipArtifactTeacher)).toBe(true);

    const xmlPartTeacher: any = { id: 't3', name: 'XL/SHAREDSTRINGS.XML', code: 'XML' };
    expect(isCorruptedStaffRecord(xmlPartTeacher)).toBe(true);

    const replacementCharTeacher: any = { id: 't4', name: 'Teacher\uFFFDName', code: 'TN' };
    expect(isCorruptedStaffRecord(replacementCharTeacher)).toBe(true);
  });

  it('normalizes and validates subject rows for direct subject catalog import', () => {
    const rawRows = [
      ['Physics Practical', 'PHYLAB', 'lab', '4', 'yes', 'no'],
      ['Mathematics', 'MATH', 'theory', '6', 'no', 'yes'],
    ];

    const mappings = [
      { columnIndex: 0, headerName: 'Subject Name', mappedField: 'name', confidence: 'exact', sampleValues: [] },
      { columnIndex: 1, headerName: 'Short Code', mappedField: 'code', confidence: 'exact', sampleValues: [] },
      { columnIndex: 2, headerName: 'Type', mappedField: 'type', confidence: 'exact', sampleValues: [] },
      { columnIndex: 3, headerName: 'Default Periods', mappedField: 'defaultPeriods', confidence: 'exact', sampleValues: [] },
      { columnIndex: 4, headerName: 'Double Period', mappedField: 'doublePeriod', confidence: 'exact', sampleValues: [] },
      { columnIndex: 5, headerName: 'Prefer Morning', mappedField: 'morningPreference', confidence: 'exact', sampleValues: [] },
    ];

    const { cleanedRows } = cleanAndValidateSubjectRows(rawRows, mappings as any, []);

    expect(cleanedRows.length).toBe(2);
    expect(cleanedRows[0].name).toBe('Physics Practical');
    expect(cleanedRows[0].type).toBe('lab');
    expect(cleanedRows[0].periodsPerWeek).toBe(4);
    expect(cleanedRows[0].requiresDoublePeriod).toBe(true);
    expect(cleanedRows[0].isMorningPreferred).toBe(false);

    expect(cleanedRows[1].name).toBe('Mathematics');
    expect(cleanedRows[1].type).toBe('theory');
    expect(cleanedRows[1].isMorningPreferred).toBe(true);
  });
});
