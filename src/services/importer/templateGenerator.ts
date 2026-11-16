import * as XLSX from 'xlsx';

/**
 * Downloads a CSV string with a UTF-8 Byte Order Mark (\uFEFF)
 * ensuring Excel on Windows correctly parses Unicode and Indic (Tamil, Hindi, etc.) characters.
 */
export function exportCsvWithBom(filename: string, headers: string[], rows: (string | number | undefined | null)[][]): void {
  const sanitize = (val: any) => {
    if (val === null || val === undefined) return '';
    const s = String(val).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };

  const headerLine = headers.map(sanitize).join(',');
  const rowLines = rows.map((r) => r.map(sanitize).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Generates and downloads a genuine OOXML Excel (.xlsx) file using SheetJS.
 */
export function exportXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
): void {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-fit column widths nicely
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = h.length;
    for (const row of rows) {
      const cell = row[colIdx];
      if (cell !== undefined && cell !== null) {
        maxLen = Math.max(maxLen, String(cell).length);
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// PRE-BUILT TEMPLATES (Staff, Subjects, Classes)
// -------------------------------------------------------------

export function downloadStaffTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
  const headers = [
    'Teacher Name',
    'Short Code',
    'Gender',
    'Phone Number',
    'Google Mail ID',
    'Qualification',
    'Subjects Handled',
    'Class Teacher',
  ];

  const sampleRows: (string | number)[][] = [
    [
      'Dr. S. Priya',
      'PRI',
      'Female',
      '9840123456',
      'priya.s@school.edu',
      'M.Sc. B.Ed',
      'Mathematics, Science',
      'Class 8 - A',
    ],
    [
      'K. Divya',
      'DIV',
      'Female',
      '9840654321',
      'divya.k@school.edu',
      'M.A. B.Ed',
      'English, Social Science',
      'Class 6 - B',
    ],
    [
      'R. Kumar',
      'KUM',
      'Male',
      '9840998877',
      'kumar.r@school.edu',
      'MCA',
      'Computer Science',
      '',
    ],
    [
      'M. Suresh',
      'SUR',
      'Male',
      '9840776655',
      'suresh.m@school.edu',
      'B.P.Ed',
      'Physical Education',
      '',
    ],
  ];

  if (format === 'csv') {
    exportCsvWithBom('ChronoForge_Staff_Template', headers, sampleRows);
  } else {
    exportXlsx('ChronoForge_Staff_Template', 'Staff', headers, sampleRows);
  }
}

export function downloadSubjectsTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
  const headers = [
    'Subject Name',
    'Short Code',
    'Type',
    'Default Periods Per Week',
    'Requires Double Period',
    'Prefer Morning',
  ];

  const sampleRows: (string | number)[][] = [
    ['Mathematics', 'MATH', 'theory', 6, 'No', 'Yes'],
    ['Science', 'SCI', 'theory', 5, 'No', 'Yes'],
    ['English', 'ENG', 'theory', 5, 'No', 'No'],
    ['Tamil', 'TAM', 'theory', 5, 'No', 'Yes'],
    ['Social Science', 'SST', 'theory', 5, 'No', 'No'],
    ['Physics Practical', 'PHYLAB', 'lab', 4, 'Yes', 'No'],
    ['Computer Science', 'CS', 'theory', 3, 'No', 'No'],
    ['Physical Education', 'PT', 'sports', 2, 'No', 'No'],
    ['Library', 'LIB', 'activity', 1, 'No', 'No'],
  ];

  if (format === 'csv') {
    exportCsvWithBom('ChronoForge_Subjects_Template', headers, sampleRows);
  } else {
    exportXlsx('ChronoForge_Subjects_Template', 'Subjects', headers, sampleRows);
  }
}

export function downloadClassesTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
  const headers = [
    'Class Grade',
    'Section',
    'Student Strength',
    'Room Label',
  ];

  const sampleRows: (string | number)[][] = [
    ['Class 6', 'A', 38, 'Room 101'],
    ['Class 6', 'B', 36, 'Room 102'],
    ['Class 7', 'A', 40, 'Room 103'],
    ['Class 8', 'A', 42, 'Room 201'],
    ['Class 9', 'A', 40, 'Room 202'],
    ['Class 10', 'A', 45, 'Room 301'],
  ];

  if (format === 'csv') {
    exportCsvWithBom('ChronoForge_Classes_Template', headers, sampleRows);
  } else {
    exportXlsx('ChronoForge_Classes_Template', 'Classes', headers, sampleRows);
  }
}
