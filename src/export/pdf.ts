import jsPDF from 'jspdf';
import autoTable, { CellHookData } from 'jspdf-autotable';
import { Project, Slot, ID } from '../types';
import { DAY_NAMES, hexToRgb, getPeriodTiming } from './utils';

/**
 * Generate and download a PDF timetable for a single class.
 */
export function exportClassPdf(project: Project, classId: ID, slots: Slot[]): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  renderClassPage(doc, project, classId, slots, 1, 1);
  const cls = project.classes.find((c) => c.id === classId);
  const filename = `${project.school.name}_${cls?.name || 'Class'}_${cls?.section || ''}_Timetable.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
}

/**
 * Generate a multi-page PDF with one page per selected class.
 */
export function exportAllClassesPdf(project: Project, slots: Slot[]): void {
  const selectedClasses = project.classes.filter((c) => c.selected);
  if (selectedClasses.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  selectedClasses.forEach((cls, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'landscape');
    }
    renderClassPage(doc, project, cls.id, slots, idx + 1, selectedClasses.length);
  });

  const filename = `${project.school.name}_All_Classes_Timetable.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
}

/**
 * Generate a timetable PDF for a single faculty member.
 */
export function exportTeacherPdf(project: Project, teacherId: ID, slots: Slot[]): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  renderTeacherPage(doc, project, teacherId, slots, 1, 1);
  const teacher = project.teachers.find((t) => t.id === teacherId);
  const filename = `${project.school.name}_Faculty_${teacher?.code || 'Teacher'}_Timetable.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
}

/**
 * Generate a multi-page PDF with one page per faculty member.
 */
export function exportAllTeachersPdf(project: Project, slots: Slot[]): void {
  const teachers = project.teachers;
  if (teachers.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  teachers.forEach((t, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'landscape');
    }
    renderTeacherPage(doc, project, t.id, slots, idx + 1, teachers.length);
  });

  const filename = `${project.school.name}_All_Faculty_Timetables.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
}

/**
 * Render a single class timetable page into jsPDF doc.
 */
function renderClassPage(
  doc: jsPDF,
  project: Project,
  classId: ID,
  slots: Slot[],
  currentPage: number,
  totalPages: number
): void {
  const { school, classes, subjects, teachers } = project;
  const cls = classes.find((c) => c.id === classId);
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  const maxPeriods = Math.max(...school.days.map((d) => school.periodsByDay[d] || 8));

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(school.name.toUpperCase(), 40, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Academic Year: ${school.year}  |  Generated on: ${new Date().toLocaleDateString()}`, 40, 62);

  // Class Sub-header banner
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(40, 75, 762, 30, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`CLASS: ${cls?.name || 'Class'} – Section ${cls?.section || ''}${cls?.roomLabel ? ` (Room ${cls.roomLabel})` : ''}`, 52, 94);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Room: ${cls?.roomLabel || 'General'}`, 340, 94);
  const classTeacher = teachers.find((t) => t.id === cls?.classTeacherId);
  doc.text(`Class Teacher: ${classTeacher ? classTeacher.name : 'Unassigned'}`, 540, 94);

  // --- Table Construction ---
  // Table columns: Day, Period 1, Period 2, ...
  const tableHeaders = [
    'Day',
    ...Array.from({ length: maxPeriods }, (_, i) => {
      const p = i + 1;
      const timing = getPeriodTiming(school, p);
      return `Period ${p}\n${timing}`;
    }),
  ];

  const tableData: string[][] = [];
  const cellColorMap = new Map<string, string>(); // key: `${rowIndex}:${colIndex}` -> hexColor

  school.days.forEach((day, rowIndex) => {
    const dayPeriods = school.periodsByDay[day] || 8;
    const row = [DAY_NAMES[day] || `Day ${day}`];

    for (let p = 1; p <= maxPeriods; p++) {
      if (p > dayPeriods) {
        row.push('—');
        continue;
      }

      const slot = slots.find((s) => s.classId === classId && s.day === day && s.period === p);
      if (slot && slot.subjectId) {
        const sub = subjectMap.get(slot.subjectId);
        const tea = slot.teacherId ? teacherMap.get(slot.teacherId) : undefined;
        const cellText = `${sub?.name || 'Subject'}\n[${sub?.code || ''}] • ${tea?.code || ''}${cls?.roomLabel ? `\nRm: ${cls.roomLabel}` : ''}`;
        row.push(cellText);

        if (sub?.color) {
          cellColorMap.set(`${rowIndex}:${p}`, sub.color);
        }
      } else {
        row.push('Free Period');
      }
    }
    tableData.push(row);
  });

  autoTable(doc, {
    startY: 115,
    margin: { left: 40, right: 40 },
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      halign: 'center',
      valign: 'middle',
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [15, 23, 42], cellWidth: 70 },
    },
    didParseCell: (data: CellHookData) => {
      if (data.section === 'body' && data.column.index > 0) {
        const key = `${data.row.index}:${data.column.index}`;
        const hex = cellColorMap.get(key);
        if (hex) {
          const rgb = hexToRgb(hex);
          // Light pastel background for clean printing
          data.cell.styles.fillColor = [
            Math.round(255 - (255 - rgb[0]) * 0.25),
            Math.round(255 - (255 - rgb[1]) * 0.25),
            Math.round(255 - (255 - rgb[2]) * 0.25),
          ];
          data.cell.styles.textColor = [15, 23, 42]; // High contrast dark text
        }
      }
    },
  });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Page ${currentPage} of ${totalPages}  |  ChronoForge AI Timetable Generator  |  Confidential & Official`,
    40,
    pageHeight - 20
  );
}

/**
 * Render a single faculty member timetable page into jsPDF doc.
 */
function renderTeacherPage(
  doc: jsPDF,
  project: Project,
  teacherId: ID,
  slots: Slot[],
  currentPage: number,
  totalPages: number
): void {
  const { school, classes, subjects, teachers } = project;
  const teacher = teachers.find((t) => t.id === teacherId);
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const maxPeriods = Math.max(...school.days.map((d) => school.periodsByDay[d] || 8));

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(school.name.toUpperCase(), 40, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Academic Year: ${school.year}  |  Generated on: ${new Date().toLocaleDateString()}`, 40, 62);

  // Teacher Sub-header banner
  doc.setFillColor(243, 232, 255); // purple-100
  doc.roundedRect(40, 75, 762, 30, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(88, 28, 135); // purple-900
  doc.text(`FACULTY: ${teacher?.name || 'Teacher'} (${teacher?.code || ''})`, 52, 94);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 33, 168);
  const taughtSubjects = (teacher?.subjectIds || [])
    .map((id) => subjectMap.get(id)?.name)
    .filter(Boolean)
    .join(', ');
  doc.text(`Subjects: ${taughtSubjects || 'General'}`, 340, 94);
  doc.text(`Max Load: ${teacher?.maxPerWeek || 0} periods/wk`, 640, 94);

  // --- Table Construction ---
  const tableHeaders = [
    'Day',
    ...Array.from({ length: maxPeriods }, (_, i) => {
      const p = i + 1;
      const timing = getPeriodTiming(school, p);
      return `Period ${p}\n${timing}`;
    }),
  ];

  const tableData: string[][] = [];
  const cellColorMap = new Map<string, string>();

  school.days.forEach((day, rowIndex) => {
    const dayPeriods = school.periodsByDay[day] || 8;
    const row = [DAY_NAMES[day] || `Day ${day}`];

    for (let p = 1; p <= maxPeriods; p++) {
      if (p > dayPeriods) {
        row.push('—');
        continue;
      }

      // Check if teacher is blocked
      const isBlocked = teacher?.blocked.some((b) => b.day === day && b.period === p);
      if (isBlocked) {
        row.push('[BLOCKED]');
        continue;
      }

      const slot = slots.find((s) => s.teacherId === teacherId && s.day === day && s.period === p);
      if (slot && slot.subjectId) {
        const sub = subjectMap.get(slot.subjectId);
        const cls = classMap.get(slot.classId);
        const cellText = `${sub?.name || 'Subject'}\n[${sub?.code || ''}]\nClass: ${cls ? `${cls.name}-${cls.section}` : ''}`;
        row.push(cellText);

        if (sub?.color) {
          cellColorMap.set(`${rowIndex}:${p}`, sub.color);
        }
      } else {
        row.push('Free');
      }
    }
    tableData.push(row);
  });

  autoTable(doc, {
    startY: 115,
    margin: { left: 40, right: 40 },
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [88, 28, 135], // purple-900
      textColor: [255, 255, 255],
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      halign: 'center',
      valign: 'middle',
      overflow: 'linebreak',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [250, 245, 255], textColor: [88, 28, 135], cellWidth: 70 },
    },
    didParseCell: (data: CellHookData) => {
      if (data.section === 'body' && data.column.index > 0) {
        const raw = String(data.cell.raw);
        if (raw.includes('[BLOCKED]')) {
          data.cell.styles.fillColor = [254, 226, 226]; // red-100
          data.cell.styles.textColor = [185, 28, 28]; // red-700
          data.cell.styles.fontStyle = 'bold';
        } else {
          const key = `${data.row.index}:${data.column.index}`;
          const hex = cellColorMap.get(key);
          if (hex) {
            const rgb = hexToRgb(hex);
            data.cell.styles.fillColor = [
              Math.round(255 - (255 - rgb[0]) * 0.25),
              Math.round(255 - (255 - rgb[1]) * 0.25),
              Math.round(255 - (255 - rgb[2]) * 0.25),
            ];
            data.cell.styles.textColor = [15, 23, 42];
          }
        }
      }
    },
  });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Page ${currentPage} of ${totalPages}  |  ChronoForge AI Timetable Generator  |  Confidential & Official`,
    40,
    pageHeight - 20
  );
}
