import { saveAs } from 'file-saver';
import { Project, Slot } from '../types';
import { DAY_NAMES } from './utils';

/**
 * Generate and download a flat CSV timetable with UTF-8 BOM.
 */
export function exportCsvTimetable(project: Project, slots: Slot[]): void {
  const { school, classes, subjects, teachers } = project;
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const headers = [
    'Class',
    'Section',
    'Room',
    'Day',
    'Period',
    'StartTime',
    'EndTime',
    'SubjectCode',
    'SubjectName',
    'SubjectType',
    'TeacherCode',
    'TeacherName',
    'IsLocked',
  ];

  const rows: string[] = [];

  // Sort slots by class, day, period
  const sortedSlots = [...slots].sort((a, b) => {
    if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
    if (a.day !== b.day) return a.day - b.day;
    return a.period - b.period;
  });

  for (const slot of sortedSlots) {
    const cls = classMap.get(slot.classId);
    const sub = slot.subjectId ? subjectMap.get(slot.subjectId) : undefined;
    const tea = slot.teacherId ? teacherMap.get(slot.teacherId) : undefined;

    const pt = school.periodTimes.find((p) => p.period === slot.period);
    const startTime = pt?.startTime || '';
    const endTime = pt?.endTime || '';

    const row = [
      escapeCsv(cls?.name || 'Class'),
      escapeCsv(cls?.section || ''),
      escapeCsv(cls?.roomLabel || ''),
      escapeCsv(DAY_NAMES[slot.day] || `Day ${slot.day}`),
      String(slot.period),
      escapeCsv(startTime),
      escapeCsv(endTime),
      escapeCsv(sub?.code || 'FREE'),
      escapeCsv(sub?.name || 'Free Period'),
      escapeCsv(sub?.type || '—'),
      escapeCsv(tea?.code || '—'),
      escapeCsv(tea?.name || '—'),
      slot.locked ? 'TRUE' : 'FALSE',
    ];

    rows.push(row.join(','));
  }

  // Prepend UTF-8 BOM (\uFEFF) to prevent encoding artifacts in Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${school.name}_Timetable.csv`.replace(/\s+/g, '_');
  saveAs(blob, filename);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
