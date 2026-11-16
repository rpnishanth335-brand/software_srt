import { describe, it, expect } from 'vitest';
import { validateTimetable } from '../validator';
import { Project, Slot } from '../../types';

describe('Deterministic Timetable Validator', () => {
  const testProject: Project = {
    id: 'val-project',
    updatedAt: Date.now(),
    school: {
      name: 'Validation Academy',
      year: '2026-2027',
      days: [1, 2, 3],
      periodsByDay: { 1: 4, 2: 4, 3: 4 },
      periodTimes: [],
      breaks: [{ id: 'b1', name: 'Recess', afterPeriod: 2, durationMinutes: 15 }],
    },
    classes: [
      { id: 'c1', name: '10', section: 'A', selected: true },
      { id: 'c2', name: '10', section: 'B', selected: true },
    ],
    subjects: [
      { id: 's1', name: 'English', code: 'ENG', color: '#f97316', type: 'theory', doublePeriod: false, maxPerDay: 2, preferMorning: true },
      { id: 's2', name: 'Chemistry', code: 'CHEM', color: '#3b82f6', type: 'lab', doublePeriod: true, maxPerDay: 2, preferMorning: false },
    ],
    teachers: [
      { id: 't1', name: 'Prof. Curie', code: 'CUR', subjectIds: ['s1'], classIds: ['c1', 'c2'], maxPerDay: 3, maxPerWeek: 10, maxConsecutive: 3, blocked: [{ day: 1, period: 1 }] },
    ],
    rooms: [],
    assignments: [
      { classId: 'c1', subjectId: 's1', teacherId: 't1', periodsPerWeek: 2 },
    ],
    rules: {
      hardRules: {
        noTeacherClash: true,
        noClassClash: true,
        respectTeacherBlocked: true,
        respectMaxPerDay: true,
        respectMaxPerWeek: true,
        doublePeriodsConsecutive: true,
        doublePeriodsNoBreakCrossing: true,
        specialRoomClash: true,
      },
      softWeights: {},
      allowFreePeriods: true,
      maxFreePeriodsPerClass: 10,
    },
    timetables: [],
  };

  it('validates conflict-free timetable successfully', () => {
    const validSlots: Slot[] = [
      { classId: 'c1', day: 1, period: 2, subjectId: 's1', teacherId: 't1', locked: false },
      { classId: 'c1', day: 2, period: 2, subjectId: 's1', teacherId: 't1', locked: false },
    ];

    const result = validateTimetable(validSlots, testProject, ['c1']);
    expect(result.isValid).toBe(true);
    expect(result.hardConflictCount).toBe(0);
  });

  it('detects teacher double-booking clash', () => {
    const clashSlots: Slot[] = [
      // Teacher t1 scheduled in both c1 and c2 at the exact same time
      { classId: 'c1', day: 1, period: 2, subjectId: 's1', teacherId: 't1', locked: false },
      { classId: 'c2', day: 1, period: 2, subjectId: 's1', teacherId: 't1', locked: false },
    ];

    const result = validateTimetable(clashSlots, testProject, ['c1', 'c2']);
    expect(result.isValid).toBe(false);
    expect(result.hardBreakdown.teacherDoubleBooking).toBeGreaterThanOrEqual(1);
    expect(result.violations.some((v) => v.ruleId === 'teacher-double-booking')).toBe(true);
  });

  it('detects teacher blocked slot violation', () => {
    const blockedSlots: Slot[] = [
      // Day 1, Period 1 is in teacher t1 blocked list
      { classId: 'c1', day: 1, period: 1, subjectId: 's1', teacherId: 't1', locked: false },
      { classId: 'c1', day: 2, period: 2, subjectId: 's1', teacherId: 't1', locked: false },
    ];

    const result = validateTimetable(blockedSlots, testProject, ['c1']);
    expect(result.isValid).toBe(false);
    expect(result.hardBreakdown.teacherBlocked).toBe(1);
    expect(result.violations.some((v) => v.ruleId === 'teacher-blocked')).toBe(true);
  });

  it('detects double period break crossing', () => {
    const breakCrossingSlots: Slot[] = [
      // Recess occurs after period 2. Scheduling double period across period 2 and 3 crosses recess!
      { classId: 'c1', day: 1, period: 2, subjectId: 's2', teacherId: 't1', locked: false, isDoublePeriodPart: 1 },
      { classId: 'c1', day: 1, period: 3, subjectId: 's2', teacherId: 't1', locked: false, isDoublePeriodPart: 2 },
    ];

    const result = validateTimetable(breakCrossingSlots, testProject, ['c1']);
    expect(result.isValid).toBe(false);
    expect(result.hardBreakdown.doublePeriodBreakCrossing).toBe(1);
    expect(result.violations.some((v) => v.ruleId === 'double-period-break-crossing')).toBe(true);
  });
});
