import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { DetectedFileType, ParsedSheetInfo, RawParsedWorkbook } from './types';

/**
 * Inspects binary magic bytes to determine actual file format.
 */
export function detectFileFormatFromBytes(buffer: ArrayBuffer, fileName: string): DetectedFileType {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // ZIP signature: PK\x03\x04 (Used by OOXML .xlsx, .xlsm)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'xlsx';
  }

  // Compound Document / OLE2 signature: D0 CF 11 E0 (Used by legacy Excel .xls)
  if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
    return 'xls';
  }

  // Check extensions for text formats
  if (ext === 'csv') return 'csv';
  if (ext === 'tsv') return 'tsv';
  if (ext === 'txt') return 'csv';

  // Check if buffer is valid text (not binary executable, PDF, images)
  const isPrintableText = checkIsText(bytes);
  if (isPrintableText) {
    return ext === 'tsv' ? 'tsv' : 'csv';
  }

  // Reject unsupported formats (PDF, DOCX, Images, etc.)
  return 'unsupported';
}

function checkIsText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;
  // If first bytes start with %PDF, reject immediately
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return false;
  }
  // Check for excessive null bytes or control characters
  let controlChars = 0;
  for (let i = 0; i < Math.min(bytes.length, 32); i++) {
    const b = bytes[i];
    if (b === 0x00) return false; // Null byte indicates binary
    if (b < 32 && b !== 9 && b !== 10 && b !== 13) {
      controlChars++;
    }
  }
  return controlChars < 2;
}

/**
 * Decodes text buffer with automatic character encoding detection.
 * Supports UTF-8, UTF-8 with BOM, UTF-16LE, UTF-16BE, and Windows-1252.
 */
export function decodeTextBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // 1. UTF-8 BOM (EF BB BF)
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(bytes.slice(3));
  }

  // 2. UTF-16 LE BOM (FF FE)
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return new TextDecoder('utf-16le').decode(bytes.slice(2));
  }

  // 3. UTF-16 BE BOM (FE FF)
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return new TextDecoder('utf-16be').decode(bytes.slice(2));
  }

  // 4. Try UTF-8 strict
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(bytes);
  } catch {
    // 5. Fallback to Windows-1252 for legacy Excel CSVs
    try {
      const winDecoder = new TextDecoder('windows-1252');
      return winDecoder.decode(bytes);
    } catch {
      return new TextDecoder('iso-8859-1').decode(bytes);
    }
  }
}

/**
 * Checks for corrupted replacement characters (U+FFFD) or control bytes in text.
 */
export function containsCorruptCharacters(text: string): boolean {
  if (!text) return false;
  // Unicode replacement character indicates failed text decode
  if (text.includes('\uFFFD')) return true;
  // Non-printable control characters (except tab, LF, CR)
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text);
}

/**
 * Auto-detects the header row index (0-indexed).
 * Skips empty lines, metadata titles, and picks row with highest non-empty column count.
 */
export function detectHeaderRowIndex(rows: any[][]): number {
  if (!rows || rows.length === 0) return 0;

  let bestIndex = 0;
  let maxCols = 0;

  const maxScan = Math.min(rows.length, 10);
  for (let i = 0; i < maxScan; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    // Count non-empty text cells
    const validCells = row.filter((c) => {
      const str = String(c ?? '').trim();
      return str.length > 0 && !str.toLowerCase().startsWith('form title') && !str.toLowerCase().startsWith('report generated');
    });

    if (validCells.length > maxCols) {
      maxCols = validCells.length;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Parses raw file buffer into structured 2D rows and sheets.
 */
export async function parseFileToWorkbook(file: File): Promise<RawParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  const fileType = detectFileFormatFromBytes(buffer, file.name);

  if (fileType === 'unsupported') {
    throw new Error(`Unsupported file type for "${file.name}". Please upload an Excel (.xlsx, .xls) or CSV/TSV document.`);
  }

  // --------------------------------------------------------------------------
  // Case A: Excel Workbooks (.xlsx, .xls)
  // --------------------------------------------------------------------------
  if (fileType === 'xlsx' || fileType === 'xls') {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, {
        type: 'array',
        cellDates: true,
        cellText: true,
      });
    } catch (err: any) {
      throw new Error(`Failed to parse Excel workbook: ${err?.message || 'File may be corrupted or password-protected.'}`);
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel workbook contains no sheets.');
    }

    const sheets: ParsedSheetInfo[] = [];

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;

      const raw2D: any[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        raw: false,
        defval: '',
      });

      // Filter out completely empty rows
      const nonEmptyRows = raw2D.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim().length > 0));

      const colCount = nonEmptyRows.reduce((max, r) => Math.max(max, r.length), 0);

      sheets.push({
        name: sheetName,
        rowCount: nonEmptyRows.length,
        columnCount: colCount,
        previewRows: nonEmptyRows.slice(0, 10),
      });
    }

    // Automatically select the first non-empty sheet (e.g. "Form responses 1", ignoring empty "Sheet1")
    const candidateSheet = sheets.find((s) => s.rowCount > 0) || sheets[0];
    if (!candidateSheet || candidateSheet.rowCount === 0) {
      throw new Error('All sheets in this Excel workbook are empty.');
    }

    const selectedWs = workbook.Sheets[candidateSheet.name];
    const fullRows: any[][] = (XLSX.utils.sheet_to_json(selectedWs, {
      header: 1,
      raw: false,
      defval: '',
    }) as any[][]).filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim().length > 0));

    const headerIdx = detectHeaderRowIndex(fullRows);
    const headers = (fullRows[headerIdx] || []).map((h, i) => String(h ?? '').trim() || `Column_${i + 1}`);
    const dataRows = fullRows.slice(headerIdx + 1);

    // Sanity check headers for binary corruption
    if (headers.some((h) => containsCorruptCharacters(h))) {
      throw new Error('This file contains corrupted binary data. Please verify your file.');
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType,
      sheets,
      selectedSheetName: candidateSheet.name,
      headers,
      rows: dataRows,
      headerRowIndex: headerIdx,
    };
  }

  // --------------------------------------------------------------------------
  // Case B: Delimited Text Files (.csv, .tsv, .txt)
  // --------------------------------------------------------------------------
  const decodedText = decodeTextBuffer(buffer);

  if (containsCorruptCharacters(decodedText)) {
    throw new Error('This CSV file contains invalid character encoding. Please save it as UTF-8 in Excel.');
  }

  const parsed = Papa.parse<string[]>(decodedText, {
    skipEmptyLines: 'greedy',
  });

  if (parsed.errors && parsed.errors.length > 0 && (!parsed.data || parsed.data.length === 0)) {
    throw new Error(`CSV Parsing error: ${parsed.errors[0].message}`);
  }

  const rows = parsed.data || [];
  if (rows.length === 0) {
    throw new Error('The CSV file is empty.');
  }

  const headerIdx = detectHeaderRowIndex(rows);
  const headers = (rows[headerIdx] || []).map((h, i) => String(h ?? '').trim() || `Column_${i + 1}`);
  const dataRows = rows.slice(headerIdx + 1);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType,
    sheets: [{
      name: 'Default Sheet',
      rowCount: dataRows.length,
      columnCount: headers.length,
      previewRows: dataRows.slice(0, 10),
    }],
    selectedSheetName: 'Default Sheet',
    headers,
    rows: dataRows,
    headerRowIndex: headerIdx,
  };
}

/**
 * Extracts rows from a specific sheet in an Excel workbook.
 */
export async function getSheetData(file: File, sheetName: string): Promise<{ headers: string[]; rows: any[][]; headerRowIndex: number }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellText: true,
  });

  const ws = workbook.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found in workbook.`);

  const fullRows: any[][] = (XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: '',
  }) as any[][]).filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim().length > 0));

  const headerIdx = detectHeaderRowIndex(fullRows);
  const headers = (fullRows[headerIdx] || []).map((h, i) => String(h ?? '').trim() || `Column_${i + 1}`);
  const dataRows = fullRows.slice(headerIdx + 1);

  return { headers, rows: dataRows, headerRowIndex: headerIdx };
}
