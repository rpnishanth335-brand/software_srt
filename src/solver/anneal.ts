import { Project, ID } from '../types';
import { Lesson, SolverProgress } from './types';
import { Mulberry32 } from './prng';
import { evaluateTimetableState, EvaluationResult } from './cost';

export interface AnnealOptions {
  maxIterations?: number;
  initialTemperature?: number;
  coolingRate?: number;
  onProgress?: (progress: SolverProgress) => void;
  shouldAbort?: () => boolean;
}

/**
 * Phase B: Simulated Annealing Optimizer with Atomic Double-Period Preservation.
 */
export function runSimulatedAnnealing(
  initialPlacements: Map<string, Lesson>,
  project: Project,
  selectedClassIds: ID[],
  prng: Mulberry32,
  options: AnnealOptions = {}
): {
  placements: Map<string, Lesson>;
  bestEvaluation: EvaluationResult;
  iterations: number;
} {
  const {
    maxIterations = 20000,
    initialTemperature = 120.0,
    coolingRate = 0.998,
    onProgress,
    shouldAbort,
  } = options;

  let currentPlacements = new Map(initialPlacements);
  let currentEval = evaluateTimetableState(currentPlacements, project, selectedClassIds);

  let bestPlacements = new Map(currentPlacements);
  let bestEval = { ...currentEval };

  let temperature = initialTemperature;
  let stagnantIterations = 0;
  const reheatThreshold = 1200;
  let reheatCount = 0;

  const softTrend: number[] = [bestEval.softScore];
  const startTime = Date.now();
  let lastProgressReportTime = startTime;

  const { school } = project;

  // Pre-calculate disjoint non-overlapping double period blocks per class that do not cross breaks
  const validDoubleSlotPairs: Array<{ day: number; p1: number; p2: number }> = [];
  school.days.forEach((day) => {
    const maxP = school.periodsByDay[day] || 8;
    for (let p = 1; p < maxP; p += 2) {
      const crossesBreak = school.breaks.some((b) => b.afterPeriod === p);
      if (!crossesBreak) {
        validDoubleSlotPairs.push({ day, p1: p, p2: p + 1 });
      }
    }
  });

  const cost = (ev: EvaluationResult) => ev.hardViolations * 10000 + ev.softScore;

  for (let iter = 1; iter <= maxIterations; iter++) {
    if (shouldAbort && shouldAbort()) {
      break;
    }

    if (bestEval.hardViolations === 0 && bestEval.softScore <= 5) {
      break;
    }

    // Decide whether to perform a conflict-directed move or a random exploratory move
    let classId = selectedClassIds[prng.nextInt(0, selectedClassIds.length - 1)];

    // If hard conflicts exist, 50% of the time directly target a conflicting slot
    let targetedSlot: { classId: ID; day: number; period: number } | null = null;
    if (currentEval.hardViolations > 0 && prng.next() < 0.5) {
      // Find all conflicting slots
      const conflictingSlots: Array<{ classId: ID; day: number; period: number }> = [];
      const teacherSlots = new Map<string, Array<{ classId: ID; day: number; period: number }>>();

      currentPlacements.forEach((lesson, key) => {
        const [cId, dStr, pStr] = key.split(':');
        const day = parseInt(dStr, 10);
        const period = parseInt(pStr, 10);
        const timeKey = `${lesson.teacherId}:${day}:${period}`;

        const existing = teacherSlots.get(timeKey) || [];
        existing.push({ classId: cId, day, period });
        teacherSlots.set(timeKey, existing);

        // Check if teacher blocked
        const teacher = project.teachers.find((t) => t.id === lesson.teacherId);
        if (teacher && teacher.blocked.some((b) => b.day === day && b.period === period)) {
          conflictingSlots.push({ classId: cId, day, period });
        }
      });

      teacherSlots.forEach((slotsList) => {
        if (slotsList.length > 1) {
          slotsList.forEach((s) => conflictingSlots.push(s));
        }
      });

      if (conflictingSlots.length > 0) {
        targetedSlot = conflictingSlots[prng.nextInt(0, conflictingSlots.length - 1)];
        classId = targetedSlot.classId;
      }
    }

    const roll = prng.next();
    let restoreFn = () => {};

    if (targetedSlot && !currentPlacements.get(`${targetedSlot.classId}:${targetedSlot.day}:${targetedSlot.period}`)?.isDoublePeriod) {
      // CONFLICT-DIRECTED MOVE: Swap targeted conflicting single slot with a random slot in the same class
      const key1 = `${targetedSlot.classId}:${targetedSlot.day}:${targetedSlot.period}`;
      const day2 = school.days[prng.nextInt(0, school.days.length - 1)];
      const maxP2 = school.periodsByDay[day2] || 8;
      const p2 = prng.nextInt(1, maxP2);
      const key2 = `${classId}:${day2}:${p2}`;

      const l1 = currentPlacements.get(key1);
      const l2 = currentPlacements.get(key2);

      if (key1 === key2 || l1?.locked || l2?.locked || l2?.isDoublePeriod) continue;

      if (l2) currentPlacements.set(key1, l2);
      else currentPlacements.delete(key1);

      if (l1) currentPlacements.set(key2, l1);
      else currentPlacements.delete(key2);

      restoreFn = () => {
        if (l1) currentPlacements.set(key1, l1);
        else currentPlacements.delete(key1);

        if (l2) currentPlacements.set(key2, l2);
        else currentPlacements.delete(key2);
      };
    } else if (roll < 0.65) {
      // OPERATOR 1: Single lesson swap (only between non-double lessons)
      const day1 = school.days[prng.nextInt(0, school.days.length - 1)];
      const maxP1 = school.periodsByDay[day1] || 8;
      const p1 = prng.nextInt(1, maxP1);

      const day2 = school.days[prng.nextInt(0, school.days.length - 1)];
      const maxP2 = school.periodsByDay[day2] || 8;
      const p2 = prng.nextInt(1, maxP2);

      if (day1 === day2 && p1 === p2) continue;

      const key1 = `${classId}:${day1}:${p1}`;
      const key2 = `${classId}:${day2}:${p2}`;

      const l1 = currentPlacements.get(key1);
      const l2 = currentPlacements.get(key2);

      // Do not break double periods in single swap operator
      if (l1?.isDoublePeriod || l2?.isDoublePeriod) continue;
      if (l1?.locked || l2?.locked) continue;

      // Apply single swap
      if (l2) currentPlacements.set(key1, l2);
      else currentPlacements.delete(key1);

      if (l1) currentPlacements.set(key2, l1);
      else currentPlacements.delete(key2);

      restoreFn = () => {
        if (l1) currentPlacements.set(key1, l1);
        else currentPlacements.delete(key1);

        if (l2) currentPlacements.set(key2, l2);
        else currentPlacements.delete(key2);
      };
    } else {
      // OPERATOR 2: Atomic Double-Period Block Swap
      if (validDoubleSlotPairs.length < 2) continue;

      const pairIdx1 = prng.nextInt(0, validDoubleSlotPairs.length - 1);
      let pairIdx2 = prng.nextInt(0, validDoubleSlotPairs.length - 1);
      while (pairIdx2 === pairIdx1) {
        pairIdx2 = prng.nextInt(0, validDoubleSlotPairs.length - 1);
      }

      const pair1 = validDoubleSlotPairs[pairIdx1];
      const pair2 = validDoubleSlotPairs[pairIdx2];

      const k1a = `${classId}:${pair1.day}:${pair1.p1}`;
      const k1b = `${classId}:${pair1.day}:${pair1.p2}`;
      const k2a = `${classId}:${pair2.day}:${pair2.p1}`;
      const k2b = `${classId}:${pair2.day}:${pair2.p2}`;

      const l1a = currentPlacements.get(k1a);
      const l1b = currentPlacements.get(k1b);
      const l2a = currentPlacements.get(k2a);
      const l2b = currentPlacements.get(k2b);

      if (l1a?.locked || l1b?.locked || l2a?.locked || l2b?.locked) continue;

      // Ensure we don't bisect an existing double period in pair2 if pair1 is a double period
      const isPair1Double = l1a?.isDoublePeriod && l1b?.isDoublePeriod && l1a.subjectId === l1b.subjectId;
      const isPair2Double = l2a?.isDoublePeriod && l2b?.isDoublePeriod && l2a.subjectId === l2b.subjectId;
      const isPair1NonDouble = !l1a?.isDoublePeriod && !l1b?.isDoublePeriod;
      const isPair2NonDouble = !l2a?.isDoublePeriod && !l2b?.isDoublePeriod;

      // Only swap if either both are double blocks, or one is double and the other is two non-double slots
      if (!(isPair1Double || isPair1NonDouble) || !(isPair2Double || isPair2NonDouble)) {
        continue;
      }

      // Apply 2-slot block swap
      if (l2a) currentPlacements.set(k1a, l2a);
      else currentPlacements.delete(k1a);
      if (l2b) currentPlacements.set(k1b, l2b);
      else currentPlacements.delete(k1b);

      if (l1a) currentPlacements.set(k2a, l1a);
      else currentPlacements.delete(k2a);
      if (l1b) currentPlacements.set(k2b, l1b);
      else currentPlacements.delete(k2b);

      restoreFn = () => {
        if (l1a) currentPlacements.set(k1a, l1a);
        else currentPlacements.delete(k1a);
        if (l1b) currentPlacements.set(k1b, l1b);
        else currentPlacements.delete(k1b);

        if (l2a) currentPlacements.set(k2a, l2a);
        else currentPlacements.delete(k2a);
        if (l2b) currentPlacements.set(k2b, l2b);
        else currentPlacements.delete(k2b);
      };
    }

    // Evaluate candidate state
    const newEval = evaluateTimetableState(currentPlacements, project, selectedClassIds);
    const delta = cost(newEval) - cost(currentEval);

    let accept = false;
    if (delta <= 0) {
      accept = true;
    } else {
      const prob = Math.exp(-delta / Math.max(0.001, temperature));
      if (prng.next() < prob) {
        accept = true;
      }
    }

    if (accept) {
      currentEval = newEval;
      if (cost(newEval) < cost(bestEval)) {
        bestEval = { ...newEval };
        bestPlacements = new Map(currentPlacements);
        stagnantIterations = 0;
      } else {
        stagnantIterations++;
      }
    } else {
      restoreFn();
      stagnantIterations++;
    }

    temperature = Math.max(0.01, temperature * coolingRate);

    // Reheat when stuck in plateau
    if (stagnantIterations >= reheatThreshold && reheatCount < 4) {
      temperature = initialTemperature * 0.5;
      stagnantIterations = 0;
      reheatCount++;
    }

    // Progress updates
    const now = Date.now();
    if (now - lastProgressReportTime >= 100) {
      lastProgressReportTime = now;
      softTrend.push(bestEval.softScore);
      if (softTrend.length > 25) softTrend.shift();

      if (onProgress) {
        onProgress({
          phase: 'annealing',
          phaseProgress: Math.min(100, Math.round((iter / maxIterations) * 100)),
          iterations: iter,
          hardConflicts: bestEval.hardViolations,
          softScore: bestEval.softScore,
          softTrend: [...softTrend],
          temperature: Math.round(temperature * 10) / 10,
          runtimeMs: now - startTime,
        });
      }
    }
  }

  return {
    placements: bestPlacements,
    bestEvaluation: bestEval,
    iterations: maxIterations,
  };
}
