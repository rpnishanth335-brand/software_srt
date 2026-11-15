import { describe, it, expect, beforeEach } from 'vitest';
import { useTimetableStore } from '../useTimetableStore';

describe('Store & DB Foundation CRUD Actions', () => {
  beforeEach(() => {
    useTimetableStore.getState().resetProject();
  });

  it('performs full CRUD and duplication on Rooms', () => {
    const store = useTimetableStore.getState();

    // 1. Add Room
    store.addRoom({
      name: 'Physics Lab',
      number: 'L-101',
      type: 'lab',
      capacity: 30,
      building: 'Science Block',
    });

    let state = useTimetableStore.getState();
    expect(state.project.rooms).toHaveLength(1);
    expect(state.project.rooms[0].name).toBe('Physics Lab');
    const roomId = state.project.rooms[0].id;

    // 2. Update Room
    store.updateRoom(roomId, { capacity: 35, name: 'Advanced Physics Lab' });
    state = useTimetableStore.getState();
    expect(state.project.rooms[0].capacity).toBe(35);
    expect(state.project.rooms[0].name).toBe('Advanced Physics Lab');

    // 3. Duplicate Room
    store.duplicateRoom(roomId);
    state = useTimetableStore.getState();
    expect(state.project.rooms).toHaveLength(2);
    expect(state.project.rooms[1].name).toContain('Copy');

    // 4. Delete Room
    store.deleteRoom(roomId);
    state = useTimetableStore.getState();
    expect(state.project.rooms).toHaveLength(1);

    // 5. Bulk Delete
    const remainingId = state.project.rooms[0].id;
    store.bulkDeleteRooms([remainingId]);
    state = useTimetableStore.getState();
    expect(state.project.rooms).toHaveLength(0);
  });

  it('performs full CRUD, duplication, and batch generation on Classes', () => {
    const store = useTimetableStore.getState();

    // 1. Add Class
    store.addClass({
      name: 'Grade 10',
      section: 'A',
      selected: true,
      room: 'Room 401',
      strength: 32,
    });

    let state = useTimetableStore.getState();
    expect(state.project.classes).toHaveLength(1);
    const clsId = state.project.classes[0].id;

    // 2. Duplicate Class
    store.duplicateClass(clsId);
    state = useTimetableStore.getState();
    expect(state.project.classes).toHaveLength(2);
    expect(state.project.classes[1].section).toContain('Copy');

    // 3. Quick Generate Batch Classes
    store.quickGenerateClasses(6, 7, ['A', 'B']); // 2 grades * 2 sections = 4 classes
    state = useTimetableStore.getState();
    expect(state.project.classes).toHaveLength(6);

    // 4. Bulk Delete
    const idsToDelete = state.project.classes.slice(0, 3).map((c) => c.id);
    store.bulkDeleteClasses(idsToDelete);
    state = useTimetableStore.getState();
    expect(state.project.classes).toHaveLength(3);
  });

  it('handles Common Subjects presets and referential integrity check', () => {
    const store = useTimetableStore.getState();

    // 1. Add Common Subjects Presets
    store.addCommonSubjects();
    let state = useTimetableStore.getState();
    expect(state.project.subjects.length).toBeGreaterThanOrEqual(8);

    const mathSub = state.project.subjects.find((s) => s.code === 'MATH');
    expect(mathSub).toBeDefined();

    // Add a class and assignment
    store.addClass({ name: 'Grade 8', section: 'A', selected: true });
    state = useTimetableStore.getState();
    const clsId = state.project.classes[0].id;

    // Register a teacher with math
    store.addTeacher({
      name: 'John Nash',
      code: 'JN',
      subjectIds: [mathSub!.id],
      classIds: [clsId],
      maxPerDay: 6,
      maxPerWeek: 25,
      maxConsecutive: 3,
      blocked: [],
    });
    state = useTimetableStore.getState();
    const tchId = state.project.teachers[0].id;

    // Set assignment
    store.setAssignment(clsId, mathSub!.id, tchId, 6);

    // Check dependency analysis
    const depCheck = store.checkEntityDependencies('subject', mathSub!.id);
    expect(depCheck.affectedAssignments).toBe(1);
    expect(depCheck.details.length).toBeGreaterThan(0);

    // Delete subject and verify cascade cleanup
    store.deleteSubject(mathSub!.id);
    state = useTimetableStore.getState();
    expect(state.project.subjects.find((s) => s.id === mathSub!.id)).toBeUndefined();
    // Assignment with that subject should be purged
    expect(state.project.assignments.filter((a) => a.subjectId === mathSub!.id)).toHaveLength(0);
    // Teacher should no longer have that subjectId
    expect(state.project.teachers[0].subjectIds).not.toContain(mathSub!.id);
  });

  it('handles Teacher availability blocking rules and shortcuts', () => {
    const store = useTimetableStore.getState();

    store.addTeacher({
      name: 'Ada Lovelace',
      code: 'AL',
      subjectIds: [],
      classIds: [],
      maxPerDay: 5,
      maxPerWeek: 20,
      maxConsecutive: 3,
      blocked: [],
    });

    let state = useTimetableStore.getState();
    const tchId = state.project.teachers[0].id;

    // Block whole day 1 (Monday)
    store.blockTeacherWholeDay(tchId, 1);
    state = useTimetableStore.getState();
    const tch = state.project.teachers.find((t) => t.id === tchId);
    expect(tch?.blocked.filter((b) => b.day === 1).length).toBe(8);

    // Block whole period 5
    store.blockTeacherWholePeriod(tchId, 5);
    state = useTimetableStore.getState();
    const tchAfterPeriod = state.project.teachers.find((t) => t.id === tchId);
    expect(tchAfterPeriod?.blocked.some((b) => b.period === 5)).toBe(true);

    // Unblock all
    store.unblockTeacherAll(tchId);
    state = useTimetableStore.getState();
    expect(state.project.teachers.find((t) => t.id === tchId)?.blocked).toHaveLength(0);
  });
});
