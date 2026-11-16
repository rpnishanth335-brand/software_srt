import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTimetableWithAi } from '../aiGenerator';
import { Project } from '../../types';
import * as geminiClient from '../../services/geminiClient';

describe('AI Hybrid Timetable Generator with Solver Guarantee', () => {
  const mockProject: Project = {
    id: 'ai-proj',
    updatedAt: Date.now(),
    school: {
      name: 'AI Test School',
      year: '2026-2027',
      days: [1, 2, 3],
      periodsByDay: { 1: 4, 2: 4, 3: 4 },
      periodTimes: [],
      breaks: [],
    },
    classes: [
      { id: 'c1', name: 'Grade 9', section: 'A', selected: true },
    ],
    subjects: [
      { id: 's1', name: 'History', code: 'HIS', color: '#f97316', type: 'theory', doublePeriod: false, maxPerDay: 2, preferMorning: false },
    ],
    teachers: [
      { id: 't1', name: 'Prof. Herodotus', code: 'HER', subjectIds: ['s1'], classIds: ['c1'], maxPerDay: 3, maxPerWeek: 10, maxConsecutive: 3, blocked: [] },
    ],
    rooms: [],
    assignments: [
      { classId: 'c1', subjectId: 's1', teacherId: 't1', periodsPerWeek: 2 },
    ],
    rules: {
      hardRules: {
        noTeacherClash: true,
        noClassClash: true,
        respectTeacherBlocked: true,
        respectMaxPerDay: true,
        respectMaxPerWeek: true,
        doublePeriodsConsecutive: true,
        doublePeriodsNoBreakCrossing: true,
        specialRoomClash: true,
      },
      softWeights: {},
      allowFreePeriods: true,
      maxFreePeriodsPerClass: 10,
    },
    timetables: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully synthesizes conflict-free timetable when Gemini returns valid slots', async () => {
    vi.spyOn(geminiClient, 'callGeminiStructured').mockResolvedValueOnce({
      data: {
        slots: [
          { classId: 'c1', day: 1, period: 1, subjectId: 's1', teacherId: 't1' },
          { classId: 'c1', day: 2, period: 1, subjectId: 's1', teacherId: 't1' },
        ],
        notes: 'Optimal placement with zero conflicts.',
      },
      tokensUsed: 150,
    });

    const result = await generateTimetableWithAi(mockProject, {
      apiKey: 'test-key',
      selectedClassIds: ['c1'],
    });

    expect(result.hardConflicts).toBe(0);
    expect(result.slots.filter((s) => s.subjectId).length).toBe(2);
    expect(result.tokensUsed).toBe(150);
    expect(result.usedFallback).toBe(false);
  });

  it('triggers repair loop and repairs clashes if Gemini first returns conflicts', async () => {
    // First call returns 1 slot (count mismatch)
    vi.spyOn(geminiClient, 'callGeminiStructured')
      .mockResolvedValueOnce({
        data: {
          slots: [
            { classId: 'c1', day: 1, period: 1, subjectId: 's1', teacherId: 't1' },
          ],
          notes: 'Initial draft with missing slot.',
        },
        tokensUsed: 100,
      })
      // Second call (repair round 1) fixes the slot count
      .mockResolvedValueOnce({
        data: {
          slots: [
            { classId: 'c1', day: 1, period: 1, subjectId: 's1', teacherId: 't1' },
            { classId: 'c1', day: 2, period: 2, subjectId: 's1', teacherId: 't1' },
          ],
          notes: 'Repaired slot count.',
        },
        tokensUsed: 120,
      });

    const result = await generateTimetableWithAi(mockProject, {
      apiKey: 'test-key',
      selectedClassIds: ['c1'],
    });

    expect(result.hardConflicts).toBe(0);
    expect(result.slots.filter((s) => s.subjectId).length).toBe(2);
    expect(result.tokensUsed).toBe(220);
  });

  it('automatically falls back to local simulated annealing solver if Gemini API fails', async () => {
    vi.spyOn(geminiClient, 'callGeminiStructured').mockRejectedValueOnce(
      new Error('API quota exceeded (429)')
    );

    const result = await generateTimetableWithAi(mockProject, {
      apiKey: 'test-key',
      selectedClassIds: ['c1'],
    });

    // Guarantee 0 hard conflicts even when cloud AI fails completely!
    expect(result.hardConflicts).toBe(0);
    expect(result.slots.filter((s) => s.subjectId).length).toBe(2);
    expect(result.usedFallback).toBe(true);
    expect(result.explanationNotes).toContain('simulated annealing');
  });
});
