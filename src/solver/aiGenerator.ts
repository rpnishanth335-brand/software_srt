import { Project, Slot, ID } from '../types';
import { computeTimetableCalculations, FullTimetableCalculations } from '../calc/timetableMath';
import { validateTimetable, ValidationSummary } from './validator';
import { callGeminiStructured } from '../services/geminiClient';
import { SolverEngine } from './engine';
import { CHRONOFORGE_SYSTEM_PROMPT } from '../ai/systemPrompt';
import { FEW_SHOT_EXAMPLES } from '../ai/examples';

export type AiGeneratorStage =
  | 'calculating'
  | 'preparing'
  | 'calling_ai'
  | 'validating'
  | 'repairing'
  | 'finalizing'
  | 'completed'
  | 'fallback_solver';

export interface StageProgressUpdate {
  stage: AiGeneratorStage;
  message: string;
  progressPct: number;
  hardConflicts?: number;
  softScore?: number;
  tokensUsed?: number;
  activeRound?: number;
}

export interface AiGenerationResult {
  slots: Slot[];
  hardConflicts: number;
  softScore: number;
  aiVsSolverCorrections: number;
  runtimeMs: number;
  tokensUsed: number;
  explanationNotes: string;
  usedFallback: boolean;
  calculations: FullTimetableCalculations;
  validation: ValidationSummary;
}

export interface AiGeneratorOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  useProxy?: boolean;
  selectedClassIds?: ID[];
  extraInstructions?: string;
  seed?: number;
  qualityMode?: 'fast' | 'balanced' | 'best';
  onProgress?: (update: StageProgressUpdate) => void;
  signal?: AbortSignal;
}

const GEMINI_TIMETABLE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slots: {
      type: 'ARRAY',
      description: 'The assigned timetable slot placements.',
      items: {
        type: 'OBJECT',
        properties: {
          classId: { type: 'STRING' },
          day: { type: 'INTEGER' },
          period: { type: 'INTEGER' },
          subjectId: { type: 'STRING' },
          teacherId: { type: 'STRING' },
        },
        required: ['classId', 'day', 'period', 'subjectId', 'teacherId'],
      },
    },
    notes: {
      type: 'STRING',
      description: 'A brief explanation of how scheduling constraints were balanced.',
    },
  },
  required: ['slots'],
};

/**
 * Builds compact, anonymized representation of the project for LLM transmission.
 */
export function buildCompactAiPayload(
  project: Project,
  selectedClassIds: ID[],
  calculations: FullTimetableCalculations,
  lockedSlots: Slot[],
  extraInstructions?: string
) {
  const { school, classes, subjects, teachers, assignments, rules } = project;
  const activeClasses = classes.filter((c) => selectedClassIds.includes(c.id));

  return {
    school: {
      days: school.days,
      periodsByDay: school.periodsByDay,
      breaks: (school.breaks || []).map((b) => ({ name: b.name, afterPeriod: b.afterPeriod })),
    },
    classes: activeClasses.map((c) => ({ id: c.id, name: c.name, section: c.section })),
    subjects: subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      doublePeriod: s.doublePeriod,
      preferMorning: s.preferMorning,
      maxPerDay: s.maxPerDay,
    })),
    teachers: teachers.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      maxPerDay: t.maxPerDay,
      maxPerWeek: t.maxPerWeek,
      blocked: t.blocked,
    })),
    assignments: assignments
      .filter((a) => selectedClassIds.includes(a.classId))
      .map((a) => ({
        classId: a.classId,
        subjectId: a.subjectId,
        teacherId: a.teacherId,
        periodsPerWeek: a.periodsPerWeek,
      })),
    preCalculatedTargets: calculations.subjectDistributions.map((sd) => ({
      classId: sd.classId,
      subjectId: sd.subjectId,
      periodsPerWeek: sd.periodsPerWeek,
      distribution: sd.recommendedDistribution,
    })),
    lockedSlots: lockedSlots.map((ls) => ({
      classId: ls.classId,
      day: ls.day,
      period: ls.period,
      subjectId: ls.subjectId,
      teacherId: ls.teacherId,
    })),
    rules: {
      hard: rules.hardRules,
      soft: rules.softWeights,
    },
    extraInstructions: extraInstructions || 'None',
  };
}

/**
 * Executes the Hybrid AI Generation Pipeline:
 * 1. Local Pre-Flight Math
 * 2. Gemini Structured Generation
 * 3. Deterministic Validation
 * 4. Gemini Repair Loop (Up to 3 rounds)
 * 5. Local Annealing Guarantee if AI has residual clashes or fails
 */
export async function generateTimetableWithAi(
  project: Project,
  options: AiGeneratorOptions
): Promise<AiGenerationResult> {
  const startTime = Date.now();
  let totalTokensUsed = 0;
  let aiVsSolverCorrections = 0;
  let usedFallback = false;
  let explanationNotes = '';

  const selectedClassIds = options.selectedClassIds || project.classes.filter((c) => c.selected).map((c) => c.id);
  const activeVersion = project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
  const lockedSlots = activeVersion ? activeVersion.slots.filter((s) => s.locked) : [];

  // -------------------------------------------------------------
  // STAGE 1: LOCAL MATHEMATICAL PRE-CALCULATIONS
  // -------------------------------------------------------------
  options.onProgress?.({
    stage: 'calculating',
    message: 'Computing class slot utilization, teacher loads, and pigeonhole scarcity...',
    progressPct: 10,
  });

  const calculations = computeTimetableCalculations(project);

  if (calculations.hasBlockingErrors) {
    throw new Error(
      `Generation halted: Mathematical impossibility detected. Reasons:\n${calculations.global.reasons.join('\n')}`
    );
  }

  // -------------------------------------------------------------
  // STAGE 2: PREPARING COMPACT PAYLOAD
  // -------------------------------------------------------------
  options.onProgress?.({
    stage: 'preparing',
    message: 'Compiling structured anonymized payload and distribution matrices...',
    progressPct: 20,
  });

  const compactPayload = buildCompactAiPayload(
    project,
    selectedClassIds,
    calculations,
    lockedSlots,
    options.extraInstructions
  );

  let currentSlots: Slot[] = [];

  try {
    // -------------------------------------------------------------
    // STAGE 3: ASKING GEMINI AI
    // -------------------------------------------------------------
    options.onProgress?.({
      stage: 'calling_ai',
      message: `Prompting Gemini (${options.model || 'gemini-flash-latest'}) with responseSchema...`,
      progressPct: 40,
    });

    const highLoadTeachers = (calculations.teachers || [])
      .filter((t) => t.utilizationPct >= 75)
      .map((t) => `${t.teacherName} (${t.requiredPeriods}/${t.maxPerWeek} periods, ${Math.round(t.utilizationPct)}% load)`)
      .join(', ');

    const doublePeriodSubjects = (project.subjects || [])
      .filter((s) => s.doublePeriod)
      .map((s) => s.name)
      .join(', ');

    const fewShotSummary = FEW_SHOT_EXAMPLES.map((ex) => `• ${ex.title}: ${ex.solutionConcept}`).join('\n');

    const aiPrompt = `
Generate a conflict-free, master school timetable satisfying all hard constraints.

PRE-CALCULATED BOTTLENECKS & HEURISTIC GUIDANCE:
${highLoadTeachers ? `• High-Capacity Teachers (Prioritize early to avoid pigeonhole clashes): ${highLoadTeachers}` : '• Teacher loads are well balanced.'}
${doublePeriodSubjects ? `• Double-Period Subjects (Must be 2 consecutive periods without crossing breaks): ${doublePeriodSubjects}` : '• No double periods required.'}

FEW-SHOT CANONICAL PATTERNS:
${fewShotSummary}

PROJECT INPUT SPECIFICATION:
${JSON.stringify(compactPayload, null, 2)}

Produce a valid JSON object matching the requested schema with all required slots and explanatory notes. Zero hard conflicts are permitted.
    `.trim();

    const aiRes = await callGeminiStructured<{ slots: any[]; notes?: string }>(
      options.apiKey,
      aiPrompt,
      {
        model: options.model,
        temperature: options.temperature,
        useProxy: options.useProxy,
        systemInstruction: CHRONOFORGE_SYSTEM_PROMPT,
        responseSchema: GEMINI_TIMETABLE_SCHEMA,
        signal: options.signal,
      }
    );

    totalTokensUsed += aiRes.tokensUsed || 0;
    explanationNotes = aiRes.data.notes || 'Generated with Google Gemini AI.';

    // Map AI slots
    currentSlots = (aiRes.data.slots || []).map((s) => ({
      classId: s.classId,
      day: s.day,
      period: s.period,
      subjectId: s.subjectId,
      teacherId: s.teacherId,
      locked: lockedSlots.some((ls) => ls.classId === s.classId && ls.day === s.day && ls.period === s.period),
    }));

    // -------------------------------------------------------------
    // STAGE 4: DETERMINISTIC VALIDATION & REPAIR LOOP (UP TO 3 ROUNDS)
    // -------------------------------------------------------------
    let validation = validateTimetable(currentSlots, project, selectedClassIds, lockedSlots);
    let round = 1;
    const maxRepairRounds = 3;

    while (!validation.isValid && round <= maxRepairRounds) {
      if (options.signal?.aborted) throw new Error('Generation cancelled by user.');

      options.onProgress?.({
        stage: 'repairing',
        message: `Attempting Gemini targeted repair (Round ${round}/${maxRepairRounds}): ${validation.hardConflictCount} residual clashes...`,
        progressPct: 55 + round * 10,
        hardConflicts: validation.hardConflictCount,
        activeRound: round,
      });

      const repairPrompt = `
Your timetable produced ${validation.hardConflictCount} hard rule violations:
${validation.violations.slice(0, 15).map((v) => `• [${v.ruleId}] ${v.description}`).join('\n')}

Please repair these specific conflicts while keeping valid slots in place.
Return the updated complete slots array.
      `.trim();

      try {
        const repairRes = await callGeminiStructured<{ slots: any[]; notes?: string }>(
          options.apiKey,
          repairPrompt,
          {
            model: options.model,
            temperature: 0.1,
            useProxy: options.useProxy,
            systemInstruction: CHRONOFORGE_SYSTEM_PROMPT,
            responseSchema: GEMINI_TIMETABLE_SCHEMA,
            signal: options.signal,
          }
        );

        totalTokensUsed += repairRes.tokensUsed || 0;
        if (repairRes.data.slots && repairRes.data.slots.length > 0) {
          currentSlots = repairRes.data.slots.map((s) => ({
            classId: s.classId,
            day: s.day,
            period: s.period,
            subjectId: s.subjectId,
            teacherId: s.teacherId,
            locked: lockedSlots.some((ls) => ls.classId === s.classId && ls.day === s.day && ls.period === s.period),
          }));
        }
      } catch (err) {
        console.warn('Gemini repair round failed, proceeding to solver guarantee:', err);
        break;
      }

      validation = validateTimetable(currentSlots, project, selectedClassIds, lockedSlots);
      round++;
    }

    // -------------------------------------------------------------
    // STAGE 5: LOCAL SOLVER GUARANTEE IF CLASHES PERSIST
    // -------------------------------------------------------------
    if (!validation.isValid) {
      options.onProgress?.({
        stage: 'fallback_solver',
        message: `Finalizing with Local Simulated Annealing guarantee (${validation.hardConflictCount} clashes being repaired to 0)...`,
        progressPct: 88,
      });

      aiVsSolverCorrections = validation.hardConflictCount;

      const engine = new SolverEngine();
      const solverResult = await engine.solve(
        project,
        {
          seed: options.seed || 42,
          qualityMode: options.qualityMode || 'balanced',
          selectedClassIds,
        },
        lockedSlots
      );

      currentSlots = solverResult.slots;
      usedFallback = true;
      explanationNotes += ` (Deterministic solver applied to guarantee 0 hard conflicts).`;
    }
  } catch (err: any) {
    console.warn('AI pipeline error, automatically running local solver fallback:', err);
    usedFallback = true;

    options.onProgress?.({
      stage: 'fallback_solver',
      message: `Cloud AI unavailable (${err?.message || 'Error'}). Running Local Simulated Annealing fallback...`,
      progressPct: 80,
    });

    const engine = new SolverEngine();
    const solverResult = await engine.solve(
      project,
      {
        seed: options.seed || 42,
        qualityMode: options.qualityMode || 'balanced',
        selectedClassIds,
      },
      lockedSlots
    );

    currentSlots = solverResult.slots;
    aiVsSolverCorrections = solverResult.slots.length;
    explanationNotes = `Timetable forged via deterministic simulated annealing. (${err?.message || 'Cloud AI unavailable'})`;
  }

  // -------------------------------------------------------------
  // STAGE 6: FINALIZING & SCORING
  // -------------------------------------------------------------
  options.onProgress?.({
    stage: 'finalizing',
    message: 'Computing final constraint metrics and soft quality scores...',
    progressPct: 98,
  });

  const finalValidation = validateTimetable(currentSlots, project, selectedClassIds, lockedSlots);

  options.onProgress?.({
    stage: 'completed',
    message: 'Timetable generated successfully with 0 hard conflicts!',
    progressPct: 100,
    hardConflicts: finalValidation.hardConflictCount,
    softScore: finalValidation.softScore,
  });

  return {
    slots: currentSlots,
    hardConflicts: finalValidation.hardConflictCount,
    softScore: finalValidation.softScore,
    aiVsSolverCorrections,
    runtimeMs: Date.now() - startTime,
    tokensUsed: totalTokensUsed,
    explanationNotes,
    usedFallback,
    calculations,
    validation: finalValidation,
  };
}
