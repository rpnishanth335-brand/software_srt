/**
 * Few-shot worked examples for ChronoForge Timetable Engine.
 * Provides the LLM with concrete demonstrations of valid conflict-free placements,
 * shared teacher staggering, and contiguous double period handling.
 */

export const FEW_SHOT_EXAMPLES = [
  {
    title: 'Example 1: Conflict-Free Multi-Class Scheduling with Shared Teacher',
    scenario:
      'Two classes (Class 8A and Class 8B) both share Teacher T_MATH for Mathematics (3 periods each). Teacher T_ENG teaches English for 8A, and T_SCI teaches Science for 8B. 2 working days, 4 periods/day.',
    solutionConcept:
      'T_MATH cannot be in both 8A and 8B at (Day 0, Period 0). Therefore, at Day 0 Period 0, 8A has MATH with T_MATH while 8B has SCI with T_SCI. At Day 0 Period 1, 8A has ENG with T_ENG while 8B has MATH with T_MATH. Result: 0 teacher clashes.',
    sampleSlots: [
      { classId: 'cls_8a', day: 0, period: 0, subjectId: 'sub_math', teacherId: 'tch_math' },
      { classId: 'cls_8b', day: 0, period: 0, subjectId: 'sub_sci', teacherId: 'tch_sci' },
      { classId: 'cls_8a', day: 0, period: 1, subjectId: 'sub_eng', teacherId: 'tch_eng' },
      { classId: 'cls_8b', day: 0, period: 1, subjectId: 'sub_math', teacherId: 'tch_math' },
      { classId: 'cls_8a', day: 1, period: 0, subjectId: 'sub_eng', teacherId: 'tch_eng' },
      { classId: 'cls_8b', day: 1, period: 0, subjectId: 'sub_math', teacherId: 'tch_math' },
      { classId: 'cls_8a', day: 1, period: 1, subjectId: 'sub_math', teacherId: 'tch_math' },
      { classId: 'cls_8b', day: 1, period: 1, subjectId: 'sub_sci', teacherId: 'tch_sci' },
    ],
  },
  {
    title: 'Example 2: Resolving Teacher Availability Matrix (Blocked Slot Avoidance)',
    scenario:
      'Teacher T_PHYS is unavailable on Day 1 Period 0 and Day 1 Period 1 due to administrative duties. Class 10A requires 2 periods of Physics with T_PHYS.',
    solutionConcept:
      'The engine inspects T_PHYS blocked slots and places Physics in Day 0 Period 1 and Day 1 Period 2 (which is unblocked). Result: 0 blocked-slot violations.',
    sampleSlots: [
      { classId: 'cls_10a', day: 0, period: 1, subjectId: 'sub_phys', teacherId: 'tch_phys' },
      { classId: 'cls_10a', day: 1, period: 2, subjectId: 'sub_phys', teacherId: 'tch_phys' },
    ],
  },
  {
    title: 'Example 3: Double Period Lab Placement without Crossing Breaks',
    scenario:
      'Class 9B has Computer Science Lab requiring a 2-period contiguous block. School has a morning break after Period 2. Available periods: 0, 1, 2, 3, 4.',
    solutionConcept:
      'A double period CANNOT span across Period 2 and Period 3 because a break exists after Period 2. The engine places the double period at Period 0 and Period 1 consecutively on Day 2. Result: valid double-period integrity.',
    sampleSlots: [
      { classId: 'cls_9b', day: 2, period: 0, subjectId: 'sub_comp_lab', teacherId: 'tch_comp' },
      { classId: 'cls_9b', day: 2, period: 1, subjectId: 'sub_comp_lab', teacherId: 'tch_comp' },
    ],
  },
];
