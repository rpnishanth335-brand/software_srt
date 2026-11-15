import { Project, Slot } from '../types';
import { SolverConfig, SolverProgress, SolverResult } from './types';
import { Mulberry32 } from './prng';
import { generateLessonUnits, constructInitialGrid } from './construct';
import { runSimulatedAnnealing } from './anneal';
import { runTargetedRepair, extractUnsatisfiableCore } from './repair';
import { evaluateTimetableState } from './cost';

export class SolverEngine {
  private isAborted = false;

  public abort(): void {
    this.isAborted = true;
  }

  public async solve(
    project: Project,
    config: SolverConfig,
    lockedSlots: Slot[] = [],
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverResult> {
    const startTime = Date.now();
    this.isAborted = false;

    const prng = new Mulberry32(config.seed || 42);
    const selectedClassIds = config.selectedClassIds || project.classes.filter((c) => c.selected).map((c) => c.id);

    // Initial progress report
    if (onProgress) {
      onProgress({
        phase: 'init',
        phaseProgress: 5,
        iterations: 0,
        hardConflicts: 0,
        softScore: 0,
        softTrend: [],
        runtimeMs: 0,
        message: 'Decomposing curriculum into atomic lesson units...',
      });
    }

    // 1. Generate Lesson Units & Identify Locked Slots
    const { lessons, lockedMap } = generateLessonUnits(project, selectedClassIds, lockedSlots);

    if (this.isAborted) {
      return this.createAbortedResult(startTime, config.seed);
    }

    // 2. Phase A: Construction (Most-Constrained-First Backtracking)
    if (onProgress) {
      onProgress({
        phase: 'construction',
        phaseProgress: 20,
        iterations: 0,
        hardConflicts: 0,
        softScore: 0,
        softTrend: [],
        runtimeMs: Date.now() - startTime,
        message: 'Phase A: Placing double periods, labs, and scarce faculty...',
      });
    }

    let placements = constructInitialGrid(lessons, project, selectedClassIds, prng, lockedMap);
    let evalResult = evaluateTimetableState(placements, project, selectedClassIds);

    if (this.isAborted) {
      return this.createAbortedResult(startTime, config.seed);
    }

    // 3. Phase B: Simulated Annealing Optimization
    const maxIterations = config.qualityMode === 'fast' ? 5000 : config.qualityMode === 'best' ? 30000 : 15000;

    const annealResult = runSimulatedAnnealing(placements, project, selectedClassIds, prng, {
      maxIterations,
      initialTemperature: 100.0,
      coolingRate: config.qualityMode === 'fast' ? 0.995 : 0.998,
      onProgress,
      shouldAbort: () => this.isAborted,
    });

    placements = annealResult.placements;
    evalResult = annealResult.bestEvaluation;

    if (this.isAborted) {
      return this.createAbortedResult(startTime, config.seed);
    }

    // 4. Phase C: Targeted Repair (if residual hard conflicts remain)
    let unsatisfiableCore: string[] | undefined;
    if (evalResult.hardViolations > 0) {
      if (onProgress) {
        onProgress({
          phase: 'repair',
          phaseProgress: 90,
          iterations: annealResult.iterations,
          hardConflicts: evalResult.hardViolations,
          softScore: evalResult.softScore,
          softTrend: [evalResult.softScore],
          runtimeMs: Date.now() - startTime,
          message: 'Phase C: Performing targeted Kempe-chain conflict repair...',
        });
      }

      const repairResult = runTargetedRepair(placements, project, selectedClassIds);
      placements = repairResult.placements;
      evalResult = repairResult.evaluation;

      if (evalResult.hardViolations > 0) {
        unsatisfiableCore = extractUnsatisfiableCore(placements, project, selectedClassIds);
      }
    }

    // 5. Convert placements Map to standard Slot[] array
    const outputSlots: Slot[] = [];
    const { school } = project;

    selectedClassIds.forEach((classId) => {
      school.days.forEach((day) => {
        const maxP = school.periodsByDay[day] || 8;
        for (let p = 1; p <= maxP; p++) {
          const key = `${classId}:${day}:${p}`;
          const lesson = placements.get(key);
          const isLocked = lockedMap.has(key);

          outputSlots.push({
            classId,
            day,
            period: p,
            subjectId: lesson ? lesson.subjectId : null,
            teacherId: lesson ? lesson.teacherId : null,
            locked: isLocked,
            isDoublePeriodPart: lesson?.part,
          });
        }
      });
    });

    const runtimeMs = Date.now() - startTime;

    // Final completion callback
    if (onProgress) {
      onProgress({
        phase: evalResult.hardViolations === 0 ? 'done' : 'failed',
        phaseProgress: 100,
        iterations: annealResult.iterations,
        hardConflicts: evalResult.hardViolations,
        softScore: evalResult.softScore,
        softTrend: [evalResult.softScore],
        runtimeMs,
        message: evalResult.hardViolations === 0
          ? 'Timetable generation complete with 0 hard conflicts!'
          : 'Could not resolve all hard conflicts.',
      });
    }

    return {
      success: evalResult.hardViolations === 0,
      slots: outputSlots,
      hardConflicts: evalResult.hardViolations,
      softScore: evalResult.softScore,
      runtimeMs,
      seed: config.seed,
      iterations: annealResult.iterations,
      unsatisfiableCore,
    };
  }

  private createAbortedResult(startTime: number, seed: number): SolverResult {
    return {
      success: false,
      slots: [],
      hardConflicts: 999,
      softScore: 999,
      runtimeMs: Date.now() - startTime,
      seed,
      iterations: 0,
      unsatisfiableCore: ['Solver execution cancelled by user.'],
    };
  }
}
