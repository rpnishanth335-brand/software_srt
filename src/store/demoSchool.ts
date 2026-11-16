import { Project, School, ClassRoom, Subject, Teacher, Room, Assignment, RuleConfig } from '../types';

export function getDemoSchoolProject(): Project {
  const school: School = {
    name: 'St. Jude International Academy',
    year: '2026–2027',
    days: [1, 2, 3, 4, 5, 6], // Mon-Sat
    periodsByDay: {
      1: 8,
      2: 8,
      3: 8,
      4: 8,
      5: 8,
      6: 4, // Saturday half-day
    },
    breaks: [
      { id: 'break-1', name: 'Recess', afterPeriod: 2, durationMinutes: 15 },
      { id: 'break-2', name: 'Lunch Break', afterPeriod: 4, durationMinutes: 40 },
    ],
    periodTimes: [
      { period: 1, startTime: '08:30', endTime: '09:15', durationMinutes: 45 },
      { period: 2, startTime: '09:15', endTime: '10:00', durationMinutes: 45 },
      // Recess 10:00 - 10:15
      { period: 3, startTime: '10:15', endTime: '11:00', durationMinutes: 45 },
      { period: 4, startTime: '11:00', endTime: '11:45', durationMinutes: 45 },
      // Lunch 11:45 - 12:25
      { period: 5, startTime: '12:25', endTime: '13:10', durationMinutes: 45 },
      { period: 6, startTime: '13:10', endTime: '13:55', durationMinutes: 45 },
      { period: 7, startTime: '13:55', endTime: '14:40', durationMinutes: 45 },
      { period: 8, startTime: '14:40', endTime: '15:25', durationMinutes: 45 },
    ],
  };

  const rooms: Room[] = [
    { id: 'room-201', name: 'Room 201', number: '201', type: 'classroom', capacity: 35, building: 'Main Wing' },
    { id: 'room-202', name: 'Room 202', number: '202', type: 'classroom', capacity: 35, building: 'Main Wing' },
    { id: 'room-301', name: 'Room 301', number: '301', type: 'classroom', capacity: 35, building: 'Science Wing' },
    { id: 'room-302', name: 'Room 302', number: '302', type: 'classroom', capacity: 35, building: 'Science Wing' },
    { id: 'room-401', name: 'Room 401', number: '401', type: 'classroom', capacity: 35, building: 'Senior Wing' },
    { id: 'room-402', name: 'Room 402', number: '402', type: 'classroom', capacity: 35, building: 'Senior Wing' },
    { id: 'room-phylab', name: 'Physics Laboratory', number: 'L-101', type: 'lab', capacity: 30, building: 'Science Block' },
    { id: 'room-chemlab', name: 'Chemistry Laboratory', number: 'L-102', type: 'lab', capacity: 30, building: 'Science Block' },
    { id: 'room-cslab', name: 'Computer Lab Alpha', number: 'CL-01', type: 'lab', capacity: 40, building: 'Tech Hub' },
    { id: 'room-ground', name: 'Main Sports Arena', number: 'G-01', type: 'sports', capacity: 120, building: 'Outdoor' },
  ];

  const classes: ClassRoom[] = [
    { id: 'cls-8a', name: 'Grade 8', section: 'A', selected: true, room: 'Room 201', roomLabel: 'Room 201', roomId: 'room-201', strength: 32, status: 'complete' },
    { id: 'cls-8b', name: 'Grade 8', section: 'B', selected: true, room: 'Room 202', roomLabel: 'Room 202', roomId: 'room-202', strength: 30, status: 'complete' },
    { id: 'cls-9a', name: 'Grade 9', section: 'A', selected: true, room: 'Room 301', roomLabel: 'Room 301', roomId: 'room-301', strength: 34, status: 'complete' },
    { id: 'cls-9b', name: 'Grade 9', section: 'B', selected: true, room: 'Room 302', roomLabel: 'Room 302', roomId: 'room-302', strength: 33, status: 'complete' },
    { id: 'cls-10a', name: 'Grade 10', section: 'A', selected: true, room: 'Room 401', roomLabel: 'Room 401', roomId: 'room-401', strength: 35, status: 'complete' },
    { id: 'cls-10b', name: 'Grade 10', section: 'B', selected: true, room: 'Room 402', roomLabel: 'Room 402', roomId: 'room-402', strength: 31, status: 'complete' },
    { id: 'cls-11a', name: 'Grade 11', section: 'A', selected: true, room: 'Room 201', roomLabel: 'Room 201', roomId: 'room-201', strength: 28, status: 'complete' },
    { id: 'cls-12a', name: 'Grade 12', section: 'A', selected: true, room: 'Room 202', roomLabel: 'Room 202', roomId: 'room-202', strength: 29, status: 'complete' },
  ];

  const subjects: Subject[] = [
    { id: 'sub-math', name: 'Mathematics', code: 'MATH', color: '#f97316', type: 'theory', defaultPeriodsPerWeek: 6, doublePeriod: false, maxPerDay: 2, preferMorning: true },
    { id: 'sub-phy', name: 'Physics', code: 'PHY', color: '#a855f7', type: 'theory', defaultPeriodsPerWeek: 4, doublePeriod: false, maxPerDay: 2, preferMorning: true },
    { id: 'sub-phylab', name: 'Physics Lab', code: 'PHY-LAB', color: '#7c3aed', type: 'lab', defaultPeriodsPerWeek: 2, doublePeriod: true, maxPerDay: 2, preferMorning: false },
    { id: 'sub-chem', name: 'Chemistry', code: 'CHEM', color: '#06b6d4', type: 'theory', defaultPeriodsPerWeek: 4, doublePeriod: false, maxPerDay: 2, preferMorning: true },
    { id: 'sub-chemlab', name: 'Chemistry Lab', code: 'CHEM-LAB', color: '#0891b2', type: 'lab', defaultPeriodsPerWeek: 2, doublePeriod: true, maxPerDay: 2, preferMorning: false },
    { id: 'sub-eng', name: 'English Literature', code: 'ENG', color: '#10b981', type: 'theory', defaultPeriodsPerWeek: 5, doublePeriod: false, maxPerDay: 2, preferMorning: false },
    { id: 'sub-bio', name: 'Biology & Environmental', code: 'BIO', color: '#84cc16', type: 'theory', defaultPeriodsPerWeek: 4, doublePeriod: false, maxPerDay: 2, preferMorning: true },
    { id: 'sub-cs', name: 'Computer Science', code: 'CS', color: '#6366f1', type: 'lab', defaultPeriodsPerWeek: 4, doublePeriod: true, maxPerDay: 2, preferMorning: false },
    { id: 'sub-hist', name: 'History & Civics', code: 'HIST', color: '#eab308', type: 'theory', defaultPeriodsPerWeek: 4, doublePeriod: false, maxPerDay: 1, preferMorning: false },
    { id: 'sub-pe', name: 'Physical Education', code: 'PE', color: '#ef4444', type: 'sports', defaultPeriodsPerWeek: 5, doublePeriod: false, maxPerDay: 1, preferMorning: false },
    { id: 'sub-art', name: 'Creative Arts & Music', code: 'ART', color: '#ec4899', type: 'activity', defaultPeriodsPerWeek: 4, doublePeriod: false, maxPerDay: 1, preferMorning: false },
  ];

  const teachers: Teacher[] = [
    { id: 'tch-1', name: 'Dr. Evelyn Reed', code: 'ER', subjectIds: ['sub-math'], classIds: ['cls-8a', 'cls-8b', 'cls-9a', 'cls-9b'], maxPerDay: 6, maxPerWeek: 28, maxConsecutive: 3, blocked: [{ day: 6, period: 4 }] },
    { id: 'tch-2', name: 'Prof. Alistair Vance', code: 'AV', subjectIds: ['sub-math'], classIds: ['cls-10a', 'cls-10b', 'cls-11a', 'cls-12a'], maxPerDay: 6, maxPerWeek: 28, maxConsecutive: 3, blocked: [{ day: 1, period: 1 }] },
    { id: 'tch-3', name: 'Dr. Clara Higgins', code: 'CH', subjectIds: ['sub-phy', 'sub-phylab'], classIds: ['cls-8a', 'cls-8b', 'cls-9a', 'cls-9b'], maxPerDay: 6, maxPerWeek: 28, maxConsecutive: 3, blocked: [] },
    { id: 'tch-4', name: 'Dr. Nathan Drake', code: 'ND', subjectIds: ['sub-phy', 'sub-phylab'], classIds: ['cls-10a', 'cls-10b', 'cls-11a', 'cls-12a'], maxPerDay: 6, maxPerWeek: 28, maxConsecutive: 3, blocked: [{ day: 3, period: 8 }] },
    { id: 'tch-5', name: 'Mrs. Siobhan Roy', code: 'SR', subjectIds: ['sub-chem', 'sub-chemlab'], classIds: ['cls-8a', 'cls-8b', 'cls-9a', 'cls-9b'], maxPerDay: 6, maxPerWeek: 28, maxConsecutive: 3, blocked: [] },
    { id: 'tch-6', name: 'Mr. Julian Croft', code: 'JC', subjectIds: ['sub-chem', 'sub-chemlab'], classIds: ['cls-10a', 'cls-10b', 'cls-11a', 'cls-12a'], maxPerDay: 6, maxPerWeek: 28, maxConsecutive: 3, blocked: [{ day: 5, period: 7 }, { day: 5, period: 8 }] },
    { id: 'tch-7', name: 'Ms. Rachel Green', code: 'RG', subjectIds: ['sub-eng', 'sub-art'], classIds: ['cls-8a', 'cls-8b', 'cls-9a', 'cls-9b'], maxPerDay: 7, maxPerWeek: 38, maxConsecutive: 3, blocked: [] },
    { id: 'tch-8', name: 'Mr. David Copper', code: 'DC', subjectIds: ['sub-eng', 'sub-art'], classIds: ['cls-10a', 'cls-10b', 'cls-11a', 'cls-12a'], maxPerDay: 7, maxPerWeek: 38, maxConsecutive: 3, blocked: [] },
    { id: 'tch-9', name: 'Dr. Maya Lin', code: 'ML', subjectIds: ['sub-bio'], classIds: ['cls-8a', 'cls-8b', 'cls-9a', 'cls-9b', 'cls-10a', 'cls-10b', 'cls-11a', 'cls-12a'], maxPerDay: 7, maxPerWeek: 35, maxConsecutive: 3, blocked: [] },
    { id: 'tch-10', name: 'Mr. Alan Turing', code: 'AT', subjectIds: ['sub-cs'], classIds: ['cls-8a', 'cls-8b', 'cls-9a', 'cls-9b', 'cls-10a', 'cls-10b', 'cls-11a', 'cls-12a'], maxPerDay: 7, maxPerWeek: 35, maxConsecutive: 3, blocked: [] },
    { id: 'tch-11', name: 'Ms. Helena Troy', code: 'HT', subjectIds: ['sub-hist'], classIds: ['cls-8a', 'cls-8b', 'cls-9a', 'cls-9b', 'cls-10a', 'cls-10b', 'cls-11a', 'cls-12a'], maxPerDay: 7, maxPerWeek: 35, maxConsecutive: 3, blocked: [] },
    { id: 'tch-12', name: 'Coach Marcus Bell', code: 'MB', subjectIds: ['sub-pe'], classIds: ['cls-8a', 'cls-8b', 'cls-9a', 'cls-9b', 'cls-10a', 'cls-10b', 'cls-11a', 'cls-12a'], maxPerDay: 8, maxPerWeek: 42, maxConsecutive: 3, blocked: [{ day: 6, period: 4 }] },
  ];

  // Each class has 44 available slots (5 * 8 + 4 = 44)
  // Curriculum weekly allocation:
  // Math: 6, English: 5, Phy: 4, PhyLab: 2, Chem: 4, ChemLab: 2, Bio: 4, CS: 4, Hist: 4, PE: 5, Art: 4 = 44
  const assignments: Assignment[] = [];

  classes.forEach((c) => {
    const isJunior = c.id.startsWith('cls-8') || c.id.startsWith('cls-9');
    const mathTch = isJunior ? 'tch-1' : 'tch-2';
    const phyTch = isJunior ? 'tch-3' : 'tch-4';
    const chemTch = isJunior ? 'tch-5' : 'tch-6';
    const engTch = isJunior ? 'tch-7' : 'tch-8';
    const artTch = isJunior ? 'tch-7' : 'tch-8';

    assignments.push(
      { classId: c.id, subjectId: 'sub-math', teacherId: mathTch, periodsPerWeek: 6 },
      { classId: c.id, subjectId: 'sub-eng', teacherId: engTch, periodsPerWeek: 5 },
      { classId: c.id, subjectId: 'sub-phy', teacherId: phyTch, periodsPerWeek: 4 },
      { classId: c.id, subjectId: 'sub-phylab', teacherId: phyTch, periodsPerWeek: 2 },
      { classId: c.id, subjectId: 'sub-chem', teacherId: chemTch, periodsPerWeek: 4 },
      { classId: c.id, subjectId: 'sub-chemlab', teacherId: chemTch, periodsPerWeek: 2 },
      { classId: c.id, subjectId: 'sub-bio', teacherId: 'tch-9', periodsPerWeek: 4 },
      { classId: c.id, subjectId: 'sub-cs', teacherId: 'tch-10', periodsPerWeek: 4 },
      { classId: c.id, subjectId: 'sub-hist', teacherId: 'tch-11', periodsPerWeek: 4 },
      { classId: c.id, subjectId: 'sub-pe', teacherId: 'tch-12', periodsPerWeek: 5 },
      { classId: c.id, subjectId: 'sub-art', teacherId: artTch, periodsPerWeek: 4 },
    );
  });

  const rules: RuleConfig = {
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
      spreadSubjectEvenly: 85,
      heavySubjectsMorning: 75,
      minimizeTeacherGaps: 70,
      limitConsecutiveTeacher: 80,
      consistentSubjectPeriod: 50,
      avoidEdgePeriodsTeacher: 40,
      sportsActivityLastPeriods: 90,
    },
    allowFreePeriods: false,
    maxFreePeriodsPerClass: 0,
  };

  return {
    id: 'demo-school-project',
    school,
    classes,
    subjects,
    teachers,
    rooms,
    assignments,
    rules,
    timetables: [],
    updatedAt: Date.now(),
  };
}
