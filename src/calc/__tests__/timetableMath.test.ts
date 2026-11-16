import { describe, it, expect } from 'vitest';
import { computeTimetableCalculations } from '../timetableMath';
import { Project } from '../../types';

describe('Local Pre-Flight Timetable Mathematical Calculations', () => {
  const sampleProject: Project = {
    id: 'test-project',
    updatedAt: Date.now(),
    school: {
      name: 'Oakridge High',
      year: '2026-2027',
      days: [1, 2, 3, 4, 5],
      periodsByDay: { 1: 8, 2: 8, 3: 8, 4: 8, 5: 8 },
      periodTimes: [],
      breaks: [{ id: 'b1', name: 'Lunch', afterPeriod: 4, durationMinutes: 45 }],
    },
    classes: [
      { id: 'c1', name: 'Grade 10', section: 'A', selected: true },
      { id: 'c2', name: 'Grade 10', section: 'B', selected: true },
    ],
    subjects: [
      { id: 's1', name: 'Mathematics', code: 'MATH', color: '#f97316', type: 'theory', doublePeriod: false, maxPerDay: 2, preferMorning: true },
      { id: 's2', name: 'Physics Lab', code: 'PHY', color: '#3b82f6', type: 'lab', doublePeriod: true, maxPerDay: 2, preferMorning: false, specialRoomId: 'r1' },
    ],
    teachers: [
      { id: 't1', name: 'Dr. Euler', code: 'EUL', subjectIds: ['s1'], classIds: ['c1', 'c2'], maxPerDay: 4, maxPerWeek: 20, maxConsecutive: 3, blocked: [{ day: 5, period: 8 }] },
      { id: 't2', name: 'Prof. Newton', code: 'NEW', subjectIds: ['s2'], classIds: ['c1', 'c2'], maxPerDay: 4, maxPerWeek: 20, maxConsecutive: 3, blocked: [] },
    ],
    rooms: [
      { id: 'r1', name: 'Physics Laboratory', number: '101', code: 'PHY-LAB', type: 'lab', capacity: 35 },
    ],
    assignments: [
      { classId: 'c1', subjectId: 's1', teacherId: 't1', periodsPerWeek: 6 },
      { classId: 'c1', subjectId: 's2', teacherId: 't2', periodsPerWeek: 4 },
      { classId: 'c2', subjectId: 's1', teacherId: 't1', periodsPerWeek: 6 },
      { classId: 'c2', subjectId: 's2', teacherId: 't2', periodsPerWeek: 4 },
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
      softWeights: {
        spreadSubjectEvenly: 80,
        heavySubjectsMorning: 70,
        minimizeTeacherGaps: 60,
      },
      allowFreePeriods: true,
      maxFreePeriodsPerClass: 30,
    },
    timetables: [],
  };

  it('correctly calculates class slots, required lessons, and utilization percentage', () => {
    const calcs = computeTimetableCalculations(sampleProject);
    expect(calcs.classes).toHaveLength(2);

    const c1 = calcs.classes.find((c) => c.classId === 'c1');
    expect(c1).toBeDefined();
    expect(c1?.totalSlots).toBe(40); // 5 days * 8 periods
    expect(c1?.requiredPeriods).toBe(10); // 6 Math + 4 Physics
    expect(c1?.freeSlots).toBe(30);
    expect(c1?.utilizationPct).toBe(25);
  });

  it('computes teacher capacity, blocked counts, and load utilization', () => {
    const calcs = computeTimetableCalculations(sampleProject);
    const t1 = calcs.teachers.find((t) => t.teacherId === 't1');

    expect(t1).toBeDefined();
    expect(t1?.requiredPeriods).toBe(12); // 6 + 6
    expect(t1?.maxPerWeek).toBe(20);
    expect(t1?.blockedCount).toBe(1);
    expect(t1?.availableSlots).toBe(39); // 40 - 1
    expect(t1?.status).toBe('balanced');
  });

  it('generates recommended subject distribution targets across school days', () => {
    const calcs = computeTimetableCalculations(sampleProject);
    const mathDist = calcs.subjectDistributions.find(
      (sd) => sd.classId === 'c1' && sd.subjectId === 's1'
    );

    expect(mathDist).toBeDefined();
    expect(mathDist?.periodsPerWeek).toBe(6);
    // 6 periods across 5 days -> sum must equal 6
    const totalDistributed = mathDist?.recommendedDistribution.reduce((a, b) => a + b, 0);
    expect(totalDistributed).toBe(6);
  });

  it('ranks pigeonhole lessons by constraint difficulty', () => {
    const calcs = computeTimetableCalculations(sampleProject);
    expect(calcs.global.pigeonholeAnalysis.length).toBe(4);

    // Physics Lab requires double period and special room, so its difficulty should be higher than standard Math
    const topDifficult = calcs.global.pigeonholeAnalysis[0];
    expect(topDifficult.subjectCode).toBe('PHY');
    expect(topDifficult.requiresDouble).toBe(true);
    expect(topDifficult.hasSpecialRoom).toBe(true);
  });

  it('detects mathematical impossibility when class requires more periods than available', () => {
    const impossibleProject: Project = {
      ...sampleProject,
      assignments: [
        { classId: 'c1', subjectId: 's1', teacherId: 't1', periodsPerWeek: 50 }, // 50 > 40
      ],
    };

    const calcs = computeTimetableCalculations(impossibleProject);
    expect(calcs.hasBlockingErrors).toBe(true);
    expect(calcs.global.verdict).toBe('Impossible');
    expect(calcs.global.reasons.some((r) => r.includes('requires 50 periods'))).toBe(true);
  });
});
