import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Project, 
  School, 
  ClassRoom, 
  Subject, 
  Teacher, 
  Room,
  RuleConfig, 
  TimetableVersion, 
  Slot, 
  ID,
  ToastNotification,
  AppRoute
} from '../types';
import { getDemoSchoolProject } from './demoSchool';
import { saveProjectToDB } from './db';

export interface TimetableState {
  // Current active project
  project: Project;
  
  // Navigation & UI state
  currentRoute: AppRoute;
  activeStep: number; // 1 to 10 for guided wizard mode
  activeTab: 'byClass' | 'byTeacher' | 'master';
  selectedClassId: ID | null;
  selectedTeacherId: ID | null;
  
  // Toasts
  toasts: ToastNotification[];
  
  // Undo / Redo history for manual timetable edits
  undoStack: Slot[][];
  redoStack: Slot[][];
  
  // Status & Autosave tracking
  isDirty: boolean;
  lastSavedAt: number;

  // Actions
  setCurrentRoute: (route: AppRoute) => void;
  setStep: (step: number) => void;
  setActiveTab: (tab: 'byClass' | 'byTeacher' | 'master') => void;
  setSelectedClassId: (id: ID | null) => void;
  setSelectedTeacherId: (id: ID | null) => void;
  
  // Toast notifications
  addToast: (message: string, type?: ToastNotification['type']) => void;
  removeToast: (id: string) => void;
  
  // Step 1: School Basics & Onboarding
  updateSchool: (school: Partial<School>) => void;
  completeOnboarding: (schoolDetails: Partial<School>) => void;
  setWorkingDays: (days: number[]) => void;
  setPeriodsForDay: (day: number, count: number) => void;
  
  // Classes
  addClass: (cls: Omit<ClassRoom, 'id'>) => void;
  updateClass: (id: ID, updates: Partial<ClassRoom>) => void;
  deleteClass: (id: ID, cascade?: boolean) => void;
  duplicateClass: (id: ID) => void;
  toggleSelectClass: (id: ID) => void;
  selectAllClasses: (selected: boolean) => void;
  bulkDeleteClasses: (ids: ID[]) => void;
  quickGenerateClasses: (startGrade: number, endGrade: number, sections: string[]) => void;
  
  // Subjects
  addSubject: (sub: Omit<Subject, 'id'>) => void;
  updateSubject: (id: ID, updates: Partial<Subject>) => void;
  deleteSubject: (id: ID, cascade?: boolean) => void;
  duplicateSubject: (id: ID) => void;
  bulkDeleteSubjects: (ids: ID[]) => void;
  importSubjects: (subjects: Omit<Subject, 'id'>[]) => void;
  addCommonSubjects: () => void;

  // Teachers / Staff
  addTeacher: (tch: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: ID, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: ID, cascade?: boolean) => void;
  duplicateTeacher: (id: ID) => void;
  bulkDeleteTeachers: (ids: ID[]) => void;
  toggleTeacherBlocked: (teacherId: ID, day: number, period: number) => void;
  blockTeacherWholeDay: (teacherId: ID, day: number) => void;
  blockTeacherWholePeriod: (teacherId: ID, period: number) => void;
  unblockTeacherAll: (teacherId: ID) => void;

  // Rooms & Resources
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: ID, updates: Partial<Room>) => void;
  deleteRoom: (id: ID) => void;
  duplicateRoom: (id: ID) => void;
  bulkDeleteRooms: (ids: ID[]) => void;

  // Referential Integrity Helper
  checkEntityDependencies: (
    type: 'class' | 'subject' | 'teacher' | 'room',
    id: ID
  ) => { canDelete: boolean; affectedAssignments: number; affectedSlots: number; details: string[] };

  // Assignments
  setAssignment: (classId: ID, subjectId: ID, teacherId: ID, periodsPerWeek: number) => void;
  copyClassAssignments: (sourceClassId: ID, targetClassIds: ID[]) => void;
  clearClassAssignments: (classId?: ID) => void;
  suggestTeacherForAssignment: (classId: ID, subjectId: ID) => ID | null;
  autoAssignLowestLoad: () => void;
  autoAssignTeachers: () => void;

  // Rules
  updateRules: (rules: Partial<RuleConfig>) => void;

  // Generator
  setTimetableVersion: (version: TimetableVersion) => void;

  // Timetable Manual Editing
  moveOrSwapSlot: (
    source: { classId: ID; day: number; period: number },
    target: { classId: ID; day: number; period: number }
  ) => void;
  toggleLockSlot: (classId: ID, day: number, period: number) => void;
  undo: () => void;
  redo: () => void;

  // Project Management
  loadDemoSchool: () => void;
  resetProject: () => void;
  loadProject: (project: Project) => void;
  persistToDatabase: () => Promise<void>;
}

const initialDemo = getDemoSchoolProject();

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set, get) => ({
      project: {
        ...initialDemo,
        rooms: initialDemo.rooms || [],
      },
      currentRoute: 'dashboard',
      activeStep: 1,
      activeTab: 'byClass',
      selectedClassId: initialDemo.classes[0]?.id || null,
      selectedTeacherId: initialDemo.teachers[0]?.id || null,
      toasts: [],
      undoStack: [],
      redoStack: [],
      isDirty: false,
      lastSavedAt: Date.now(),

      setCurrentRoute: (route) => set({ currentRoute: route }),
      setStep: (step) => set({ activeStep: Math.max(1, Math.min(10, step)) }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedClassId: (id) => set({ selectedClassId: id }),
      setSelectedTeacherId: (id) => set({ selectedTeacherId: id }),

      addToast: (message, type = 'info') => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        set((state) => ({
          toasts: [...state.toasts, { id, message, type, timestamp: Date.now() }],
        }));
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
          get().removeToast(id);
        }, 4000);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      updateSchool: (schoolUpdates) => {
        set((state) => ({
          project: {
            ...state.project,
            school: { ...state.project.school, ...schoolUpdates },
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      setWorkingDays: (days) => {
        set((state) => {
          const currentPeriods = { ...state.project.school.periodsByDay };
          days.forEach((d) => {
            if (!currentPeriods[d]) currentPeriods[d] = 8;
          });
          return {
            project: {
              ...state.project,
              school: {
                ...state.project.school,
                days: days.sort((a, b) => a - b),
                periodsByDay: currentPeriods,
              },
              updatedAt: Date.now(),
            },
            isDirty: true,
          };
        });
        get().persistToDatabase();
      },

      setPeriodsForDay: (day, count) => {
        set((state) => ({
          project: {
            ...state.project,
            school: {
              ...state.project.school,
              periodsByDay: {
                ...state.project.school.periodsByDay,
                [day]: count,
              },
            },
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      addClass: (clsData) => {
        const id = `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        set((state) => ({
          project: {
            ...state.project,
            classes: [...state.project.classes, { ...clsData, id }],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Added class: ${clsData.name} – ${clsData.section}`, 'success');
      },

      updateClass: (id, updates) => {
        set((state) => ({
          project: {
            ...state.project,
            classes: state.project.classes.map((c) => (c.id === id ? { ...c, ...updates } : c)),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Class updated successfully', 'success');
      },

      deleteClass: (id) => {
        set((state) => ({
          project: {
            ...state.project,
            classes: state.project.classes.filter((c) => c.id !== id),
            assignments: state.project.assignments.filter((a) => a.classId !== id),
            updatedAt: Date.now(),
          },
          selectedClassId: state.selectedClassId === id ? null : state.selectedClassId,
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Class deleted', 'info');
      },

      duplicateClass: (id) => {
        const cls = get().project.classes.find((c) => c.id === id);
        if (!cls) return;
        const newId = `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const duplicated: ClassRoom = {
          ...cls,
          id: newId,
          section: `${cls.section}-Copy`,
        };
        const sourceAssignments = get().project.assignments.filter((a) => a.classId === id);
        const newAssignments = sourceAssignments.map((a) => ({
          ...a,
          classId: newId,
        }));
        set((state) => ({
          project: {
            ...state.project,
            classes: [...state.project.classes, duplicated],
            assignments: [...state.project.assignments, ...newAssignments],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Duplicated ${cls.name} – ${cls.section}`, 'success');
      },

      bulkDeleteClasses: (ids) => {
        set((state) => ({
          project: {
            ...state.project,
            classes: state.project.classes.filter((c) => !ids.includes(c.id)),
            assignments: state.project.assignments.filter((a) => !ids.includes(a.classId)),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Deleted ${ids.length} classes`, 'info');
      },

      toggleSelectClass: (id) => {
        set((state) => ({
          project: {
            ...state.project,
            classes: state.project.classes.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      selectAllClasses: (selected) => {
        set((state) => ({
          project: {
            ...state.project,
            classes: state.project.classes.map((c) => ({ ...c, selected })),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      quickGenerateClasses: (startGrade, endGrade, sections) => {
        const newClasses: ClassRoom[] = [];
        for (let g = startGrade; g <= endGrade; g++) {
          for (const s of sections) {
            newClasses.push({
              id: `cls-g${g}-${s.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              name: `Grade ${g}`,
              section: s.toUpperCase(),
              selected: true,
              room: `Room ${g}0${sections.indexOf(s) + 1}`,
              strength: 30,
            });
          }
        }
        set((state) => ({
          project: {
            ...state.project,
            classes: [...state.project.classes, ...newClasses],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Generated ${newClasses.length} class cohorts!`, 'success');
      },

      addSubject: (subData) => {
        const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        set((state) => ({
          project: {
            ...state.project,
            subjects: [...state.project.subjects, { ...subData, id }],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Subject added: ${subData.name} (${subData.code})`, 'success');
      },

      updateSubject: (id, updates) => {
        set((state) => ({
          project: {
            ...state.project,
            subjects: state.project.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Subject updated successfully', 'success');
      },

      deleteSubject: (id) => {
        set((state) => ({
          project: {
            ...state.project,
            subjects: state.project.subjects.filter((s) => s.id !== id),
            assignments: state.project.assignments.filter((a) => a.subjectId !== id),
            teachers: state.project.teachers.map((t) => ({
              ...t,
              subjectIds: t.subjectIds.filter((sid) => sid !== id),
            })),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Subject removed', 'info');
      },

      duplicateSubject: (id) => {
        const sub = get().project.subjects.find((s) => s.id === id);
        if (!sub) return;
        const newId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const duplicated: Subject = {
          ...sub,
          id: newId,
          name: `${sub.name} (Copy)`,
          code: `${sub.code}_C`.slice(0, 8),
        };
        set((state) => ({
          project: {
            ...state.project,
            subjects: [...state.project.subjects, duplicated],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Duplicated subject: ${sub.name}`, 'success');
      },

      bulkDeleteSubjects: (ids) => {
        set((state) => ({
          project: {
            ...state.project,
            subjects: state.project.subjects.filter((s) => !ids.includes(s.id)),
            assignments: state.project.assignments.filter((a) => !ids.includes(a.subjectId)),
            teachers: state.project.teachers.map((t) => ({
              ...t,
              subjectIds: t.subjectIds.filter((sid) => !ids.includes(sid)),
            })),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Deleted ${ids.length} subjects`, 'info');
      },

      importSubjects: (subs) => {
        const newSubs = subs.map((s) => ({
          ...s,
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        }));
        set((state) => ({
          project: {
            ...state.project,
            subjects: [...state.project.subjects, ...newSubs],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Imported ${newSubs.length} subjects!`, 'success');
      },

      addCommonSubjects: () => {
        const commonPresets: Omit<Subject, 'id'>[] = [
          { name: 'English Literature', code: 'ENG', color: '#10b981', type: 'theory', doublePeriod: false, maxPerDay: 2, preferMorning: false },
          { name: 'Mathematics', code: 'MATH', color: '#f97316', type: 'theory', doublePeriod: false, maxPerDay: 2, preferMorning: true },
          { name: 'Science', code: 'SCI', color: '#06b6d4', type: 'theory', doublePeriod: false, maxPerDay: 2, preferMorning: true },
          { name: 'Social Studies', code: 'SOC', color: '#eab308', type: 'theory', doublePeriod: false, maxPerDay: 1, preferMorning: false },
          { name: 'Computer Science', code: 'CS', color: '#6366f1', type: 'lab', doublePeriod: true, maxPerDay: 2, preferMorning: false },
          { name: 'Second Language (Hindi/Regional)', code: 'LANG', color: '#8b5cf6', type: 'theory', doublePeriod: false, maxPerDay: 2, preferMorning: false },
          { name: 'Physical Education', code: 'PE', color: '#ef4444', type: 'sports', doublePeriod: false, maxPerDay: 1, preferMorning: false },
          { name: 'Visual Arts & Craft', code: 'ART', color: '#ec4899', type: 'activity', doublePeriod: false, maxPerDay: 1, preferMorning: false },
        ];
        const existingCodes = new Set(get().project.subjects.map((s) => s.code));
        const toAdd = commonPresets
          .filter((p) => !existingCodes.has(p.code))
          .map((p) => ({
            ...p,
            id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          }));
        if (toAdd.length === 0) {
          get().addToast('All common subjects are already added.', 'info');
          return;
        }
        set((state) => ({
          project: {
            ...state.project,
            subjects: [...state.project.subjects, ...toAdd],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Added ${toAdd.length} standard subjects!`, 'success');
      },

      addTeacher: (tchData) => {
        const id = `tch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        set((state) => ({
          project: {
            ...state.project,
            teachers: [...state.project.teachers, { ...tchData, id }],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Teacher registered: ${tchData.name}`, 'success');
      },

      updateTeacher: (id, updates) => {
        set((state) => ({
          project: {
            ...state.project,
            teachers: state.project.teachers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Teacher updated', 'success');
      },

      deleteTeacher: (id) => {
        set((state) => ({
          project: {
            ...state.project,
            teachers: state.project.teachers.filter((t) => t.id !== id),
            assignments: state.project.assignments.map((a) =>
              a.teacherId === id ? { ...a, teacherId: '' } : a
            ),
            updatedAt: Date.now(),
          },
          selectedTeacherId: state.selectedTeacherId === id ? null : state.selectedTeacherId,
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Teacher removed', 'info');
      },

      duplicateTeacher: (id) => {
        const tch = get().project.teachers.find((t) => t.id === id);
        if (!tch) return;
        const newId = `tch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const duplicated: Teacher = {
          ...tch,
          id: newId,
          name: `${tch.name} (Copy)`,
          code: `${tch.code}2`.slice(0, 5),
          blocked: [...tch.blocked],
        };
        set((state) => ({
          project: {
            ...state.project,
            teachers: [...state.project.teachers, duplicated],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Duplicated teacher: ${tch.name}`, 'success');
      },

      bulkDeleteTeachers: (ids) => {
        set((state) => ({
          project: {
            ...state.project,
            teachers: state.project.teachers.filter((t) => !ids.includes(t.id)),
            assignments: state.project.assignments.map((a) =>
              ids.includes(a.teacherId) ? { ...a, teacherId: '' } : a
            ),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Deleted ${ids.length} teachers`, 'info');
      },

      toggleTeacherBlocked: (teacherId, day, period) => {
        set((state) => ({
          project: {
            ...state.project,
            teachers: state.project.teachers.map((t) => {
              if (t.id !== teacherId) return t;
              const exists = t.blocked.some((b) => b.day === day && b.period === period);
              const blocked = exists
                ? t.blocked.filter((b) => !(b.day === day && b.period === period))
                : [...t.blocked, { day, period }];
              return { ...t, blocked };
            }),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      blockTeacherWholeDay: (teacherId, day) => {
        const { school } = get().project;
        const dayPeriods = school.periodsByDay[day] || 8;
        set((state) => ({
          project: {
            ...state.project,
            teachers: state.project.teachers.map((t) => {
              if (t.id !== teacherId) return t;
              const otherBlocked = t.blocked.filter((b) => b.day !== day);
              const wholeDay = Array.from({ length: dayPeriods }, (_, i) => ({ day, period: i + 1 }));
              return { ...t, blocked: [...otherBlocked, ...wholeDay] };
            }),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Blocked entire day for teacher', 'info');
      },

      blockTeacherWholePeriod: (teacherId, period) => {
        const { school } = get().project;
        set((state) => ({
          project: {
            ...state.project,
            teachers: state.project.teachers.map((t) => {
              if (t.id !== teacherId) return t;
              const otherBlocked = t.blocked.filter((b) => b.period !== period);
              const wholePeriod = school.days.map((d) => ({ day: d, period }));
              return { ...t, blocked: [...otherBlocked, ...wholePeriod] };
            }),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Blocked Period ${period} across all days for teacher`, 'info');
      },

      unblockTeacherAll: (teacherId) => {
        set((state) => ({
          project: {
            ...state.project,
            teachers: state.project.teachers.map((t) =>
              t.id === teacherId ? { ...t, blocked: [] } : t
            ),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Cleared all blocked slots for teacher.', 'info');
      },

      // Rooms
      addRoom: (roomData) => {
        const id = `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        set((state) => ({
          project: {
            ...state.project,
            rooms: [...(state.project.rooms || []), { ...roomData, id }],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Room added: ${roomData.name}`, 'success');
      },

      updateRoom: (id, updates) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: (state.project.rooms || []).map((r) => (r.id === id ? { ...r, ...updates } : r)),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Room updated', 'success');
      },

      deleteRoom: (id) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: (state.project.rooms || []).filter((r) => r.id !== id),
            classes: state.project.classes.map((c) => (c.roomId === id ? { ...c, roomId: undefined } : c)),
            subjects: state.project.subjects.map((s) => (s.specialRoomId === id ? { ...s, specialRoomId: undefined } : s)),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast('Room deleted', 'info');
      },

      duplicateRoom: (id) => {
        const room = (get().project.rooms || []).find((r) => r.id === id);
        if (!room) return;
        const newId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const duplicated: Room = {
          ...room,
          id: newId,
          name: `${room.name} (Copy)`,
          number: `${room.number}-B`,
        };
        set((state) => ({
          project: {
            ...state.project,
            rooms: [...(state.project.rooms || []), duplicated],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Duplicated room: ${room.name}`, 'success');
      },

      bulkDeleteRooms: (ids) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: (state.project.rooms || []).filter((r) => !ids.includes(r.id)),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(`Deleted ${ids.length} rooms`, 'info');
      },

      copyClassAssignments: (sourceClassId, targetClassIds) => {
        const sourceAssignments = get().project.assignments.filter((a) => a.classId === sourceClassId);
        if (sourceAssignments.length === 0) {
          get().addToast('Source class has no assignments to copy.', 'warning');
          return;
        }

        set((state) => {
          let updatedAssignments = state.project.assignments.filter(
            (a) => !targetClassIds.includes(a.classId)
          );

          targetClassIds.forEach((targetId) => {
            const copies = sourceAssignments.map((a) => ({
              ...a,
              classId: targetId,
            }));
            updatedAssignments = [...updatedAssignments, ...copies];
          });

          return {
            project: {
              ...state.project,
              assignments: updatedAssignments,
              updatedAt: Date.now(),
            },
            isDirty: true,
          };
        });
        get().persistToDatabase();
        get().addToast(`Copied assignments to ${targetClassIds.length} classes!`, 'success');
      },

      clearClassAssignments: (classId) => {
        set((state) => ({
          project: {
            ...state.project,
            assignments: classId
              ? state.project.assignments.filter((a) => a.classId !== classId)
              : [],
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
        get().addToast(classId ? 'Cleared all assignments for this class.' : 'All curriculum assignments reset to 0.', 'info');
      },

      autoAssignTeachers: () => {
        get().autoAssignLowestLoad();
      },

      checkEntityDependencies: (type, id) => {
        const { assignments, timetables, currentVersionId, teachers, classes, subjects, rooms } = get().project;
        const activeVersion = timetables.find((t) => t.id === currentVersionId) || timetables[0];
        const slots = activeVersion?.slots || [];
        const details: string[] = [];

        let affectedAssignments = 0;
        let affectedSlots = 0;

        if (type === 'class') {
          affectedAssignments = assignments.filter((a) => a.classId === id).length;
          affectedSlots = slots.filter((s) => s.classId === id && s.subjectId).length;
          const cls = classes.find((c) => c.id === id);
          if (affectedAssignments > 0) {
            details.push(`${cls?.name || 'Class'} has ${affectedAssignments} curriculum assignment rules.`);
          }
          if (affectedSlots > 0) {
            details.push(`${affectedSlots} scheduled slots in generated timetables will be purged.`);
          }
        } else if (type === 'subject') {
          affectedAssignments = assignments.filter((a) => a.subjectId === id).length;
          affectedSlots = slots.filter((s) => s.subjectId === id).length;
          const teachersWithSub = teachers.filter((t) => t.subjectIds.includes(id)).length;
          const sub = subjects.find((s) => s.id === id);
          if (affectedAssignments > 0) {
            details.push(`${sub?.name || 'Subject'} is assigned in ${affectedAssignments} class schedules.`);
          }
          if (teachersWithSub > 0) {
            details.push(`${teachersWithSub} faculty members handle this subject.`);
          }
          if (affectedSlots > 0) {
            details.push(`${affectedSlots} scheduled slots will be cleared.`);
          }
        } else if (type === 'teacher') {
          affectedAssignments = assignments.filter((a) => a.teacherId === id).length;
          affectedSlots = slots.filter((s) => s.teacherId === id).length;
          const tea = teachers.find((t) => t.id === id);
          if (affectedAssignments > 0) {
            details.push(`${tea?.name || 'Teacher'} is assigned ${affectedAssignments} classes.`);
          }
          if (affectedSlots > 0) {
            details.push(`${affectedSlots} periods will become unassigned.`);
          }
        } else if (type === 'room') {
          const classesUsingRoom = classes.filter((c) => c.roomId === id).length;
          const subjectsUsingRoom = subjects.filter((s) => s.specialRoomId === id).length;
          const rm = (rooms || []).find((r) => r.id === id);
          if (classesUsingRoom > 0) {
            details.push(`${classesUsingRoom} classes use ${rm?.name || 'this room'} as homeroom.`);
          }
          if (subjectsUsingRoom > 0) {
            details.push(`${subjectsUsingRoom} subjects require this special lab.`);
          }
        }

        return {
          canDelete: true,
          affectedAssignments,
          affectedSlots,
          details,
        };
      },

      setAssignment: (classId, subjectId, teacherId, periodsPerWeek) => {
        set((state) => {
          const filtered = state.project.assignments.filter(
            (a) => !(a.classId === classId && a.subjectId === subjectId)
          );
          const nextAssignments = periodsPerWeek > 0
            ? [...filtered, { classId, subjectId, teacherId, periodsPerWeek }]
            : filtered;

          return {
            project: {
              ...state.project,
              assignments: nextAssignments,
              updatedAt: Date.now(),
            },
            isDirty: true,
          };
        });
        get().persistToDatabase();
      },

      suggestTeacherForAssignment: (classId, subjectId) => {
        const { teachers, assignments } = get().project;
        // Eligible teachers handle this subject and class
        const eligible = teachers.filter(
          (t) => t.subjectIds.includes(subjectId) && (t.classIds.includes(classId) || t.classIds.length === 0)
        );
        if (eligible.length === 0) return null;

        // Compute current load for each
        const loadMap: Record<ID, number> = {};
        eligible.forEach((t) => {
          loadMap[t.id] = assignments
            .filter((a) => a.teacherId === t.id)
            .reduce((sum, a) => sum + a.periodsPerWeek, 0);
        });

        // Pick lowest load below maxPerWeek
        eligible.sort((a, b) => (loadMap[a.id] || 0) - (loadMap[b.id] || 0));
        return eligible[0]?.id || null;
      },

      autoAssignLowestLoad: () => {
        const { classes, subjects, assignments } = get().project;
        const selectedClasses = classes.filter((c) => c.selected);

        selectedClasses.forEach((cls) => {
          subjects.forEach((sub) => {
            const current = assignments.find((a) => a.classId === cls.id && a.subjectId === sub.id);
            if (current && (!current.teacherId || current.teacherId === '')) {
              const suggested = get().suggestTeacherForAssignment(cls.id, sub.id);
              if (suggested) {
                get().setAssignment(cls.id, sub.id, suggested, current.periodsPerWeek);
              }
            }
          });
        });
      },

      updateRules: (ruleUpdates) => {
        set((state) => ({
          project: {
            ...state.project,
            rules: {
              ...state.project.rules,
              ...ruleUpdates,
              hardRules: {
                ...state.project.rules.hardRules,
                ...(ruleUpdates.hardRules || {}),
              },
              softWeights: {
                ...state.project.rules.softWeights,
                ...(ruleUpdates.softWeights || {}),
              },
            },
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      setTimetableVersion: (version) => {
        set((state) => ({
          project: {
            ...state.project,
            timetables: [version, ...state.project.timetables.slice(0, 9)], // keep top 10 versions
            currentVersionId: version.id,
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      moveOrSwapSlot: (source, target) => {
        const { project, undoStack } = get();
        const activeVersion = project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
        if (!activeVersion) return;

        // Push current slots to undo stack
        const currentSlots = [...activeVersion.slots];
        const nextUndo = [currentSlots, ...undoStack.slice(0, 20)];

        const srcSlot = currentSlots.find(
          (s) => s.classId === source.classId && s.day === source.day && s.period === source.period
        );
        const tgtSlot = currentSlots.find(
          (s) => s.classId === target.classId && s.day === target.day && s.period === target.period
        );

        if (!srcSlot || srcSlot.locked) return; // cannot move locked slot
        if (tgtSlot && tgtSlot.locked) return; // cannot swap into locked slot

        const updatedSlots = currentSlots.map((s) => {
          if (s.classId === source.classId && s.day === source.day && s.period === source.period) {
            return {
              ...s,
              subjectId: tgtSlot ? tgtSlot.subjectId : null,
              teacherId: tgtSlot ? tgtSlot.teacherId : null,
            };
          }
          if (s.classId === target.classId && s.day === target.day && s.period === target.period) {
            return {
              ...s,
              subjectId: srcSlot.subjectId,
              teacherId: srcSlot.teacherId,
            };
          }
          return s;
        });

        // If target slot did not exist in slots array, add it
        if (!tgtSlot) {
          updatedSlots.push({
            classId: target.classId,
            day: target.day,
            period: target.period,
            subjectId: srcSlot.subjectId,
            teacherId: srcSlot.teacherId,
            locked: false,
          });
        }

        const updatedVersion: TimetableVersion = {
          ...activeVersion,
          slots: updatedSlots,
        };

        set((state) => ({
          project: {
            ...state.project,
            timetables: state.project.timetables.map((t) => (t.id === updatedVersion.id ? updatedVersion : t)),
            updatedAt: Date.now(),
          },
          undoStack: nextUndo,
          redoStack: [],
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      toggleLockSlot: (classId, day, period) => {
        const { project } = get();
        const activeVersion = project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
        if (!activeVersion) return;

        const updatedSlots = activeVersion.slots.map((s) => {
          if (s.classId === classId && s.day === day && s.period === period) {
            return { ...s, locked: !s.locked };
          }
          return s;
        });

        const updatedVersion = { ...activeVersion, slots: updatedSlots };

        set((state) => ({
          project: {
            ...state.project,
            timetables: state.project.timetables.map((t) => (t.id === updatedVersion.id ? updatedVersion : t)),
            updatedAt: Date.now(),
          },
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      undo: () => {
        const { undoStack, redoStack, project } = get();
        if (undoStack.length === 0) return;

        const activeVersion = project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
        if (!activeVersion) return;

        const previousSlots = undoStack[0];
        const nextUndo = undoStack.slice(1);
        const nextRedo = [activeVersion.slots, ...redoStack];

        const updatedVersion = { ...activeVersion, slots: previousSlots };

        set((state) => ({
          project: {
            ...state.project,
            timetables: state.project.timetables.map((t) => (t.id === updatedVersion.id ? updatedVersion : t)),
            updatedAt: Date.now(),
          },
          undoStack: nextUndo,
          redoStack: nextRedo,
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      redo: () => {
        const { undoStack, redoStack, project } = get();
        if (redoStack.length === 0) return;

        const activeVersion = project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
        if (!activeVersion) return;

        const nextSlots = redoStack[0];
        const nextRedo = redoStack.slice(1);
        const nextUndo = [activeVersion.slots, ...undoStack];

        const updatedVersion = { ...activeVersion, slots: nextSlots };

        set((state) => ({
          project: {
            ...state.project,
            timetables: state.project.timetables.map((t) => (t.id === updatedVersion.id ? updatedVersion : t)),
            updatedAt: Date.now(),
          },
          undoStack: nextUndo,
          redoStack: nextRedo,
          isDirty: true,
        }));
        get().persistToDatabase();
      },

      loadDemoSchool: () => {
        const demo = getDemoSchoolProject();
        set({
          project: demo,
          selectedClassId: demo.classes[0]?.id || null,
          selectedTeacherId: demo.teachers[0]?.id || null,
          undoStack: [],
          redoStack: [],
          isDirty: false,
          lastSavedAt: Date.now(),
        });
        saveProjectToDB(demo);
        get().addToast('Loaded Demo School (8 Classes, 12 Faculty, 10 Rooms)', 'success');
      },

      resetProject: () => {
        const empty: Project = {
          id: `prj-${Date.now()}`,
          school: {
            name: 'New School',
            year: '2026–2027',
            days: [1, 2, 3, 4, 5],
            periodsByDay: { 1: 8, 2: 8, 3: 8, 4: 8, 5: 8 },
            periodTimes: [],
            breaks: [],
          },
          classes: [],
          subjects: [],
          teachers: [],
          rooms: [],
          assignments: [],
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
            softWeights: {
              spreadSubjectEvenly: 80,
              heavySubjectsMorning: 70,
              minimizeTeacherGaps: 60,
              limitConsecutiveTeacher: 70,
              consistentSubjectPeriod: 50,
              avoidEdgePeriodsTeacher: 40,
              sportsActivityLastPeriods: 80,
            },
            allowFreePeriods: false,
            maxFreePeriodsPerClass: 0,
          },
          timetables: [],
          updatedAt: Date.now(),
        };
        set({
          project: empty,
          selectedClassId: null,
          selectedTeacherId: null,
          undoStack: [],
          redoStack: [],
          isDirty: false,
          lastSavedAt: Date.now(),
        });
        saveProjectToDB(empty);
        get().addToast('Project reset to blank state.', 'info');
      },

      loadProject: (project) => {
        const withRooms = {
          ...project,
          rooms: project.rooms || [],
        };
        set({
          project: withRooms,
          selectedClassId: withRooms.classes[0]?.id || null,
          selectedTeacherId: withRooms.teachers[0]?.id || null,
          undoStack: [],
          redoStack: [],
          isDirty: false,
          lastSavedAt: Date.now(),
        });
        saveProjectToDB(withRooms);
        get().addToast(`Restored project: ${withRooms.school.name}`, 'success');
      },

      persistToDatabase: async () => {
        const { project } = get();
        await saveProjectToDB(project);
        set({ isDirty: false, lastSavedAt: Date.now() });
      },
    }),
    {
      name: 'chronoforge-active-project',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
