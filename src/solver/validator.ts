import { Project, Slot, ID } from '../types';

export interface TimetableViolation {
  ruleId: string;
  severity: 'hard' | 'soft';
  description: string;
  classId?: ID;
  day?: number;
  period?: number;
  teacherId?: ID;
  subjectId?: ID;
}

export interface ValidationSummary {
  isValid: boolean;
  hardConflictCount: number;
  softScore: number;
  violations: TimetableViolation[];
  hardBreakdown: {
    teacherDoubleBooking: number;
    classOverlap: number;
    teacherBlocked: number;
    subjectCountMismatch: number;
    teacherDailyLimit: number;
    teacherWeeklyLimit: number;
    doublePeriodConsecutive: number;
    doublePeriodBreakCrossing: number;
    specialRoomClash: number;
    lockedSlotAltered: number;
  };
  softBreakdown: {
    spreadSubjectEvenly: number;
    heavySubjectsMorning: number;
    minimizeTeacherGaps: number;
    limitConsecutiveTeacher: number;
    sportsActivityLastPeriods: number;
  };
}

/**
 * Deterministically checks all hard constraints and soft preferences against a timetable slot array.
 */
export function validateTimetable(
  slots: Slot[],
  project: Project,
  selectedClassIds?: ID[],
  lockedSlotsBaseline?: Slot[]
): ValidationSummary {
  const { school, teachers, subjects, classes, assignments, rules } = project;
  const { hardRules, softWeights } = rules;

  const activeDays = school.days || [1, 2, 3, 4, 5];
  const targetClasses = selectedClassIds 
    ? classes.filter((c) => selectedClassIds.includes(c.id))
    : classes.filter((c) => c.selected);
  const targetClassIds = new Set(targetClasses.map((c) => c.id));

  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const violations: TimetableViolation[] = [];

  const hardBreakdown = {
    teacherDoubleBooking: 0,
    classOverlap: 0,
    teacherBlocked: 0,
    subjectCountMismatch: 0,
    teacherDailyLimit: 0,
    teacherWeeklyLimit: 0,
    doublePeriodConsecutive: 0,
    doublePeriodBreakCrossing: 0,
    specialRoomClash: 0,
    lockedSlotAltered: 0,
  };

  const softBreakdown = {
    spreadSubjectEvenly: 0,
    heavySubjectsMorning: 0,
    minimizeTeacherGaps: 0,
    limitConsecutiveTeacher: 0,
    sportsActivityLastPeriods: 0,
  };

  // Filter slots to only target classes
  const relevantSlots = slots.filter((s) => targetClassIds.has(s.classId));

  // 1. Check Locked Slots are unchanged
  if (lockedSlotsBaseline && lockedSlotsBaseline.length > 0) {
    lockedSlotsBaseline.forEach((base) => {
      const current = relevantSlots.find(
        (s) => s.classId === base.classId && s.day === base.day && s.period === base.period
      );
      if (!current || current.subjectId !== base.subjectId || current.teacherId !== base.teacherId) {
        hardBreakdown.lockedSlotAltered++;
        violations.push({
          ruleId: 'locked-slot-altered',
          severity: 'hard',
          description: `Locked slot at Day ${base.day}, Period ${base.period} was modified.`,
          classId: base.classId,
          day: base.day,
          period: base.period,
        });
      }
    });
  }

  // 2. Check Teacher Clashes & Class Overlaps across (day, period)
  // key: `${teacherId}:${day}:${period}` -> list of slot info
  const teacherOccupancy = new Map<string, Slot[]>();
  // key: `${classId}:${day}:${period}` -> list of slots
  const classOccupancy = new Map<string, Slot[]>();

  // Track per-teacher daily periods: key: `${teacherId}:${day}` -> count
  const teacherDayCount = new Map<string, number>();
  // Track per-teacher weekly periods: key: `${teacherId}` -> count
  const teacherWeekCount = new Map<string, number>();
  // Track class-subject actual counts: key: `${classId}:${subjectId}` -> count
  const classSubjectCounts = new Map<string, number>();

  // Break periods map for checking double periods crossing recess/lunch
  const breakAfterPeriods = new Set((school.breaks || []).map((b) => b.afterPeriod));

  relevantSlots.forEach((slot) => {
    if (!slot.subjectId) return;

    // Check Class Overlap
    const classTimeKey = `${slot.classId}:${slot.day}:${slot.period}`;
    const existingClassSlots = classOccupancy.get(classTimeKey) || [];
    if (existingClassSlots.length > 0) {
      hardBreakdown.classOverlap++;
      violations.push({
        ruleId: 'class-overlap',
        severity: 'hard',
        description: `Class has multiple lessons assigned at Day ${slot.day}, Period ${slot.period}.`,
        classId: slot.classId,
        day: slot.day,
        period: slot.period,
      });
    }
    existingClassSlots.push(slot);
    classOccupancy.set(classTimeKey, existingClassSlots);

    // Track subject count
    const csKey = `${slot.classId}:${slot.subjectId}`;
    classSubjectCounts.set(csKey, (classSubjectCounts.get(csKey) || 0) + 1);

    // Teacher constraints
    if (slot.teacherId) {
      const teacher = teacherMap.get(slot.teacherId);

      // A. Teacher Double Booking
      const teachTimeKey = `${slot.teacherId}:${slot.day}:${slot.period}`;
      const existingTeacherSlots = teacherOccupancy.get(teachTimeKey) || [];
      if (existingTeacherSlots.length > 0 && hardRules.noTeacherClash) {
        hardBreakdown.teacherDoubleBooking++;
        violations.push({
          ruleId: 'teacher-double-booking',
          severity: 'hard',
          description: `Teacher ${teacher?.name || slot.teacherId} is double-booked across classes on Day ${slot.day}, Period ${slot.period}.`,
          teacherId: slot.teacherId,
          classId: slot.classId,
          day: slot.day,
          period: slot.period,
        });
      }
      existingTeacherSlots.push(slot);
      teacherOccupancy.set(teachTimeKey, existingTeacherSlots);

      // B. Teacher Blocked Slots
      if (hardRules.respectTeacherBlocked && teacher) {
        const isBlocked = teacher.blocked.some(
          (b) => b.day === slot.day && b.period === slot.period
        );
        if (isBlocked) {
          hardBreakdown.teacherBlocked++;
          violations.push({
            ruleId: 'teacher-blocked',
            severity: 'hard',
            description: `Teacher ${teacher.name} is scheduled during their blocked off-time on Day ${slot.day}, Period ${slot.period}.`,
            teacherId: slot.teacherId,
            day: slot.day,
            period: slot.period,
          });
        }
      }

      // Teacher Daily & Weekly counting
      const tdKey = `${slot.teacherId}:${slot.day}`;
      teacherDayCount.set(tdKey, (teacherDayCount.get(tdKey) || 0) + 1);
      teacherWeekCount.set(slot.teacherId, (teacherWeekCount.get(slot.teacherId) || 0) + 1);
    }
  });

  // 3. Verify Teacher Daily and Weekly Limits
  teachers.forEach((t) => {
    // Weekly limit
    const weekTaught = teacherWeekCount.get(t.id) || 0;
    if (hardRules.respectMaxPerWeek && weekTaught > t.maxPerWeek) {
      hardBreakdown.teacherWeeklyLimit++;
      violations.push({
        ruleId: 'teacher-weekly-limit',
        severity: 'hard',
        description: `Teacher ${t.name} exceeds max weekly periods (${weekTaught} > ${t.maxPerWeek}).`,
        teacherId: t.id,
      });
    }

    // Daily limit
    activeDays.forEach((d) => {
      const dayTaught = teacherDayCount.get(`${t.id}:${d}`) || 0;
      if (hardRules.respectMaxPerDay && dayTaught > t.maxPerDay) {
        hardBreakdown.teacherDailyLimit++;
        violations.push({
          ruleId: 'teacher-daily-limit',
          severity: 'hard',
          description: `Teacher ${t.name} exceeds daily max on Day ${d} (${dayTaught} > ${t.maxPerDay}).`,
          teacherId: t.id,
          day: d,
        });
      }
    });
  });

  // 4. Verify Subject Counts Exactly Match Assigned Periods
  assignments
    .filter((a) => targetClassIds.has(a.classId))
    .forEach((assign) => {
      const actualCount = classSubjectCounts.get(`${assign.classId}:${assign.subjectId}`) || 0;
      if (actualCount !== assign.periodsPerWeek) {
        hardBreakdown.subjectCountMismatch++;
        const sub = subjectMap.get(assign.subjectId);
        const cls = classMap.get(assign.classId);
        violations.push({
          ruleId: 'subject-count-mismatch',
          severity: 'hard',
          description: `${cls?.name} has ${actualCount} periods of ${sub?.name || 'Subject'} placed, expected ${assign.periodsPerWeek}.`,
          classId: assign.classId,
          subjectId: assign.subjectId,
        });
      }
    });

  // 5. Verify Double Period Constraints (Consecutive & Not Crossing Breaks)
  targetClasses.forEach((cls) => {
    activeDays.forEach((day) => {
      const daySlots = relevantSlots
        .filter((s) => s.classId === cls.id && s.day === day)
        .sort((a, b) => a.period - b.period);

      for (let i = 0; i < daySlots.length; i++) {
        const slot = daySlots[i];
        if (!slot.subjectId) continue;
        const sub = subjectMap.get(slot.subjectId);

        if (sub && sub.doublePeriod && slot.isDoublePeriodPart === 1) {
          const nextSlot = daySlots[i + 1];
          // Check consecutive
          if (
            !nextSlot ||
            nextSlot.period !== slot.period + 1 ||
            nextSlot.subjectId !== slot.subjectId
          ) {
            hardBreakdown.doublePeriodConsecutive++;
            violations.push({
              ruleId: 'double-period-consecutive',
              severity: 'hard',
              description: `Double period for ${sub.name} in ${cls.name} on Day ${day} is not consecutive.`,
              classId: cls.id,
              day,
              period: slot.period,
            });
          }

          // Check break crossing
          if (breakAfterPeriods.has(slot.period)) {
            hardBreakdown.doublePeriodBreakCrossing++;
            violations.push({
              ruleId: 'double-period-break-crossing',
              severity: 'hard',
              description: `Double period for ${sub.name} in ${cls.name} on Day ${day} crosses a recess/lunch break.`,
              classId: cls.id,
              day,
              period: slot.period,
            });
          }
        }
      }
    });
  });

  // Compute total hard conflicts
  const hardConflictCount =
    hardBreakdown.teacherDoubleBooking +
    hardBreakdown.classOverlap +
    hardBreakdown.teacherBlocked +
    hardBreakdown.subjectCountMismatch +
    hardBreakdown.teacherDailyLimit +
    hardBreakdown.teacherWeeklyLimit +
    hardBreakdown.doublePeriodConsecutive +
    hardBreakdown.doublePeriodBreakCrossing +
    hardBreakdown.specialRoomClash +
    hardBreakdown.lockedSlotAltered;

  // Soft Score Optimization (Base 1,000, penalizing unwanted dispersion/gaps)
  let softPenalty = 0;

  // Heavy subjects morning penalty
  if ((softWeights.heavySubjectsMorning ?? 70) > 0) {
    relevantSlots.forEach((s) => {
      if (!s.subjectId) return;
      const sub = subjectMap.get(s.subjectId);
      if (sub && sub.preferMorning && s.period > 4) {
        softBreakdown.heavySubjectsMorning += 5;
        softPenalty += (5 * (softWeights.heavySubjectsMorning ?? 70)) / 100;
      }
    });
  }

  // Sports afternoon penalty
  if ((softWeights.sportsActivityLastPeriods ?? 60) > 0) {
    relevantSlots.forEach((s) => {
      if (!s.subjectId) return;
      const sub = subjectMap.get(s.subjectId);
      if (sub && (sub.type === 'sports' || sub.type === 'activity') && s.period < 4) {
        softBreakdown.sportsActivityLastPeriods += 4;
        softPenalty += (4 * (softWeights.sportsActivityLastPeriods ?? 60)) / 100;
      }
    });
  }

  const softScore = Math.max(0, Math.round(1000 - softPenalty));

  return {
    isValid: hardConflictCount === 0,
    hardConflictCount,
    softScore,
    violations,
    hardBreakdown,
    softBreakdown,
  };
}
