import { Project, ID } from '../types';

export interface ClassCalculation {
  classId: ID;
  className: string;
  totalSlots: number;
  requiredPeriods: number;
  freeSlots: number;
  utilizationPct: number;
  status: 'optimal' | 'underfilled' | 'overfilled';
}

export interface SubjectDistributionTarget {
  classId: ID;
  subjectId: ID;
  subjectName: string;
  subjectCode: string;
  periodsPerWeek: number;
  maxPerDay: number;
  requiresDouble: boolean;
  recommendedDistribution: number[]; // Periods recommended per active day
}

export interface TeacherCalculation {
  teacherId: ID;
  teacherName: string;
  code: string;
  requiredPeriods: number;
  maxPerWeek: number;
  availableSlots: number;
  blockedCount: number;
  utilizationPct: number;
  periodsPerDayAvg: number;
  maxConsecutiveAllowed: number;
  isBottleneck: boolean;
  status: 'balanced' | 'tight' | 'overloaded';
}

export interface RoomCalculation {
  roomId: ID;
  roomName: string;
  code: string;
  type: string;
  capacity: number;
  availableWeeklySlots: number;
  demandPeriods: number;
  utilizationPct: number;
  collisionRiskPct: number;
  isOverbooked: boolean;
}

export interface ConstrainedLessonScarcity {
  assignmentId: string;
  classId: ID;
  className: string;
  subjectId: ID;
  subjectName: string;
  subjectCode: string;
  teacherId: ID;
  teacherName: string;
  periodsPerWeek: number;
  requiresDouble: boolean;
  hasSpecialRoom: boolean;
  difficultyScore: number; // 0 to 100, highest is hardest to place
  difficultyReason: string;
}

export interface GlobalFeasibilityCalculation {
  totalLessonsToPlace: number;
  totalTeacherHours: number;
  averageTeacherLoadPct: number;
  busiestDayIndex: number;
  busiestDayName: string;
  bottleneckTeachers: TeacherCalculation[];
  verdict: 'Feasible' | 'Tight' | 'Impossible';
  reasons: string[];
  fixSuggestions: string[];
  pigeonholeAnalysis: ConstrainedLessonScarcity[];
}

export interface FullTimetableCalculations {
  classes: ClassCalculation[];
  subjectDistributions: SubjectDistributionTarget[];
  teachers: TeacherCalculation[];
  rooms: RoomCalculation[];
  global: GlobalFeasibilityCalculation;
  hasBlockingErrors: boolean;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Computes all mathematical metrics, capacity limits, and pigeonhole scarcity
 * locally before invoking simulated annealing or cloud AI.
 */
export function computeTimetableCalculations(project: Project): FullTimetableCalculations {
  const { school, classes, subjects, teachers, rooms, assignments } = project;
  const activeDays = school.days || [1, 2, 3, 4, 5];
  const selectedClasses = classes.filter((c) => c.selected);

  // Total available slots for the active school week
  const totalSlotsPerWeek = activeDays.reduce(
    (sum, d) => sum + (school.periodsByDay[d] || 8),
    0
  );

  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // 1. Class Calculations
  const classCalculations: ClassCalculation[] = selectedClasses.map((cls) => {
    const classAssignments = assignments.filter((a) => a.classId === cls.id);
    const requiredPeriods = classAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
    const freeSlots = totalSlotsPerWeek - requiredPeriods;
    const utilizationPct = totalSlotsPerWeek > 0 
      ? Math.round((requiredPeriods / totalSlotsPerWeek) * 100) 
      : 0;

    let status: 'optimal' | 'underfilled' | 'overfilled' = 'optimal';
    if (requiredPeriods > totalSlotsPerWeek) {
      status = 'overfilled';
    } else if (utilizationPct < 85) {
      status = 'underfilled';
    }

    return {
      classId: cls.id,
      className: `${cls.name} – ${cls.section}`,
      totalSlots: totalSlotsPerWeek,
      requiredPeriods,
      freeSlots,
      utilizationPct,
      status,
    };
  });

  // 2. Subject Distribution Targets
  const subjectDistributions: SubjectDistributionTarget[] = [];
  selectedClasses.forEach((cls) => {
    const classAssignments = assignments.filter((a) => a.classId === cls.id);
    classAssignments.forEach((assign) => {
      const sub = subjectMap.get(assign.subjectId);
      if (!sub) return;

      const numDays = activeDays.length;
      const count = assign.periodsPerWeek;
      const basePerDay = Math.floor(count / numDays);
      let remainder = count % numDays;

      const recommendedDistribution = activeDays.map(() => {
        let periods = basePerDay;
        if (remainder > 0) {
          periods += 1;
          remainder--;
        }
        return periods;
      });

      subjectDistributions.push({
        classId: cls.id,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        periodsPerWeek: count,
        maxPerDay: sub.maxPerDay || 2,
        requiresDouble: Boolean(sub.doublePeriod),
        recommendedDistribution,
      });
    });
  });

  // 3. Teacher Calculations
  const teacherCalculations: TeacherCalculation[] = teachers.map((teach) => {
    const teacherAssignments = assignments.filter(
      (a) => a.teacherId === teach.id && selectedClasses.some((c) => c.id === a.classId)
    );
    const requiredPeriods = teacherAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);

    const validBlocked = teach.blocked.filter((b) => {
      return activeDays.includes(b.day) && b.period <= (school.periodsByDay[b.day] || 8);
    });
    const blockedCount = validBlocked.length;
    const availableSlots = Math.max(0, totalSlotsPerWeek - blockedCount);

    const utilizationPct = availableSlots > 0 
      ? Math.round((requiredPeriods / availableSlots) * 100) 
      : (requiredPeriods > 0 ? 999 : 0);

    const periodsPerDayAvg = activeDays.length > 0 
      ? parseFloat((requiredPeriods / activeDays.length).toFixed(1)) 
      : 0;

    let status: 'balanced' | 'tight' | 'overloaded' = 'balanced';
    if (requiredPeriods > teach.maxPerWeek || requiredPeriods > availableSlots) {
      status = 'overloaded';
    } else if (utilizationPct >= 88) {
      status = 'tight';
    }

    const isBottleneck = status === 'tight' || status === 'overloaded';

    return {
      teacherId: teach.id,
      teacherName: teach.name,
      code: teach.code,
      requiredPeriods,
      maxPerWeek: teach.maxPerWeek,
      availableSlots,
      blockedCount,
      utilizationPct,
      periodsPerDayAvg,
      maxConsecutiveAllowed: teach.maxConsecutive || 3,
      isBottleneck,
      status,
    };
  });

  // 4. Room & Lab Calculations
  const roomCalculations: RoomCalculation[] = rooms.map((rm) => {
    // Check subjects assigned to this special room
    const assignedSubjects = subjects.filter((s) => s.specialRoomId === rm.id);
    const subjectIds = new Set(assignedSubjects.map((s) => s.id));

    const roomAssignments = assignments.filter(
      (a) => subjectIds.has(a.subjectId) && selectedClasses.some((c) => c.id === a.classId)
    );
    const demandPeriods = roomAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);

    const availableWeeklySlots = totalSlotsPerWeek;
    const utilizationPct = availableWeeklySlots > 0
      ? Math.round((demandPeriods / availableWeeklySlots) * 100)
      : 0;

    const collisionRiskPct = Math.min(100, Math.round((demandPeriods / availableWeeklySlots) * 100));
    const isOverbooked = demandPeriods > availableWeeklySlots;

    return {
      roomId: rm.id,
      roomName: rm.name,
      code: rm.code || rm.number,
      type: rm.type,
      capacity: rm.capacity,
      availableWeeklySlots,
      demandPeriods,
      utilizationPct,
      collisionRiskPct,
      isOverbooked,
    };
  });

  // 5. Pigeonhole Scarcity & Ordering by Difficulty
  const pigeonholeAnalysis: ConstrainedLessonScarcity[] = [];
  selectedClasses.forEach((cls) => {
    const classAssignments = assignments.filter((a) => a.classId === cls.id);
    classAssignments.forEach((assign) => {
      const sub = subjectMap.get(assign.subjectId);
      const teach = teacherMap.get(assign.teacherId);
      if (!sub || !teach) return;

      const teachCalc = teacherCalculations.find((tc) => tc.teacherId === teach.id);
      const util = teachCalc?.utilizationPct || 50;

      let difficultyScore = 20; // baseline
      const reasons: string[] = [];

      // Teacher utilization constraint
      if (util >= 90) {
        difficultyScore += 35;
        reasons.push(`High teacher load (${util}%)`);
      } else if (util >= 75) {
        difficultyScore += 15;
      }

      // Teacher blocked slots
      if (teachCalc && teachCalc.blockedCount > 4) {
        difficultyScore += 20;
        reasons.push(`${teachCalc.blockedCount} blocked periods`);
      }

      // Double period constraint
      if (sub.doublePeriod) {
        difficultyScore += 25;
        reasons.push('Requires consecutive double period');
      }

      // Special room constraint
      if (sub.specialRoomId) {
        difficultyScore += 20;
        reasons.push('Special room required');
      }

      // High weekly frequency
      if (assign.periodsPerWeek >= 6) {
        difficultyScore += 15;
        reasons.push('Daily frequency');
      }

      difficultyScore = Math.min(100, difficultyScore);

      pigeonholeAnalysis.push({
        assignmentId: `${cls.id}-${sub.id}-${teach.id}`,
        classId: cls.id,
        className: `${cls.name} – ${cls.section}`,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        teacherId: teach.id,
        teacherName: teach.name,
        periodsPerWeek: assign.periodsPerWeek,
        requiresDouble: Boolean(sub.doublePeriod),
        hasSpecialRoom: Boolean(sub.specialRoomId),
        difficultyScore,
        difficultyReason: reasons.join(' • ') || 'Standard lesson allocation',
      });
    });
  });

  // Sort pigeonhole lessons: highest difficulty first
  pigeonholeAnalysis.sort((a, b) => b.difficultyScore - a.difficultyScore);

  // 6. Global Feasibility & Impossibility Diagnosis
  const reasons: string[] = [];
  const fixSuggestions: string[] = [];
  let hasBlockingErrors = false;

  const totalLessonsToPlace = classCalculations.reduce((sum, c) => sum + c.requiredPeriods, 0);
  const totalTeacherHours = teacherCalculations.reduce((sum, t) => sum + t.requiredPeriods, 0);
  const activeTeachers = teacherCalculations.filter((t) => t.requiredPeriods > 0);
  const averageTeacherLoadPct = activeTeachers.length > 0
    ? Math.round(activeTeachers.reduce((sum, t) => sum + t.utilizationPct, 0) / activeTeachers.length)
    : 0;

  // Check class overfilling
  const overfilledClasses = classCalculations.filter((c) => c.status === 'overfilled');
  if (overfilledClasses.length > 0) {
    hasBlockingErrors = true;
    overfilledClasses.forEach((oc) => {
      reasons.push(`Class ${oc.className} requires ${oc.requiredPeriods} periods but only ${oc.totalSlots} are available.`);
      fixSuggestions.push(`Reduce assigned periods for ${oc.className} or add an extra working day in School Settings.`);
    });
  }

  // Check teacher overloading
  const overloadedTeachers = teacherCalculations.filter((t) => t.status === 'overloaded');
  if (overloadedTeachers.length > 0) {
    hasBlockingErrors = true;
    overloadedTeachers.forEach((ot) => {
      if (ot.requiredPeriods > ot.maxPerWeek) {
        reasons.push(`Teacher ${ot.teacherName} is assigned ${ot.requiredPeriods} periods, exceeding weekly contract limit of ${ot.maxPerWeek}.`);
        fixSuggestions.push(`Reassign some ${ot.teacherName} classes in Subject Allocations or increase Max/Week in Staff Settings.`);
      }
      if (ot.requiredPeriods > ot.availableSlots) {
        reasons.push(`Teacher ${ot.teacherName} has only ${ot.availableSlots} non-blocked slots, but requires ${ot.requiredPeriods} periods.`);
        fixSuggestions.push(`Unblock periods for ${ot.teacherName} in the Faculty Availability Matrix.`);
      }
    });
  }

  // Check room overbooking
  const overbookedRooms = roomCalculations.filter((r) => r.isOverbooked);
  if (overbookedRooms.length > 0) {
    hasBlockingErrors = true;
    overbookedRooms.forEach((or) => {
      reasons.push(`Facility "${or.roomName}" has ${or.demandPeriods} periods demanded but only ${or.availableWeeklySlots} school slots available.`);
      fixSuggestions.push(`Reassign some subjects to standard classrooms or split classes.`);
    });
  }

  const bottleneckTeachers = teacherCalculations.filter((t) => t.isBottleneck);

  let verdict: 'Feasible' | 'Tight' | 'Impossible' = 'Feasible';
  if (hasBlockingErrors) {
    verdict = 'Impossible';
  } else if (bottleneckTeachers.length > 0 || averageTeacherLoadPct >= 85) {
    verdict = 'Tight';
    if (bottleneckTeachers.length > 0) {
      reasons.push(`${bottleneckTeachers.length} faculty members have tight schedules (≥88% load).`);
      fixSuggestions.push(`Ensure flexible period swapping for bottleneck teachers.`);
    }
  }

  return {
    classes: classCalculations,
    subjectDistributions,
    teachers: teacherCalculations,
    rooms: roomCalculations,
    global: {
      totalLessonsToPlace,
      totalTeacherHours,
      averageTeacherLoadPct,
      busiestDayIndex: 1, // Monday
      busiestDayName: DAY_NAMES[activeDays[0] || 1],
      bottleneckTeachers,
      verdict,
      reasons,
      fixSuggestions,
      pigeonholeAnalysis,
    },
    hasBlockingErrors,
  };
}
