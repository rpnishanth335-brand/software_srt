import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Project, Slot } from '../types';
import { DAY_NAMES, getPeriodTiming, hexToRgb } from './utils';

/**
 * Generate and download a comprehensive multi-sheet Excel workbook.
 */
export async function exportExcelWorkbook(project: Project, slots: Slot[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ChronoForge AI';
  workbook.lastModifiedBy = 'ChronoForge Engine';
  workbook.created = new Date();
  workbook.modified = new Date();

  const { school, classes, subjects, teachers } = project;
  const selectedClasses = classes.filter((c) => c.selected);
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const maxPeriods = Math.max(...school.days.map((d) => school.periodsByDay[d] || 8));

  // ==========================================
  // SHEET 1: Master Timetable
  // ==========================================
  const masterSheet = workbook.addWorksheet('Master Timetable', {
    views: [{ showGridLines: true }],
  });

  // Title
  masterSheet.mergeCells('A1:J1');
  const titleCell = masterSheet.getCell('A1');
  titleCell.value = `${school.name.toUpperCase()} — MASTER TIMETABLE (${school.year})`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  masterSheet.getRow(1).height = 30;

  // Header row for Master
  const masterHeaders = ['Class', 'Room', 'Day', ...Array.from({ length: maxPeriods }, (_, i) => `Period ${i + 1}`)];
  const headerRow = masterSheet.addRow(masterHeaders);
  headerRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 24;

  selectedClasses.forEach((cls) => {
    school.days.forEach((day) => {
      const rowData = [
        `${cls.name}-${cls.section}`,
        cls.roomLabel || '—',
        DAY_NAMES[day] || `Day ${day}`,
      ];

      for (let p = 1; p <= maxPeriods; p++) {
        const slot = slots.find((s) => s.classId === cls.id && s.day === day && s.period === p);
        if (slot && slot.subjectId) {
          const sub = subjectMap.get(slot.subjectId);
          const tea = slot.teacherId ? teacherMap.get(slot.teacherId) : undefined;
          rowData.push(`${sub?.code || 'SUB'} (${tea?.code || 'FAC'})`);
        } else {
          rowData.push('—');
        }
      }

      const addedRow = masterSheet.addRow(rowData);
      addedRow.alignment = { horizontal: 'center', vertical: 'middle' };
      addedRow.height = 20;
    });
  });

  // Auto-fit column widths
  masterSheet.columns.forEach((col, idx) => {
    col.width = idx < 3 ? 15 : 18;
  });

  // ==========================================
  // SHEETS 2..N: Individual Classes
  // ==========================================
  selectedClasses.forEach((cls) => {
    // Excel worksheet names have 31 char limit
    const sheetName = `Class ${cls.name}-${cls.section}`.substring(0, 31);
    const ws = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });

    // Header banner
    ws.mergeCells(1, 1, 1, maxPeriods + 1);
    const clsBanner = ws.getCell(1, 1);
    clsBanner.value = `${school.name} — Class ${cls.name} (${cls.section})${cls.roomLabel ? ` [Room ${cls.roomLabel}]` : ''} Timetable`;
    clsBanner.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    clsBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    clsBanner.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 26;

    // Period headers
    const periodHeaders = [
      'Day',
      ...Array.from({ length: maxPeriods }, (_, i) => {
        const p = i + 1;
        return `Period ${p}\n(${getPeriodTiming(school, p)})`;
      }),
    ];
    const pHeaderRow = ws.addRow(periodHeaders);
    pHeaderRow.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    pHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    pHeaderRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    pHeaderRow.height = 30;

    school.days.forEach((day) => {
      const dayPeriods = school.periodsByDay[day] || 8;
      const rowValues = [DAY_NAMES[day] || `Day ${day}`];

      for (let p = 1; p <= maxPeriods; p++) {
        if (p > dayPeriods) {
          rowValues.push('—');
          continue;
        }

        const slot = slots.find((s) => s.classId === cls.id && s.day === day && s.period === p);
        if (slot && slot.subjectId) {
          const sub = subjectMap.get(slot.subjectId);
          const tea = slot.teacherId ? teacherMap.get(slot.teacherId) : undefined;
          rowValues.push(`${sub?.name || 'Subject'}\n[${sub?.code || ''}] • ${tea?.code || ''}`);
        } else {
          rowValues.push('Free Period');
        }
      }

      const row = ws.addRow(rowValues);
      row.height = 36;
      row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Apply subject colors
      for (let p = 1; p <= maxPeriods; p++) {
        const slot = slots.find((s) => s.classId === cls.id && s.day === day && s.period === p);
        if (slot && slot.subjectId) {
          const sub = subjectMap.get(slot.subjectId);
          if (sub?.color) {
            const rgb = hexToRgb(sub.color);
            // Light pastel fill
            const hexArgb =
              'FF' +
              Math.round(255 - (255 - rgb[0]) * 0.25).toString(16).padStart(2, '0') +
              Math.round(255 - (255 - rgb[1]) * 0.25).toString(16).padStart(2, '0') +
              Math.round(255 - (255 - rgb[2]) * 0.25).toString(16).padStart(2, '0');

            const cell = row.getCell(p + 1);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexArgb } };
            cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
          }
        }
      }
    });

    ws.columns.forEach((col, idx) => {
      col.width = idx === 0 ? 14 : 20;
    });
  });

  // ==========================================
  // SHEETS N+1..M: Faculty Timetables
  // ==========================================
  teachers.forEach((t) => {
    const sheetName = `Faculty ${t.code}`.substring(0, 31);
    const ws = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });

    ws.mergeCells(1, 1, 1, maxPeriods + 1);
    const tBanner = ws.getCell(1, 1);
    tBanner.value = `${school.name} — Faculty Schedule: ${t.name} (${t.code})`;
    tBanner.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    tBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF581C87' } }; // purple
    tBanner.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 26;

    const periodHeaders = [
      'Day',
      ...Array.from({ length: maxPeriods }, (_, i) => `Period ${i + 1}\n(${getPeriodTiming(school, i + 1)})`),
    ];
    const pHeaderRow = ws.addRow(periodHeaders);
    pHeaderRow.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    pHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B21A8' } };
    pHeaderRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    pHeaderRow.height = 30;

    school.days.forEach((day) => {
      const dayPeriods = school.periodsByDay[day] || 8;
      const rowValues = [DAY_NAMES[day] || `Day ${day}`];

      for (let p = 1; p <= maxPeriods; p++) {
        if (p > dayPeriods) {
          rowValues.push('—');
          continue;
        }

        const isBlocked = t.blocked.some((b) => b.day === day && b.period === p);
        if (isBlocked) {
          rowValues.push('[BLOCKED]');
          continue;
        }

        const slot = slots.find((s) => s.teacherId === t.id && s.day === day && s.period === p);
        if (slot && slot.subjectId) {
          const sub = subjectMap.get(slot.subjectId);
          const cls = classMap.get(slot.classId);
          rowValues.push(`${sub?.name || 'Subject'}\n[${sub?.code || ''}] • ${cls ? `${cls.name}-${cls.section}` : ''}`);
        } else {
          rowValues.push('Free');
        }
      }

      const row = ws.addRow(rowValues);
      row.height = 36;
      row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      for (let p = 1; p <= maxPeriods; p++) {
        const val = row.getCell(p + 1).value;
        if (typeof val === 'string' && val.includes('[BLOCKED]')) {
          const cell = row.getCell(p + 1);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFB91C1C' } };
        }
      }
    });

    ws.columns.forEach((col, idx) => {
      col.width = idx === 0 ? 14 : 20;
    });
  });

  // ==========================================
  // FINAL SHEET: Summary Statistics
  // ==========================================
  const summaryWs = workbook.addWorksheet('Summary Statistics', { views: [{ showGridLines: true }] });

  summaryWs.mergeCells('A1:E1');
  const sumBanner = summaryWs.getCell('A1');
  sumBanner.value = `${school.name} — TIMETABLE METRICS & LOAD SUMMARY`;
  sumBanner.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  sumBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  sumBanner.alignment = { horizontal: 'center', vertical: 'middle' };
  summaryWs.getRow(1).height = 28;

  // Faculty Load Table
  summaryWs.addRow([]);
  const facHeaderRow = summaryWs.addRow(['Faculty Name', 'Code', 'Allocated Periods/Wk', 'Max Capacity/Wk', 'Utilization %']);
  facHeaderRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  facHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134E4A' } };

  teachers.forEach((t) => {
    const allocated = slots.filter((s) => s.teacherId === t.id && s.subjectId).length;
    const util = t.maxPerWeek > 0 ? Math.round((allocated / t.maxPerWeek) * 100) : 0;
    summaryWs.addRow([t.name, t.code, allocated, t.maxPerWeek, `${util}%`]);
  });

  summaryWs.columns = [
    { width: 28 },
    { width: 12 },
    { width: 24 },
    { width: 20 },
    { width: 16 },
  ];

  // Write and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = `${school.name}_Master_Timetable.xlsx`.replace(/\s+/g, '_');
  saveAs(blob, filename);
}
