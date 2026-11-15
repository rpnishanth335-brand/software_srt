import { Project, ID } from '../types';
import { Lesson } from './types';
import { evaluateTimetableState, EvaluationResult } from './cost';

/**
 * Phase C: Targeted Min-Conflicts & Kempe-Chain Repair.
 * Directly identifies faculty double-bookings and finds a zero-conflict swap in the conflicting class.
 */
export function runTargetedRepair(
  placements: Map<string, Lesson>,
  project: Project,
  selectedClassIds: ID[]
): {
  placements: Map<string, Lesson>;
  evaluation: EvaluationResult;
  repairedCount: number;
} {
  let currentPlacements = new Map(placements);
  let evalResult = evaluateTimetableState(currentPlacements, project, selectedClassIds);

  if (evalResult.hardViolations === 0) {
    return { placements: currentPlacements, evaluation: evalResult, repairedCount: 0 };
  }

  const { school, teachers } = project;
  let repairedCount = 0;
  const maxPasses = 200;

  for (let pass = 0; pass < maxPasses; pass++) {
    if (evalResult.hardViolations === 0) break;

    // Helper to test if a teacher is busy in any class on (day, period)
    const isTeacherBusyAt = (teacherId: ID, day: number, period: number, excludeKey?: string) => {
      for (const [key, lesson] of currentPlacements.entries()) {
        if (key === excludeKey) continue;
        const [, dStr, pStr] = key.split(':');
        const d = parseInt(dStr, 10);
        const p = parseInt(pStr, 10);
        if (d === day && p === period && lesson.teacherId === teacherId) {
          return true;
        }
      }
      return false;
    };

    // Find all teacher clashes: key: `${teacherId}:${day}:${period}`, value: list of slot keys
    const clashMap = new Map<string, string[]>();
    currentPlacements.forEach((lesson, key) => {
      const [, d, p] = key.split(':');
      const timeKey = `${lesson.teacherId}:${d}:${p}`;
      const list = clashMap.get(timeKey) || [];
      list.push(key);
      clashMap.set(timeKey, list);
    });

    let resolvedAClash = false;

    for (const [, keys] of clashMap.entries()) {
      if (keys.length > 1) {
        // Clash exists! Take the second slot key and attempt to relocate it within its class
        const conflictKey = keys[1];
        const [conflictClassId, dStr, pStr] = conflictKey.split(':');
        const origDay = parseInt(dStr, 10);
        const origPeriod = parseInt(pStr, 10);
        const conflictLesson = currentPlacements.get(conflictKey)!;

        if (conflictLesson.locked || conflictLesson.isDoublePeriod) continue;

        const teacher = teachers.find((t) => t.id === conflictLesson.teacherId);

        // Try candidate slots in the same class
        for (const candidateDay of school.days) {
          const maxP = school.periodsByDay[candidateDay] || 8;
          for (let candidateP = 1; candidateP <= maxP; candidateP++) {
            if (candidateDay === origDay && candidateP === origPeriod) continue;

            // Check if teacher is blocked on candidate slot
            if (teacher && teacher.blocked.some((b) => b.day === candidateDay && b.period === candidateP)) {
              continue;
            }

            // Check if conflicting teacher is already busy on candidate slot
            if (isTeacherBusyAt(conflictLesson.teacherId, candidateDay, candidateP, conflictKey)) {
              continue;
            }

            const candidateKey = `${conflictClassId}:${candidateDay}:${candidateP}`;
            const candidateLesson = currentPlacements.get(candidateKey);

            if (candidateLesson?.locked || candidateLesson?.isDoublePeriod) {
              continue;
            }

            // If candidate has another lesson, ensure its teacher is free on orig slot
            if (candidateLesson) {
              const otherTeacher = teachers.find((t) => t.id === candidateLesson.teacherId);
              if (otherTeacher && otherTeacher.blocked.some((b) => b.day === origDay && b.period === origPeriod)) {
                continue;
              }
              if (isTeacherBusyAt(candidateLesson.teacherId, origDay, origPeriod, candidateKey)) {
                continue;
              }
            }

            // Apply swap!
            if (candidateLesson) currentPlacements.set(conflictKey, candidateLesson);
            else currentPlacements.delete(conflictKey);
            currentPlacements.set(candidateKey, conflictLesson);

            const newEval = evaluateTimetableState(currentPlacements, project, selectedClassIds);
            if (newEval.hardViolations <= evalResult.hardViolations) {
              evalResult = newEval;
              repairedCount++;
              resolvedAClash = true;
              break;
            } else {
              // Revert
              currentPlacements.set(conflictKey, conflictLesson);
              if (candidateLesson) currentPlacements.set(candidateKey, candidateLesson);
              else currentPlacements.delete(candidateKey);
            }
          }
          if (resolvedAClash) break;
        }
      }
      if (resolvedAClash) break;
    }

    // Check for any lesson occupying a teacher blocked slot
    for (const [key, lesson] of currentPlacements.entries()) {
      const [cId, dStr, pStr] = key.split(':');
      const d = parseInt(dStr, 10);
      const p = parseInt(pStr, 10);
      const teacher = teachers.find((t) => t.id === lesson.teacherId);

      if (teacher && teacher.blocked.some((b) => b.day === d && b.period === p)) {
        // Must relocate this lesson!
        if (lesson.locked || lesson.isDoublePeriod) continue;

        for (const candidateDay of school.days) {
          const maxP = school.periodsByDay[candidateDay] || 8;
          for (let candidateP = 1; candidateP <= maxP; candidateP++) {
            if (teacher.blocked.some((b) => b.day === candidateDay && b.period === candidateP)) continue;
            if (isTeacherBusyAt(lesson.teacherId, candidateDay, candidateP, key)) continue;

            const candKey = `${cId}:${candidateDay}:${candidateP}`;
            const candLesson = currentPlacements.get(candKey);
            if (candLesson?.locked || candLesson?.isDoublePeriod) continue;

            if (candLesson) {
              const otherT = teachers.find((t) => t.id === candLesson.teacherId);
              if (otherT && otherT.blocked.some((b) => b.day === d && b.period === p)) continue;
              if (isTeacherBusyAt(candLesson.teacherId, d, p, candKey)) continue;
            }

            // Apply swap
            if (candLesson) currentPlacements.set(key, candLesson);
            else currentPlacements.delete(key);
            currentPlacements.set(candKey, lesson);

            const testEv = evaluateTimetableState(currentPlacements, project, selectedClassIds);
            if (testEv.hardViolations <= evalResult.hardViolations) {
              evalResult = testEv;
              repairedCount++;
              resolvedAClash = true;
              break;
            } else {
              // Revert
              currentPlacements.set(key, lesson);
              if (candLesson) currentPlacements.set(candKey, candLesson);
              else currentPlacements.delete(candKey);
            }
          }
          if (resolvedAClash) break;
        }
      }
      if (resolvedAClash) break;
    }

    if (!resolvedAClash) break;
  }

  return {
    placements: currentPlacements,
    evaluation: evalResult,
    repairedCount,
  };
}

/**
 * Extracts the Unsatisfiable Core when hard conflicts cannot be fully eliminated.
 */
export function extractUnsatisfiableCore(
  placements: Map<string, Lesson>,
  project: Project,
  selectedClassIds: ID[]
): string[] {
  const evalResult = evaluateTimetableState(placements, project, selectedClassIds);
  const core: string[] = [];
  const { hardBreakdown } = evalResult;

  if (hardBreakdown.teacherClash > 0) {
    core.push(
      `Detected ${hardBreakdown.teacherClash} persistent faculty double-booking clashes where teachers are required in two classes simultaneously.`
    );
  }

  if (hardBreakdown.teacherBlocked > 0) {
    core.push(
      `Detected ${hardBreakdown.teacherBlocked} violations of faculty availability grids where teacher unassigned slots were over-constrained.`
    );
  }

  if (hardBreakdown.doublePeriodConsecutive > 0 || hardBreakdown.doublePeriodBreakCrossing > 0) {
    core.push(
      `Double-period lab placement conflict: daily schedules or break times do not have adequate contiguous blocks.`
    );
  }

  if (hardBreakdown.specialRoomClash > 0) {
    core.push(
      `Laboratory room bottleneck: specialized facilities are over-demanded during identical periods.`
    );
  }

  return core;
}
