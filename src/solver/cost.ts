import { Project, ID } from '../types';
import { Lesson } from './types';

export interface GridSlotPlacement {
  classId: ID;
  day: number;
  period: number;
  lesson: Lesson | null;
}

export interface EvaluationResult {
  hardViolations: number;
  softScore: number;
  hardBreakdown: Record<string, number>;
  softBreakdown: Record<string, number>;
}

/**
 * Fast cost evaluation function for the timetable state.
 * Hard penalty multiplier is 10,000 to strictly dominate soft optimization penalties.
 */
export function evaluateTimetableState(
  placements: Map<string, Lesson>, // key: `${classId}:${day}:${period}`
  project: Project,
  selectedClassIds: ID[]
): EvaluationResult {
  const { school, teachers, subjects, rules } = project;
  const { hardRules, softWeights } = rules;

  let hardViolations = 0;
  let softPenalty = 0;

  const hardBreakdown: Record<string, number> = {
    teacherClash: 0,
    teacherBlocked: 0,
    teacherDailyLimit: 0,
    doublePeriodConsecutive: 0,
    doublePeriodBreakCrossing: 0,
    specialRoomClash: 0,
  };

  const softBreakdown: Record<string, number> = {
    spreadEvenly: 0,
    heavyMorning: 0,
    teacherGaps: 0,
    consecutiveLimit: 0,
    sportsLate: 0,
  };

  // Pre-index teacher lookups for speed
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // 1. Check Teacher Clashes across (day, period)
  // key: `${day}:${period}`, value: list of teachers
  const teacherTimeIndex = new Map<string, ID[]>();
  // key: `${teacherId}:${day}`, value: sorted list of periods
  const teacherDayPeriods = new Map<string, number[]>();
  // key: `${classId}:${subjectId}:${day}`, value: count of periods
  const classSubjectDayCount = new Map<string, number>();

  placements.forEach((lesson, key) => {
    if (!lesson) return;
    const [, dayStr, periodStr] = key.split(':');
    const day = parseInt(dayStr, 10);
    const period = parseInt(periodStr, 10);

    const timeKey = `${day}:${period}`;

    // A. Teacher clash check
    if (hardRules.noTeacherClash && lesson.teacherId) {
      const existing = teacherTimeIndex.get(timeKey) || [];
      if (existing.includes(lesson.teacherId)) {
        hardBreakdown.teacherClash++;
      }
      existing.push(lesson.teacherId);
      teacherTimeIndex.set(timeKey, existing);

      // Track teacher periods on day
      const teacherDayKey = `${lesson.teacherId}:${day}`;
      const periodsOnDay = teacherDayPeriods.get(teacherDayKey) || [];
      periodsOnDay.push(period);
      teacherDayPeriods.set(teacherDayKey, periodsOnDay);
    }

    // C. Teacher blocked slots
    if (hardRules.respectTeacherBlocked && lesson.teacherId) {
      const teacher = teacherMap.get(lesson.teacherId);
      if (teacher) {
        const isBlocked = teacher.blocked.some((b) => b.day === day && b.period === period);
        if (isBlocked) {
          hardBreakdown.teacherBlocked++;
        }
      }
    }

    // Track subject count per day for class (for even dispersion)
    const classSubjectKey = `${lesson.classId}:${lesson.subjectId}:${day}`;
    classSubjectDayCount.set(
      classSubjectKey,
      (classSubjectDayCount.get(classSubjectKey) || 0) + 1
    );

    // Soft rule: Morning preference for heavy subjects
    if (lesson.preferMorning && period > 4) {
      softBreakdown.heavyMorning += (period - 4);
    }

    // Soft rule: Sports / activities prefer late periods
    const sub = subjectMap.get(lesson.subjectId);
    if (sub && (sub.type === 'sports' || sub.type === 'activity')) {
      const maxP = school.periodsByDay[day] || 8;
      if (period < maxP - 2) {
        softBreakdown.sportsLate += (maxP - period);
      }
    }
  });

  // 2. Check Teacher Daily Limits, Gaps, and Consecutive Periods
  teacherDayPeriods.forEach((periods, teacherDayKey) => {
    const [teacherId] = teacherDayKey.split(':');
    const teacher = teacherMap.get(teacherId);
    if (!teacher) return;

    // Daily limit
    if (hardRules.respectMaxPerDay && periods.length > teacher.maxPerDay) {
      hardBreakdown.teacherDailyLimit += (periods.length - teacher.maxPerDay);
    }

    // Sort periods to evaluate gaps and consecutive stretches
    periods.sort((a, b) => a - b);

    // Gaps calculation (e.g. teaching P1 and P4 has a gap of 2)
    if (periods.length > 1) {
      const span = periods[periods.length - 1] - periods[0] + 1;
      const gaps = span - periods.length;
      if (gaps > 0) {
        softBreakdown.teacherGaps += gaps;
      }

      // Consecutive teaching stretch
      let currentConsecutive = 1;
      let maxConsecutiveObserved = 1;
      for (let i = 1; i < periods.length; i++) {
        if (periods[i] === periods[i - 1] + 1) {
          currentConsecutive++;
          if (currentConsecutive > maxConsecutiveObserved) {
            maxConsecutiveObserved = currentConsecutive;
          }
        } else {
          currentConsecutive = 1;
        }
      }

      if (maxConsecutiveObserved > teacher.maxConsecutive) {
        softBreakdown.consecutiveLimit += (maxConsecutiveObserved - teacher.maxConsecutive) * 2;
      }
    }
  });

  // 3. Subject Even Dispersion Soft Penalty
  classSubjectDayCount.forEach((count, key) => {
    const [, subjectId] = key.split(':');
    const sub = subjectMap.get(subjectId);
    // If subject is single period, having it > 1 on the same day is penalized
    if (sub && !sub.doublePeriod && count > 1) {
      softBreakdown.spreadEvenly += (count - 1) * 3;
    }
  });

  // 4. Double Period Pair Checks (Consecutiveness & Break Crossing)
  selectedClassIds.forEach((classId) => {
    school.days.forEach((day) => {
      const maxP = school.periodsByDay[day] || 8;
      for (let p = 1; p <= maxP; p++) {
        const lesson = placements.get(`${classId}:${day}:${p}`);
        if (lesson && lesson.isDoublePeriod && lesson.part === 1) {
          // Part 2 must be in p + 1 on the same day and class
          const nextLesson = placements.get(`${classId}:${day}:${p + 1}`);
          if (!nextLesson || nextLesson.subjectId !== lesson.subjectId || nextLesson.part !== 2) {
            hardBreakdown.doublePeriodConsecutive++;
          }

          // Check if break occurs between p and p + 1
          const crossesBreak = school.breaks.some((b) => b.afterPeriod === p);
          if (crossesBreak && hardRules.doublePeriodsNoBreakCrossing) {
            hardBreakdown.doublePeriodBreakCrossing++;
          }
        }
      }
    });
  });

  // Sum all hard violations
  hardViolations = 
    hardBreakdown.teacherClash +
    hardBreakdown.teacherBlocked +
    hardBreakdown.teacherDailyLimit +
    hardBreakdown.doublePeriodConsecutive +
    hardBreakdown.doublePeriodBreakCrossing +
    hardBreakdown.specialRoomClash;

  // Weight soft penalties
  softPenalty = 
    (softBreakdown.spreadEvenly * ((softWeights.spreadSubjectEvenly ?? 50) / 50)) +
    (softBreakdown.heavyMorning * ((softWeights.heavySubjectsMorning ?? 50) / 50)) +
    (softBreakdown.teacherGaps * ((softWeights.minimizeTeacherGaps ?? 50) / 50)) +
    (softBreakdown.consecutiveLimit * ((softWeights.limitConsecutiveTeacher ?? 50) / 50)) +
    (softBreakdown.sportsLate * ((softWeights.sportsActivityLastPeriods ?? 50) / 50));

  return {
    hardViolations,
    softScore: Math.round(softPenalty),
    hardBreakdown,
    softBreakdown,
  };
}
