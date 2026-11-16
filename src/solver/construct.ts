import { Project, ID, Slot } from '../types';
import { Lesson } from './types';
import { Mulberry32 } from './prng';

/**
 * Decomposes assignments into individual lesson units and pairs double-period subjects.
 */
export function generateLessonUnits(
  project: Project,
  selectedClassIds: ID[],
  lockedSlots: Slot[] = []
): { lessons: Lesson[]; lockedMap: Map<string, Slot> } {
  const { assignments, subjects } = project;
  const lessons: Lesson[] = [];
  const lockedMap = new Map<string, Slot>();

  lockedSlots.forEach((s) => {
    if (s.subjectId && s.teacherId) {
      lockedMap.set(`${s.classId}:${s.day}:${s.period}`, s);
    }
  });

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  selectedClassIds.forEach((classId) => {
    const classAssignments = assignments.filter((a) => a.classId === classId);

    classAssignments.forEach((a) => {
      const sub = subjectMap.get(a.subjectId);
      if (!sub) return;

      let remainingPeriods = a.periodsPerWeek;

      // Handle double periods
      if (sub.doublePeriod) {
        while (remainingPeriods >= 2) {
          const pairId = `pair-${classId}-${sub.id}-${lessons.length}`;
          const l1Id = `${pairId}-p1`;
          const l2Id = `${pairId}-p2`;

          lessons.push({
            id: l1Id,
            classId,
            subjectId: sub.id,
            teacherId: a.teacherId,
            isDoublePeriod: true,
            part: 1,
            pairedWithLessonId: l2Id,
            specialRoomId: sub.specialRoomId,
            preferMorning: sub.preferMorning,
            maxPerDay: sub.maxPerDay,
          });

          lessons.push({
            id: l2Id,
            classId,
            subjectId: sub.id,
            teacherId: a.teacherId,
            isDoublePeriod: true,
            part: 2,
            pairedWithLessonId: l1Id,
            specialRoomId: sub.specialRoomId,
            preferMorning: sub.preferMorning,
            maxPerDay: sub.maxPerDay,
          });

          remainingPeriods -= 2;
        }
      }

      // Handle remaining single periods
      while (remainingPeriods > 0) {
        lessons.push({
          id: `single-${classId}-${sub.id}-${lessons.length}`,
          classId,
          subjectId: sub.id,
          teacherId: a.teacherId,
          isDoublePeriod: false,
          specialRoomId: sub.specialRoomId,
          preferMorning: sub.preferMorning,
          maxPerDay: sub.maxPerDay,
        });
        remainingPeriods -= 1;
      }
    });
  });

  return { lessons, lockedMap };
}

/**
 * Phase A: Most-Constrained-First Initial Construction.
 * Places double periods, lab-bound lessons, and scarce-teacher lessons first.
 */
export function constructInitialGrid(
  lessons: Lesson[],
  project: Project,
  _selectedClassIds: ID[],
  prng: Mulberry32,
  lockedMap: Map<string, Slot>
): Map<string, Lesson> {
  const placements = new Map<string, Lesson>();
  const { school, teachers } = project;
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  // 1. First, place all locked slots
  lockedMap.forEach((s, key) => {
    placements.set(key, {
      id: `locked-${key}`,
      classId: s.classId,
      subjectId: s.subjectId!,
      teacherId: s.teacherId!,
      isDoublePeriod: false,
      preferMorning: false,
      maxPerDay: 4,
      locked: true,
    });
  });

  // Calculate teacher scarcity score (fewer available slots / higher load = higher score)
  const teacherScarcity = new Map<ID, number>();
  teachers.forEach((t) => {
    const blockedCount = t.blocked.length;
    teacherScarcity.set(t.id, blockedCount * 2 + t.maxPerWeek);
  });

  // Separate double period pairs from singles
  const doublePeriodPairs: Array<{ p1: Lesson; p2: Lesson }> = [];
  const singleLessons: Lesson[] = [];

  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    if (l.isDoublePeriod && l.part === 1) {
      const p2 = lessons.find((x) => x.id === l.pairedWithLessonId);
      if (p2) {
        doublePeriodPairs.push({ p1: l, p2 });
      }
    } else if (!l.isDoublePeriod) {
      singleLessons.push(l);
    }
  }

  // Sort double periods: labs first, then scarce teachers
  doublePeriodPairs.sort((a, b) => {
    if (a.p1.specialRoomId && !b.p1.specialRoomId) return -1;
    if (!a.p1.specialRoomId && b.p1.specialRoomId) return 1;
    return (teacherScarcity.get(b.p1.teacherId) || 0) - (teacherScarcity.get(a.p1.teacherId) || 0);
  });

  // Sort single lessons: scarce teachers first, then morning preference
  singleLessons.sort((a, b) => {
    if (a.preferMorning && !b.preferMorning) return -1;
    if (!a.preferMorning && b.preferMorning) return 1;
    return (teacherScarcity.get(b.teacherId) || 0) - (teacherScarcity.get(a.teacherId) || 0);
  });

  // Helper to test if slot is free for class
  const isFree = (classId: ID, day: number, period: number) => {
    return !placements.has(`${classId}:${day}:${period}`);
  };

  // Helper to check if teacher or room is currently busy
  const isTeacherBusy = (teacherId: ID, day: number, period: number) => {
    for (const [key, l] of placements.entries()) {
      const [, d, p] = key.split(':').map(Number);
      if (d === day && p === period && l.teacherId === teacherId) return true;
    }
    return false;
  };

  const isTeacherBlocked = (teacherId: ID, day: number, period: number) => {
    const teacher = teacherMap.get(teacherId);
    return teacher ? teacher.blocked.some((b) => b.day === day && b.period === period) : false;
  };

  // Helper to generate disjoint double period block slots for a day
  const getDisjointDoubleBlocks = (day: number) => {
    const maxP = school.periodsByDay[day] || 8;
    const blocks: Array<{ p1: number; p2: number }> = [];
    for (let p = 1; p < maxP; p += 2) {
      const crossesBreak = school.breaks.some((b) => b.afterPeriod === p);
      if (!crossesBreak) {
        blocks.push({ p1: p, p2: p + 1 });
      }
    }
    return blocks;
  };

  // 2. Place Double Period Pairs in Disjoint Blocks
  doublePeriodPairs.forEach(({ p1, p2 }) => {
    const classId = p1.classId;
    let placed = false;

    // Shuffle active days
    const days = prng.shuffle([...school.days]);

    for (const day of days) {
      if (placed) break;
      const blocks = prng.shuffle(getDisjointDoubleBlocks(day));

      for (const block of blocks) {
        const { p1: p, p2: pNext } = block;

        if (
          isFree(classId, day, p) &&
          isFree(classId, day, pNext) &&
          !isTeacherBusy(p1.teacherId, day, p) &&
          !isTeacherBusy(p1.teacherId, day, pNext) &&
          !isTeacherBlocked(p1.teacherId, day, p) &&
          !isTeacherBlocked(p1.teacherId, day, pNext)
        ) {
          placements.set(`${classId}:${day}:${p}`, p1);
          placements.set(`${classId}:${day}:${pNext}`, p2);
          placed = true;
          break;
        }
      }
    }

    // Fallback: place in any free disjoint block
    if (!placed) {
      for (const day of days) {
        if (placed) break;
        const blocks = prng.shuffle(getDisjointDoubleBlocks(day));
        for (const block of blocks) {
          const { p1: p, p2: pNext } = block;
          if (isFree(classId, day, p) && isFree(classId, day, pNext)) {
            placements.set(`${classId}:${day}:${p}`, p1);
            placements.set(`${classId}:${day}:${pNext}`, p2);
            placed = true;
            break;
          }
        }
      }
    }
  });

  // 3. Place Single Lessons
  singleLessons.forEach((lesson) => {
    const classId = lesson.classId;
    let placed = false;

    const days = prng.shuffle([...school.days]);

    // First attempt: zero clash placement
    for (const day of days) {
      if (placed) break;
      const maxP = school.periodsByDay[day] || 8;
      const periods = lesson.preferMorning
        ? [1, 2, 3, 4, 5, 6, 7, 8].filter((p) => p <= maxP)
        : prng.shuffle([1, 2, 3, 4, 5, 6, 7, 8].filter((p) => p <= maxP));

      for (const p of periods) {
        if (
          isFree(classId, day, p) &&
          !isTeacherBusy(lesson.teacherId, day, p) &&
          !isTeacherBlocked(lesson.teacherId, day, p)
        ) {
          placements.set(`${classId}:${day}:${p}`, lesson);
          placed = true;
          break;
        }
      }
    }

    // Fallback: place in any free slot of that class
    if (!placed) {
      for (const day of days) {
        if (placed) break;
        const maxP = school.periodsByDay[day] || 8;
        for (let p = 1; p <= maxP; p++) {
          if (isFree(classId, day, p)) {
            placements.set(`${classId}:${day}:${p}`, lesson);
            placed = true;
            break;
          }
        }
      }
    }
  });

  return placements;
}
