import { 
  Project, 
  School, 
  ClassRoom, 
  Subject, 
  Teacher, 
  Assignment, 
  ID, 
  DiagnosticItem, 
  FeasibilityResult 
} from '../types';

/**
 * Computes the total available lesson slots for a given class over the active school week.
 */
export function slotsPerClass(school: School, _classId: ID): number {
  return school.days.reduce((total, d) => total + (school.periodsByDay[d] || 8), 0);
}

/**
 * Computes the total required periods assigned to a given class.
 */
export function requiredPerClass(assignments: Assignment[], classId: ID): number {
  return assignments
    .filter((a) => a.classId === classId)
    .reduce((sum, a) => sum + a.periodsPerWeek, 0);
}

/**
 * Computes the total weekly teaching load assigned to a specific teacher.
 */
export function teacherLoad(assignments: Assignment[], teacherId: ID): number {
  return assignments
    .filter((a) => a.teacherId === teacherId)
    .reduce((sum, a) => sum + a.periodsPerWeek, 0);
}

/**
 * Computes a teacher's maximum capacity vs non-blocked available slots.
 */
export function teacherCapacity(school: School, teacher: Teacher): { maxPerWeek: number; availableSlots: number } {
  let totalWeekSlots = 0;
  school.days.forEach((d) => {
    totalWeekSlots += (school.periodsByDay[d] || 8);
  });

  const blockedCount = teacher.blocked.filter((b) => {
    const isDayActive = school.days.includes(b.day);
    const isWithinPeriods = b.period <= (school.periodsByDay[b.day] || 8);
    return isDayActive && isWithinPeriods;
  }).length;

  const availableSlots = Math.max(0, totalWeekSlots - blockedCount);

  return {
    maxPerWeek: teacher.maxPerWeek,
    availableSlots,
  };
}

/**
 * Computes the total weekly demand for a given subject across all selected classes.
 */
export function subjectDemand(assignments: Assignment[], subjectId: ID): number {
  return assignments
    .filter((a) => a.subjectId === subjectId)
    .reduce((sum, a) => sum + a.periodsPerWeek, 0);
}

/**
 * Identifies special-room or laboratory over-subscription collisions.
 * e.g., If single Physics Lab only has 44 available slots per week, total demand cannot exceed 44.
 */
export function roomContention(
  _assignments: Assignment[], 
  _subjects: Subject[], 
  _school: School
): DiagnosticItem[] {
  // Rooms and special labs are deprecated from timetable generation.
  // Room numbers are now optional display labels on classes only.
  return [];
}

/**
 * Evaluates Pigeonhole Principle constraints:
 * Detects if a teacher's assigned periods exceed their available unblocked slots,
 * or if multiple classes simultaneously demand a single scarce teacher across overlapping slots.
 */
export function pigeonholeChecks(
  assignments: Assignment[], 
  teachers: Teacher[], 
  school: School, 
  classes: ClassRoom[]
): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];
  const selectedClassIds = classes.filter((c) => c.selected).map((c) => c.id);

  teachers.forEach((t) => {
    const assignedLoad = assignments
      .filter((a) => a.teacherId === t.id && selectedClassIds.includes(a.classId))
      .reduce((sum, a) => sum + a.periodsPerWeek, 0);

    const { maxPerWeek, availableSlots } = teacherCapacity(school, t);

    // 1. Assigned load exceeds teacher contract maximum
    if (assignedLoad > maxPerWeek) {
      diagnostics.push({
        id: `pigeonhole-max-exceeded-${t.id}`,
        severity: 'error',
        code: 'ERR_TEACHER_MAX_LOAD',
        message: `Faculty member ${t.name} (${t.code}) is assigned ${assignedLoad} periods/week, exceeding their contract maximum of ${maxPerWeek}.`,
        affected: [t.id],
        suggestion: `Reassign ${assignedLoad - maxPerWeek} periods of ${t.code}'s subjects to another faculty member or raise their weekly max limit.`,
      });
    }

    // 2. Assigned load exceeds unblocked physical slots
    if (assignedLoad > availableSlots) {
      diagnostics.push({
        id: `pigeonhole-unavailability-clash-${t.id}`,
        severity: 'error',
        code: 'ERR_TEACHER_UNAVAILABLE_SLOTS',
        message: `Faculty member ${t.name} (${t.code}) has only ${availableSlots} non-blocked slots available, but is assigned ${assignedLoad} periods.`,
        affected: [t.id],
        suggestion: `Unblock ${assignedLoad - availableSlots} slots in ${t.name}'s availability grid or reduce their assigned periods.`,
      });
    }

    // 3. High load warning (>= 90% utilization)
    if (assignedLoad <= maxPerWeek && assignedLoad <= availableSlots && assignedLoad > maxPerWeek * 0.9) {
      diagnostics.push({
        id: `pigeonhole-high-load-${t.id}`,
        severity: 'warning',
        code: 'WARN_TEACHER_HIGH_UTILIZATION',
        message: `Faculty member ${t.name} (${t.code}) is at ${Math.round((assignedLoad / maxPerWeek) * 100)}% capacity (${assignedLoad}/${maxPerWeek} periods). Minimal schedule slack.`,
        affected: [t.id],
      });
    }
  });

  return diagnostics;
}

/**
 * Runs a comprehensive pre-flight feasibility calculation over the entire school project.
 */
export function runFeasibilityAudit(project: Project): FeasibilityResult {
  const { school, classes, subjects, teachers, assignments, rules } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  const blockingErrors: DiagnosticItem[] = [];
  const warnings: DiagnosticItem[] = [];
  const suggestions: DiagnosticItem[] = [];

  const totalSlotsPerClassMap: Record<ID, number> = {};
  const totalRequiredPerClassMap: Record<ID, number> = {};
  const teacherLoadMap: Record<ID, { required: number; max: number; available: number }> = {};

  // Check 1: Zero Selected Classes
  if (selectedClasses.length === 0) {
    blockingErrors.push({
      id: 'err-no-classes',
      severity: 'error',
      code: 'ERR_NO_CLASSES_SELECTED',
      message: 'No classes are selected for generation.',
      affected: [],
      suggestion: 'Go to Step 2 (Classes) and select at least one class cohort.',
    });
  }

  // Check 2: Class Slot Parity Checks
  selectedClasses.forEach((cls) => {
    const available = slotsPerClass(school, cls.id);
    const required = requiredPerClass(assignments, cls.id);

    totalSlotsPerClassMap[cls.id] = available;
    totalRequiredPerClassMap[cls.id] = required;

    const diff = required - available;

    if (diff > 0) {
      // Over-allocated
      blockingErrors.push({
        id: `err-class-over-${cls.id}`,
        severity: 'error',
        code: 'ERR_CLASS_OVER_ALLOCATED',
        message: `${cls.name}–${cls.section} has ${required} periods assigned, but only ${available} slots available (${diff} slots over).`,
        affected: [cls.id],
        suggestion: `Reduce assigned subject periods for ${cls.name}–${cls.section} by ${diff}, or add periods to your school schedule.`,
      });
    } else if (diff < 0) {
      // Under-allocated
      const shortage = Math.abs(diff);
      if (!rules.allowFreePeriods) {
        blockingErrors.push({
          id: `err-class-under-${cls.id}`,
          severity: 'error',
          code: 'ERR_CLASS_UNDER_ALLOCATED',
          message: `${cls.name}–${cls.section} has ${required} periods assigned, but ${available} slots are available (${shortage} slots empty). All periods must be filled.`,
          affected: [cls.id],
          suggestion: `Assign ${shortage} more periods to subjects for ${cls.name}–${cls.section}, or enable "Allow Free Periods" in Step 6.`,
        });
      } else if (shortage > rules.maxFreePeriodsPerClass) {
        blockingErrors.push({
          id: `err-class-free-exceeded-${cls.id}`,
          severity: 'error',
          code: 'ERR_FREE_PERIODS_EXCEEDED',
          message: `${cls.name}–${cls.section} has ${shortage} unassigned periods, which exceeds the max allowed free periods (${rules.maxFreePeriodsPerClass}).`,
          affected: [cls.id],
          suggestion: `Assign at least ${shortage - rules.maxFreePeriodsPerClass} more periods, or increase max free periods.`,
        });
      } else {
        warnings.push({
          id: `warn-class-under-${cls.id}`,
          severity: 'warning',
          code: 'WARN_CLASS_FREE_SLOTS',
          message: `${cls.name}–${cls.section} has ${shortage} free/study periods scheduled.`,
          affected: [cls.id],
        });
      }
    }
  });

  // Check 3: Missing Faculty Assignments
  selectedClasses.forEach((cls) => {
    assignments
      .filter((a) => a.classId === cls.id && a.periodsPerWeek > 0)
      .forEach((a) => {
        if (!a.teacherId || a.teacherId.trim() === '') {
          const sub = subjects.find((s) => s.id === a.subjectId);
          blockingErrors.push({
            id: `err-missing-teacher-${cls.id}-${a.subjectId}`,
            severity: 'error',
            code: 'ERR_UNASSIGNED_TEACHER',
            message: `${cls.name}–${cls.section} has ${a.periodsPerWeek} periods of ${sub?.name || 'Subject'} without an assigned teacher.`,
            affected: [cls.id, a.subjectId],
            suggestion: `Assign a qualified faculty member in the Step 5 Assignment Matrix.`,
          });
        }
      });
  });

  // Check 4: Double Period Feasibility against breaks
  subjects
    .filter((s) => s.doublePeriod)
    .forEach((sub) => {
      // Ensure daily period count accommodates 2 consecutive periods without break crossing
      let hasValidPair = false;
      school.days.forEach((d) => {
        const pCount = school.periodsByDay[d] || 8;
        for (let p = 1; p < pCount; p++) {
          const crossesBreak = school.breaks.some((b) => b.afterPeriod === p);
          if (!crossesBreak) {
            hasValidPair = true;
          }
        }
      });

      if (!hasValidPair) {
        blockingErrors.push({
          id: `err-double-no-slots-${sub.id}`,
          severity: 'error',
          code: 'ERR_DOUBLE_PERIOD_IMPOSSIBLE',
          message: `Subject "${sub.name}" requires double periods, but your break structure leaves zero valid consecutive period slots.`,
          affected: [sub.id],
          suggestion: 'Adjust break placements in Step 1 so at least two consecutive periods are free of interruptions.',
        });
      }
    });

  // Check 5: Teacher Capacity & Pigeonhole Checks
  teachers.forEach((t) => {
    const { maxPerWeek, availableSlots } = teacherCapacity(school, t);
    const required = teacherLoad(assignments, t.id);
    teacherLoadMap[t.id] = { required, max: maxPerWeek, available: availableSlots };
  });

  const pigeonholeDiag = pigeonholeChecks(assignments, teachers, school, classes);
  pigeonholeDiag.forEach((d) => {
    if (d.severity === 'error') blockingErrors.push(d);
    else if (d.severity === 'warning') warnings.push(d);
    else suggestions.push(d);
  });

  // Check 6: Special Room Contention
  const roomDiag = roomContention(assignments, subjects, school);
  roomDiag.forEach((d) => {
    if (d.severity === 'error') blockingErrors.push(d);
    else if (d.severity === 'warning') warnings.push(d);
    else suggestions.push(d);
  });

  return {
    isFeasible: blockingErrors.length === 0,
    blockingErrors,
    warnings,
    suggestions,
    totalSlotsPerClass: totalSlotsPerClassMap,
    totalRequiredPerClass: totalRequiredPerClassMap,
    teacherLoadMap,
  };
}
