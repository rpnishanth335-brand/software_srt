import { describe, it, expect } from 'vitest';
import { 
  slotsPerClass, 
  requiredPerClass, 
  teacherLoad, 
  teacherCapacity, 
  roomContention, 
  pigeonholeChecks, 
  runFeasibilityAudit 
} from '../feasibility';
import { getDemoSchoolProject } from '../../store/demoSchool';
import { School, Teacher, Assignment, Subject } from '../../types';

describe('Feasibility Calculation Engine (/src/calc)', () => {
  const demoProject = getDemoSchoolProject();

  it('calculates total slots per class accurately with irregular day period counts', () => {
    // Mon-Fri: 8 periods, Sat: 4 periods -> Total: 44
    const totalSlots = slotsPerClass(demoProject.school, 'cls-8a');
    expect(totalSlots).toBe(44);
  });

  it('calculates required periods for a class accurately', () => {
    const required = requiredPerClass(demoProject.assignments, 'cls-8a');
    expect(required).toBe(44);
  });

  it('calculates faculty load accurately across cohorts', () => {
    // Dr. Evelyn Reed (tch-1) teaches Math to 8A, 8B, 9A, 9B (6 periods each = 24 periods)
    const load = teacherLoad(demoProject.assignments, 'tch-1');
    expect(load).toBe(24);
  });

  it('calculates faculty capacity and available slots respecting blocked periods', () => {
    const teacher: Teacher = {
      id: 'test-tch',
      name: 'Test Teacher',
      code: 'TT',
      subjectIds: ['sub-math'],
      classIds: ['cls-8a'],
      maxPerDay: 5,
      maxPerWeek: 25,
      maxConsecutive: 3,
      blocked: [
        { day: 1, period: 1 },
        { day: 1, period: 2 },
      ],
    };

    const capacity = teacherCapacity(demoProject.school, teacher);
    expect(capacity.maxPerWeek).toBe(25);
    // 44 total slots - 2 blocked = 42 available slots
    expect(capacity.availableSlots).toBe(42);
  });

  it('returns isFeasible: true and 0 blocking errors for the standard demo school', () => {
    const result = runFeasibilityAudit(demoProject);
    expect(result.isFeasible).toBe(true);
    expect(result.blockingErrors.length).toBe(0);
  });

  it('detects over-allocated class cohort and suggests exact reduction', () => {
    const altered = JSON.parse(JSON.stringify(demoProject));
    // Add extra 3 periods to Grade 8-A Math
    const mathAssignment = altered.assignments.find(
      (a: Assignment) => a.classId === 'cls-8a' && a.subjectId === 'sub-math'
    );
    if (mathAssignment) {
      mathAssignment.periodsPerWeek += 3; // now 47 instead of 44
    }

    const result = runFeasibilityAudit(altered);
    expect(result.isFeasible).toBe(false);
    const overError = result.blockingErrors.find((e) => e.code === 'ERR_CLASS_OVER_ALLOCATED');
    expect(overError).toBeDefined();
    expect(overError?.message).toContain('3 slots over');
    expect(overError?.suggestion).toContain('Reduce assigned subject periods for Grade 8–A by 3');
  });

  it('detects unassigned teacher for required periods', () => {
    const altered = JSON.parse(JSON.stringify(demoProject));
    // Clear teacher ID for Grade 8-A Physics
    const phyAssignment = altered.assignments.find(
      (a: Assignment) => a.classId === 'cls-8a' && a.subjectId === 'sub-phy'
    );
    if (phyAssignment) {
      phyAssignment.teacherId = '';
    }

    const result = runFeasibilityAudit(altered);
    expect(result.isFeasible).toBe(false);
    const teacherError = result.blockingErrors.find((e) => e.code === 'ERR_UNASSIGNED_TEACHER');
    expect(teacherError).toBeDefined();
    expect(teacherError?.message).toContain('without an assigned teacher');
  });

  it('calls pigeonholeChecks directly and catches excessive teacher load', () => {
    const alteredTeachers = [{
      ...demoProject.teachers[0],
      maxPerWeek: 10, // Assigned load is 24
    }];
    const diag = pigeonholeChecks(demoProject.assignments, alteredTeachers, demoProject.school, demoProject.classes);
    expect(diag.length).toBeGreaterThan(0);
    expect(diag[0].code).toBe('ERR_TEACHER_MAX_LOAD');
  });

  it('detects teacher pigeonhole overload when assigned periods exceed non-blocked slots', () => {
    const altered = JSON.parse(JSON.stringify(demoProject));
    // Block 30 slots for Dr. Evelyn Reed (tch-1) who has 24 assigned periods (44 - 30 = 14 available < 24 required)
    const tch = altered.teachers.find((t: Teacher) => t.id === 'tch-1');
    if (tch) {
      for (let d = 1; d <= 5; d++) {
        for (let p = 1; p <= 6; p++) {
          tch.blocked.push({ day: d, period: p });
        }
      }
    }

    const result = runFeasibilityAudit(altered);
    expect(result.isFeasible).toBe(false);
    const pigeonholeError = result.blockingErrors.find(
      (e) => e.code === 'ERR_TEACHER_UNAVAILABLE_SLOTS'
    );
    expect(pigeonholeError).toBeDefined();
    expect(pigeonholeError?.message).toContain('non-blocked slots available');
  });

  it('verifies rooms do not constrain generation (rooms decoupled from solver)', () => {
    const subjects: Subject[] = [
      {
        id: 'sub-lab1',
        name: 'Robotics Lab',
        code: 'ROBO',
        color: '#6366f1',
        type: 'lab',
        doublePeriod: true,
        maxPerDay: 2,
        preferMorning: false,
      },
    ];

    const school: School = {
      name: 'Test School',
      year: '2026',
      days: [1, 2, 3, 4, 5],
      periodsByDay: { 1: 8, 2: 8, 3: 8, 4: 8, 5: 8 }, // 40 slots
      periodTimes: [],
      breaks: [],
    };

    const assignments: Assignment[] = [
      { classId: 'c1', subjectId: 'sub-lab1', teacherId: 't1', periodsPerWeek: 30 },
      { classId: 'c2', subjectId: 'sub-lab1', teacherId: 't2', periodsPerWeek: 20 },
    ];

    const diagnostics = roomContention(assignments, subjects, school);
    // Rooms are virtual labels only and do not constrain timetable generation
    expect(diagnostics.length).toBe(0);
  });
});
