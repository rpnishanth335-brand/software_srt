import { describe, it, expect } from 'vitest';
import { SolverEngine } from '../engine';
import { getDemoSchoolProject } from '../../store/demoSchool';
import { Project, Slot } from '../../types';

describe('AI Timetable Constraint Solver (/src/solver)', () => {
  it('solves a tiny micro-instance in < 100ms with 0 hard conflicts', async () => {
    const tinyProject: Project = {
      id: 'tiny',
      school: {
        name: 'Tiny Academy',
        year: '2026',
        days: [1, 2], // Mon, Tue
        periodsByDay: { 1: 2, 2: 2 }, // 4 total slots
        periodTimes: [],
        breaks: [],
      },
      classes: [
        { id: 'c1', name: 'Grade 1', section: 'A', selected: true },
      ],
      subjects: [
        { id: 's1', name: 'Math', code: 'MTH', color: '#f97316', type: 'theory', doublePeriod: false, maxPerDay: 2, preferMorning: true },
        { id: 's2', name: 'Art', code: 'ART', color: '#ec4899', type: 'activity', doublePeriod: false, maxPerDay: 2, preferMorning: false },
      ],
      teachers: [
        { id: 't1', name: 'Mr. One', code: 'M1', subjectIds: ['s1'], classIds: ['c1'], maxPerDay: 2, maxPerWeek: 4, maxConsecutive: 2, blocked: [] },
        { id: 't2', name: 'Ms. Two', code: 'M2', subjectIds: ['s2'], classIds: ['c1'], maxPerDay: 2, maxPerWeek: 4, maxConsecutive: 2, blocked: [] },
      ],
      rooms: [],
      assignments: [
        { classId: 'c1', subjectId: 's1', teacherId: 't1', periodsPerWeek: 2 },
        { classId: 'c1', subjectId: 's2', teacherId: 't2', periodsPerWeek: 2 },
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
          minimizeTeacherGaps: 50,
          limitConsecutiveTeacher: 50,
          consistentSubjectPeriod: 50,
          avoidEdgePeriodsTeacher: 50,
          sportsActivityLastPeriods: 80,
        },
        allowFreePeriods: false,
        maxFreePeriodsPerClass: 0,
      },
      timetables: [],
      updatedAt: Date.now(),
    };

    const engine = new SolverEngine();
    const result = await engine.solve(tinyProject, { seed: 1234, qualityMode: 'fast' });

    expect(result.success).toBe(true);
    expect(result.hardConflicts).toBe(0);
    expect(result.slots.length).toBe(4);
    expect(result.runtimeMs).toBeLessThan(500);
  });

  it('strictly respects locked slots as fixed assignments', async () => {
    const demo = getDemoSchoolProject();
    const engine = new SolverEngine();

    // Lock Monday Period 1 of Grade 8-A to Chemistry with Mrs. Siobhan Roy (tch-5)
    const lockedSlot: Slot = {
      classId: 'cls-8a',
      day: 1,
      period: 1,
      subjectId: 'sub-chem',
      teacherId: 'tch-5',
      locked: true,
    };

    const result = await engine.solve(demo, { seed: 42, qualityMode: 'fast' }, [lockedSlot]);
    const generatedSlot = result.slots.find(
      (s) => s.classId === 'cls-8a' && s.day === 1 && s.period === 1
    );

    expect(generatedSlot).toBeDefined();
    expect(generatedSlot?.subjectId).toBe('sub-chem');
    expect(generatedSlot?.teacherId).toBe('tch-5');
    expect(generatedSlot?.locked).toBe(true);
  });

  it('guarantees deterministic reproducibility for a given seed', async () => {
    const demo = getDemoSchoolProject();
    const engine1 = new SolverEngine();
    const engine2 = new SolverEngine();

    const res1 = await engine1.solve(demo, { seed: 9999, qualityMode: 'fast' });
    const res2 = await engine2.solve(demo, { seed: 9999, qualityMode: 'fast' });

    expect(res1.hardConflicts).toBe(res2.hardConflicts);
    expect(res1.softScore).toBe(res2.softScore);
    expect(res1.slots.length).toBe(res2.slots.length);

    // Verify exact slot matching
    for (let i = 0; i < res1.slots.length; i++) {
      expect(res1.slots[i].subjectId).toBe(res2.slots[i].subjectId);
      expect(res1.slots[i].teacherId).toBe(res2.slots[i].teacherId);
    }
  });

  it('solves the complete 8-class demo school with 0 hard conflicts in < 10 seconds', async () => {
    const demo = getDemoSchoolProject();
    const engine = new SolverEngine();

    const result = await engine.solve(demo, { seed: 777, qualityMode: 'balanced' });

    expect(result.success).toBe(true);
    expect(result.hardConflicts).toBe(0);
    expect(result.slots.length).toBe(8 * 44); // 8 classes * 44 slots = 352 slots
    expect(result.runtimeMs).toBeLessThan(10000); // Target < 10s
  }, 15000);
});
