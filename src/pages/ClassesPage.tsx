import React, { useState, useMemo } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { ReferentialWarningModal } from '../components/ReferentialWarningModal';
import { Modal } from '../components/ui/Modal';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Copy, 
  Edit2, 
  Wand2, 
  Search, 
  HelpCircle,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Split
} from 'lucide-react';
import { ClassRoom, ID } from '../types';

interface SubjectAssignmentState {
  subjectId: ID;
  selected: boolean;
  periodsPerWeek: number;
  staffId: ID;
  splitStaff: boolean;
  staffId2?: ID;
  periods1?: number;
  periods2?: number;
}

export const ClassesPage: React.FC = () => {
  const { 
    project, 
    deleteClass, 
    bulkDeleteClasses, 
    toggleSelectClass, 
    quickGenerateClasses,
    saveClassWithAssignments,
    copyClassSetup,
    addTeacher,
    checkEntityDependencies,
    setCurrentRoute,
    addToast
  } = useTimetableStore();

  const { classes, teachers, subjects, school, assignments } = project;

  const activeDays = school.days || [1, 2, 3, 4, 5];
  const periodsByDay = school.periodsByDay || {};
  const totalSchoolSlots = activeDays.reduce((sum, d) => sum + (periodsByDay[d] || 8), 0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete' | 'overfilled'>('all');

  // Bulk Selection
  const [selectedClassIds, setSelectedClassIds] = useState<ID[]>([]);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState<ClassRoom | null>(null);
  const [deleteDependencyInfo, setDeleteDependencyInfo] = useState<{ count: number; details: string[] }>({ count: 0, details: [] });

  // Bulk Generator State
  const [showQuickGen, setShowQuickGen] = useState(false);
  const [startGrade, setStartGrade] = useState(6);
  const [endGrade, setEndGrade] = useState(10);
  const [sectionsInput, setSectionsInput] = useState('A, B');

  // Copy Setup Modal State
  const [copySourceClass, setCopySourceClass] = useState<ClassRoom | null>(null);
  const [copyTargetIds, setCopyTargetIds] = useState<ID[]>([]);

  // =========================================================================
  // CLASS SETUP WIZARD STATE (Q1 -> Q2 -> Q3 -> Q4)
  // =========================================================================
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardClassId, setWizardClassId] = useState<ID | null>(null);

  // Q1: Class Details
  const [q1Name, setQ1Name] = useState('');
  const [q1Section, setQ1Section] = useState('A');
  const [q1Strength, setQ1Strength] = useState<number>(35);
  const [q1RoomLabel, setQ1RoomLabel] = useState('');
  const [q1Include, setQ1Include] = useState(true);
  const [q1Error, setQ1Error] = useState<string | null>(null);

  // Q2 & Q3: Subjects & Staff Assignments
  const [wizardSubjects, setWizardSubjects] = useState<SubjectAssignmentState[]>([]);

  // Quick Staff Creation Modal (when no staff handles subject)
  const [quickStaffSubjectId, setQuickStaffSubjectId] = useState<ID | null>(null);
  const [quickStaffName, setQuickStaffName] = useState('');
  const [quickStaffCode, setQuickStaffCode] = useState('');
  const [quickStaffMaxWeek, setQuickStaffMaxWeek] = useState(28);
  const [quickStaffError, setQuickStaffError] = useState<string | null>(null);

  // Live workload calculation for staff
  const staffWorkloadMap = useMemo(() => {
    const map = new Map<ID, number>();
    assignments.forEach((a) => {
      // Exclude current class if editing
      if (wizardClassId && a.classId === wizardClassId) return;
      if (a.teacherId) {
        const cur = map.get(a.teacherId) || 0;
        map.set(a.teacherId, cur + a.periodsPerWeek);
      }
    });
    return map;
  }, [assignments, wizardClassId]);

  // Total selected periods in wizard
  const wizardSelectedPeriods = useMemo(() => {
    return wizardSubjects
      .filter((s) => s.selected)
      .reduce((sum, s) => sum + (s.periodsPerWeek || 0), 0);
  }, [wizardSubjects]);

  // Open Wizard (New or Edit)
  const openWizard = (cls?: ClassRoom) => {
    if (cls) {
      setWizardClassId(cls.id);
      setQ1Name(cls.name);
      setQ1Section(cls.section);
      setQ1Strength(cls.strength || 35);
      setQ1RoomLabel(cls.roomLabel || cls.room || '');
      setQ1Include(cls.selected);

      // Pre-fill subjects from assignments
      const classAssignments = assignments.filter((a) => a.classId === cls.id);
      const subState: SubjectAssignmentState[] = subjects.map((sub) => {
        const assigned = classAssignments.filter((a) => a.subjectId === sub.id);
        const isSelected = assigned.length > 0;
        const totalPeriods = isSelected ? assigned.reduce((sum, a) => sum + a.periodsPerWeek, 0) : (sub.defaultPeriodsPerWeek || 5);
        const primary = assigned[0];
        const secondary = assigned[1];

        return {
          subjectId: sub.id,
          selected: isSelected,
          periodsPerWeek: totalPeriods,
          staffId: primary?.teacherId || '',
          splitStaff: assigned.length > 1,
          staffId2: secondary?.teacherId || '',
          periods1: primary?.periodsPerWeek || Math.ceil(totalPeriods / 2),
          periods2: secondary?.periodsPerWeek || Math.floor(totalPeriods / 2),
        };
      });
      setWizardSubjects(subState);
    } else {
      // New Class
      setWizardClassId(null);
      setQ1Name('');
      setQ1Section('A');
      setQ1Strength(35);
      setQ1RoomLabel('');
      setQ1Include(true);

      const subState: SubjectAssignmentState[] = subjects.map((sub) => ({
        subjectId: sub.id,
        selected: true, // by default include subjects
        periodsPerWeek: sub.defaultPeriodsPerWeek || 5,
        staffId: '',
        splitStaff: false,
      }));
      setWizardSubjects(subState);
    }

    setQ1Error(null);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  // Step 1 Validation
  const handleValidateStep1 = () => {
    if (!q1Name.trim()) {
      setQ1Error('Class name is required (e.g. "Grade 8" or "8")');
      return;
    }
    if (!q1Section.trim()) {
      setQ1Error('Section is required (e.g. "A")');
      return;
    }

    const normName = q1Name.trim().toLowerCase();
    const normSec = q1Section.trim().toUpperCase();
    const isDup = classes.some(
      (c) => c.id !== wizardClassId && c.name.toLowerCase() === normName && c.section.toUpperCase() === normSec
    );
    if (isDup) {
      setQ1Error(`A class named "${q1Name.trim()} – ${normSec}" already exists.`);
      return;
    }

    setQ1Error(null);
    setWizardStep(2);
  };

  // Auto-assign staff with lowest load
  const handleAutoAssignLowestLoad = () => {
    setWizardSubjects((prev) =>
      prev.map((row) => {
        if (!row.selected) return row;
        const qualified = teachers.filter((t) => t.subjectIds.includes(row.subjectId));
        if (qualified.length === 0) return row;

        // Sort by current workload
        qualified.sort((a, b) => {
          const loadA = staffWorkloadMap.get(a.id) || 0;
          const loadB = staffWorkloadMap.get(b.id) || 0;
          return loadA - loadB;
        });

        return { ...row, staffId: qualified[0].id };
      })
    );
    addToast('Assigned staff with lowest workload for selected subjects.', 'info');
  };

  // Copy staff from previous class
  const handleCopyStaffFromPreviousClass = () => {
    const otherClasses = classes.filter((c) => c.id !== wizardClassId);
    if (otherClasses.length === 0) {
      addToast('No other classes exist to copy staff from.', 'warning');
      return;
    }
    const prevClass = otherClasses[otherClasses.length - 1];
    const prevAssignments = assignments.filter((a) => a.classId === prevClass.id);

    setWizardSubjects((prev) =>
      prev.map((row) => {
        if (!row.selected) return row;
        const match = prevAssignments.find((a) => a.subjectId === row.subjectId);
        if (match && match.teacherId) {
          // Check if teacher is qualified
          const teacher = teachers.find((t) => t.id === match.teacherId);
          if (teacher && teacher.subjectIds.includes(row.subjectId)) {
            return { ...row, staffId: match.teacherId };
          }
        }
        return row;
      })
    );
    addToast(`Copied staff allocations from ${prevClass.name} – ${prevClass.section}!`, 'success');
  };

  // Quick Staff Creation
  const handleCreateQuickStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStaffSubjectId) return;
    if (!quickStaffName.trim() || !quickStaffCode.trim()) {
      setQuickStaffError('Name and code are required.');
      return;
    }

    const normCode = quickStaffCode.trim().toUpperCase();
    if (teachers.some((t) => t.code.toUpperCase() === normCode)) {
      setQuickStaffError(`Code "${normCode}" is already in use.`);
      return;
    }

    const newTeacherId = `tch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    addTeacher({
      name: quickStaffName.trim(),
      code: normCode,
      subjectIds: [quickStaffSubjectId],
      classIds: [],
      maxPerDay: 6,
      maxPerWeek: quickStaffMaxWeek || 28,
      maxConsecutive: 3,
      blocked: [],
    });

    // Auto-select in current wizard row
    setWizardSubjects((prev) =>
      prev.map((row) => (row.subjectId === quickStaffSubjectId ? { ...row, staffId: newTeacherId } : row))
    );

    setQuickStaffSubjectId(null);
    setQuickStaffName('');
    setQuickStaffCode('');
    setQuickStaffError(null);
    addToast(`Registered faculty ${normCode} and selected for subject!`, 'success');
  };

  // Save Wizard Commit
  const handleSaveWizard = () => {
    const selectedRows = wizardSubjects.filter((s) => s.selected);
    if (selectedRows.length === 0) {
      addToast('Please select at least one subject for this class.', 'warning');
      setWizardStep(2);
      return;
    }

    const unassignedSubject = selectedRows.find((s) => !s.staffId);
    if (unassignedSubject) {
      const subObj = subjects.find((s) => s.id === unassignedSubject.subjectId);
      addToast(`Please assign a teacher for ${subObj?.name || 'every selected subject'}.`, 'warning');
      setWizardStep(3);
      return;
    }

    // Build assignment list
    const assignmentsList: Array<{ subjectId: ID; staffId: ID; periodsPerWeek: number }> = [];
    selectedRows.forEach((r) => {
      if (r.splitStaff && r.staffId2 && r.periods1 && r.periods2) {
        assignmentsList.push({
          subjectId: r.subjectId,
          staffId: r.staffId,
          periodsPerWeek: r.periods1,
        });
        assignmentsList.push({
          subjectId: r.subjectId,
          staffId: r.staffId2,
          periodsPerWeek: r.periods2,
        });
      } else {
        assignmentsList.push({
          subjectId: r.subjectId,
          staffId: r.staffId,
          periodsPerWeek: r.periodsPerWeek,
        });
      }
    });

    saveClassWithAssignments(
      {
        id: wizardClassId || undefined,
        name: q1Name.trim(),
        section: q1Section.trim().toUpperCase(),
        strength: q1Strength || 35,
        roomLabel: q1RoomLabel.trim() || undefined,
        selected: q1Include,
      },
      assignmentsList
    );

    setIsWizardOpen(false);
  };

  // Filtered classes in main table
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesSearch =
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.roomLabel && cls.roomLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cls.room && cls.room.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status calculation
      const classAssignments = assignments.filter((a) => a.classId === cls.id);
      const totalPeriods = classAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
      let calculatedStatus: 'complete' | 'incomplete' | 'overfilled' = 'complete';
      if (totalPeriods > totalSchoolSlots) calculatedStatus = 'overfilled';
      else if (totalPeriods < totalSchoolSlots || classAssignments.some((a) => !a.teacherId)) calculatedStatus = 'incomplete';

      if (statusFilter !== 'all' && calculatedStatus !== statusFilter) return false;

      return true;
    });
  }, [classes, searchQuery, statusFilter, assignments, totalSchoolSlots]);

  // Delete Prompt
  const promptDelete = (cls: ClassRoom) => {
    const deps = checkEntityDependencies('class', cls.id);
    setDeleteTarget(cls);
    setDeleteDependencyInfo({
      count: deps.affectedAssignments + deps.affectedSlots,
      details: deps.details,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteClass(deleteTarget.id, true);
      setDeleteTarget(null);
    }
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedClassIds.length === 0) return;
    bulkDeleteClasses(selectedClassIds);
    setSelectedClassIds([]);
  };

  // Copy Setup Handler
  const handleExecuteCopySetup = () => {
    if (!copySourceClass || copyTargetIds.length === 0) return;
    copyClassSetup(copySourceClass.id, copyTargetIds);
    setCopySourceClass(null);
    setCopyTargetIds([]);
  };

  // Quick Generate Classes
  const handleQuickGenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const sections = sectionsInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (sections.length === 0) {
      addToast('Please enter at least one section letter (e.g. A, B)', 'error');
      return;
    }
    quickGenerateClasses(startGrade, endGrade, sections);
    setShowQuickGen(false);
  };

  // =========================================================================
  // STEP 2 PREREQUISITE BLOCKING CHECK: Zero Staff
  // =========================================================================
  if (teachers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 animate-fadeIn">
        <PlasmaGlass glow className="p-8 sm:p-10 text-center space-y-5 border-amber-500/40">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 mx-auto shadow-ember-glow">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Add Teaching Staff First (Step 2)</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              Each class cohort requires teaching staff to be assigned to its curriculum subjects. Please configure your teaching faculty in Staff before setting up classes.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <MoltenButton
              variant="molten"
              size="md"
              onClick={() => {
                sessionStorage.setItem('chronoforge_return_route', 'classes');
                setCurrentRoute('staff');
              }}
              leftIcon={<Users className="w-4 h-4" />}
            >
              Go to Step 2: Faculty &amp; Staff
            </MoltenButton>
          </div>
        </PlasmaGlass>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Classes &amp; Student Cohorts
            </h1>
            <p className="text-xs text-slate-400">
              {classes.length} cohorts • {totalSchoolSlots} periods/week available ({activeDays.length} days × {school.periodsPerDay || 8} periods)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => openWizard()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Class Wizard
          </MoltenButton>

          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => setShowQuickGen(true)}
            leftIcon={<Wand2 className="w-3.5 h-3.5 text-amber-300" />}
          >
            Bulk Generate Cohorts
          </MoltenButton>
        </div>
      </div>

      {/* Guided Setup Hint */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs">
        <HelpCircle className="w-4 h-4 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">How class setup works:</span> Clicking &quot;Create Class Wizard&quot; or clicking any class opens a 4-step wizard that asks the essential questions: class details, curriculum subjects, and teacher assignment per subject. Only classes with <strong>Complete</strong> status (all periods filled and assigned) can be generated.
        </div>
      </div>

      {/* Controls: Search, Status Filter & Bulk Selection */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {(['all', 'complete', 'incomplete', 'overfilled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-amber-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {selectedClassIds.length > 0 && (
            <MoltenButton
              size="sm"
              variant="ghost"
              onClick={handleBulkDelete}
              className="text-red-400 hover:bg-red-500/10"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Selected ({selectedClassIds.length})
            </MoltenButton>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search class, section, room..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Classes Table */}
      {filteredClasses.length === 0 ? (
        <PlasmaGlass className="p-12 text-center space-y-4">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No classes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms.'
              : 'Launch the Class Setup Wizard to register your first cohort and configure its curriculum.'}
          </p>
          <MoltenButton size="sm" variant="molten" onClick={() => openWizard()} leftIcon={<Plus className="w-4 h-4" />}>
            Create Class Wizard
          </MoltenButton>
        </PlasmaGlass>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const classAssignments = assignments.filter((a) => a.classId === cls.id);
            const totalPeriods = classAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
            const isBatchSelected = selectedClassIds.includes(cls.id);

            let status: 'complete' | 'incomplete' | 'overfilled' = 'complete';
            if (totalPeriods > totalSchoolSlots) status = 'overfilled';
            else if (totalPeriods < totalSchoolSlots || classAssignments.some((a) => !a.teacherId)) status = 'incomplete';

            const isComplete = status === 'complete';

            return (
              <PlasmaGlass
                key={cls.id}
                hoverEffect
                className={`p-4 transition-all border ${
                  isComplete ? 'border-emerald-500/30' : 'border-white/10'
                } bg-[#161224]/70 space-y-3`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isBatchSelected}
                      onChange={() => {
                        setSelectedClassIds((prev) =>
                          prev.includes(cls.id) ? prev.filter((x) => x !== cls.id) : [...prev, cls.id]
                        );
                      }}
                      className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        {cls.name} – {cls.section}
                        {cls.roomLabel && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono-code font-normal">
                            {cls.roomLabel}
                          </span>
                        )}
                      </h4>
                      <div className="text-[11px] text-slate-400 font-mono-code">
                        {cls.strength || 35} students • {classAssignments.length} subjects
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCopySourceClass(cls);
                        setCopyTargetIds([]);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
                      title="Copy setup to other classes"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openWizard(cls)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Edit Class Wizard"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promptDelete(cls)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                      title="Delete Class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Curriculum Load:</span>
                    <span className="font-mono-code font-bold text-white">
                      {totalPeriods} / {totalSchoolSlots} periods
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'complete'
                          ? 'bg-emerald-500'
                          : status === 'overfilled'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.round((totalPeriods / totalSchoolSlots) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    {status === 'complete' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </span>
                    ) : status === 'overfilled' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                        <AlertCircle className="w-3 h-3" /> Over Capacity (+{totalPeriods - totalSchoolSlots})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> Incomplete ({totalPeriods}/{totalSchoolSlots})
                      </span>
                    )}
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={cls.selected}
                      onChange={() => toggleSelectClass(cls.id)}
                      className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                    />
                    <span>Include</span>
                  </label>
                </div>

                {/* Click to open wizard button */}
                <button
                  onClick={() => openWizard(cls)}
                  className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Open Setup Wizard</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                </button>
              </PlasmaGlass>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* GUIDED CLASS SETUP WIZARD (MODAL PORTALED)                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        maxWidth="3xl"
        title={wizardClassId ? `Edit Class: ${q1Name} – ${q1Section}` : 'Class Setup Wizard'}
        subtitle={`Step ${wizardStep} of 4: ${
          wizardStep === 1
            ? 'Cohort Details'
            : wizardStep === 2
            ? 'Curriculum & Periods'
            : wizardStep === 3
            ? 'Teacher Assignment per Subject'
            : 'Review & Atomic Save'
        }`}
        icon={<GraduationCap className="w-5 h-5 text-amber-400" />}
      >
        <div className="space-y-6">
          {/* Stepper Header */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs border-b border-white/10 pb-3">
            {[
              { num: 1, title: 'Details' },
              { num: 2, title: 'Subjects' },
              { num: 3, title: 'Faculty' },
              { num: 4, title: 'Review' },
            ].map((s) => (
              <div
                key={s.num}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                  wizardStep === s.num
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : wizardStep > s.num
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                Step {s.num}: {s.title}
              </div>
            ))}
          </div>

          {/* ===================================================================== */}
          {/* QUESTION 1: Cohort Details                                            */}
          {/* ===================================================================== */}
          {wizardStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Q1. Enter Class Cohort Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Class Name *</label>
                  <input
                    type="text"
                    value={q1Name}
                    onChange={(e) => { setQ1Name(e.target.value); setQ1Error(null); }}
                    placeholder="e.g. Grade 8 or 8"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Section *</label>
                  <input
                    type="text"
                    value={q1Section}
                    onChange={(e) => { setQ1Section(e.target.value); setQ1Error(null); }}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm uppercase font-mono-code focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Class Strength (Students)</label>
                  <input
                    type="number"
                    min={1}
                    value={q1Strength}
                    onChange={(e) => setQ1Strength(parseInt(e.target.value, 10) || 35)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-code focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Room Label (Optional Text)</label>
                  <input
                    type="text"
                    value={q1RoomLabel}
                    onChange={(e) => setQ1RoomLabel(e.target.value)}
                    placeholder="e.g. Room 204"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400">
                    Cosmetic note printed on exports only. Never limits or conflicts generation.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={q1Include}
                    onChange={(e) => setQ1Include(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                  />
                  <span>Include this class in timetable generation</span>
                </label>
              </div>

              {q1Error && <p className="text-xs text-red-400 font-medium">{q1Error}</p>}

              <div className="flex justify-end pt-4 border-t border-white/10">
                <MoltenButton size="md" variant="molten" onClick={handleValidateStep1} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Next: Curriculum Subjects
                </MoltenButton>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* QUESTION 2: Which subjects does this class have?                      */}
          {/* ===================================================================== */}
          {wizardStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Q2. Which subjects does this class have?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select subjects and adjust periods/week to fill the school schedule.
                  </p>
                </div>

                {/* Live Capacity Gauge */}
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono-code font-bold flex items-center gap-2 ${
                  wizardSelectedPeriods === totalSchoolSlots
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : wizardSelectedPeriods > totalSchoolSlots
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  <span>Selected: {wizardSelectedPeriods} / {totalSchoolSlots} slots</span>
                  {wizardSelectedPeriods === totalSchoolSlots && <span>✓ Exact Match</span>}
                  {wizardSelectedPeriods < totalSchoolSlots && <span>(Add {totalSchoolSlots - wizardSelectedPeriods})</span>}
                  {wizardSelectedPeriods > totalSchoolSlots && <span>(Remove {wizardSelectedPeriods - totalSchoolSlots})</span>}
                </div>
              </div>

              {/* Subjects Selection List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {wizardSubjects.map((row) => {
                  const subObj = subjects.find((s) => s.id === row.subjectId);
                  if (!subObj) return null;

                  return (
                    <div
                      key={row.subjectId}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        row.selected
                          ? 'bg-white/5 border-amber-500/40'
                          : 'bg-black/20 border-white/5 opacity-60'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) => {
                            setWizardSubjects((prev) =>
                              prev.map((r) =>
                                r.subjectId === row.subjectId ? { ...r, selected: e.target.checked } : r
                              )
                            );
                          }}
                          className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                        />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subObj.color }} />
                        <div>
                          <div className="text-xs font-bold text-white">{subObj.name}</div>
                          <div className="text-[10px] text-amber-300 font-mono-code font-semibold">{subObj.code} • {subObj.type}</div>
                        </div>
                      </label>

                      {row.selected && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Periods/week:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setWizardSubjects((prev) =>
                                  prev.map((r) =>
                                    r.subjectId === row.subjectId
                                      ? { ...r, periodsPerWeek: Math.max(1, (r.periodsPerWeek || 1) - 1) }
                                      : r
                                  )
                                );
                              }}
                              className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={row.periodsPerWeek}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setWizardSubjects((prev) =>
                                  prev.map((r) =>
                                    r.subjectId === row.subjectId ? { ...r, periodsPerWeek: val } : r
                                  )
                                );
                              }}
                              className="w-12 px-2 py-0.5 rounded bg-black/40 border border-white/20 text-white text-center font-mono-code text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setWizardSubjects((prev) =>
                                  prev.map((r) =>
                                    r.subjectId === row.subjectId
                                      ? { ...r, periodsPerWeek: (r.periodsPerWeek || 1) + 1 }
                                      : r
                                  )
                                );
                              }}
                              className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <MoltenButton size="sm" variant="ghost" onClick={() => setWizardStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </MoltenButton>
                <MoltenButton
                  size="md"
                  variant="molten"
                  disabled={wizardSelectedPeriods === 0}
                  onClick={() => setWizardStep(3)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Next: Assign Teachers
                </MoltenButton>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* QUESTION 3: Who teaches each subject?                                 */}
          {/* ===================================================================== */}
          {wizardStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Q3. Who teaches each subject?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dropdowns list only faculty qualified for each subject.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <MoltenButton size="sm" variant="glass" onClick={handleAutoAssignLowestLoad} leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}>
                    Auto-Assign Lowest Load
                  </MoltenButton>
                  <MoltenButton size="sm" variant="ghost" onClick={handleCopyStaffFromPreviousClass}>
                    Same as Previous Class
                  </MoltenButton>
                </div>
              </div>

              {/* Subject Staff Assignment List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {wizardSubjects
                  .filter((row) => row.selected)
                  .map((row) => {
                    const subObj = subjects.find((s) => s.id === row.subjectId);
                    if (!subObj) return null;

                    // Filter ONLY teachers who handle this subject!
                    const qualifiedStaff = teachers.filter((t) => t.subjectIds.includes(row.subjectId));

                    const assignedTeacher = teachers.find((t) => t.id === row.staffId);
                    const currentLoad = assignedTeacher ? (staffWorkloadMap.get(assignedTeacher.id) || 0) : 0;
                    const wouldExceed = assignedTeacher && (currentLoad + row.periodsPerWeek > assignedTeacher.maxPerWeek);

                    return (
                      <div
                        key={row.subjectId}
                        className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subObj.color }} />
                            <span className="text-xs font-bold text-white">{subObj.name}</span>
                            <span className="text-[10px] text-amber-300 font-mono-code font-bold">
                              ({row.periodsPerWeek} periods/wk)
                            </span>
                          </div>

                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400 hover:text-white">
                            <input
                              type="checkbox"
                              checked={row.splitStaff}
                              onChange={(e) => {
                                setWizardSubjects((prev) =>
                                  prev.map((r) =>
                                    r.subjectId === row.subjectId
                                      ? {
                                          ...r,
                                          splitStaff: e.target.checked,
                                          periods1: Math.ceil(row.periodsPerWeek / 2),
                                          periods2: Math.floor(row.periodsPerWeek / 2),
                                        }
                                      : r
                                  )
                                );
                              }}
                              className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                            />
                            <Split className="w-3 h-3 text-purple-400" />
                            <span>Split 2 Teachers</span>
                          </label>
                        </div>

                        {/* If NO qualified staff exist */}
                        {qualifiedStaff.length === 0 ? (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                            <span className="text-red-300">
                              ⚠️ No staff handles {subObj.name}.
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickStaffSubjectId(row.subjectId);
                                setQuickStaffName('');
                                setQuickStaffCode(subObj.code + 'T');
                                setQuickStaffError(null);
                              }}
                              className="px-2 py-1 rounded bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400"
                            >
                              + Create staff for this subject
                            </button>
                          </div>
                        ) : !row.splitStaff ? (
                          // Single Staff Dropdown
                          <div>
                            <select
                              value={row.staffId}
                              onChange={(e) => {
                                setWizardSubjects((prev) =>
                                  prev.map((r) =>
                                    r.subjectId === row.subjectId ? { ...r, staffId: e.target.value } : r
                                  )
                                );
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                            >
                              <option value="">Select teaching faculty member...</option>
                              {qualifiedStaff.map((t) => {
                                const load = staffWorkloadMap.get(t.id) || 0;
                                return (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ({t.code}) — {load}/{t.maxPerWeek} periods
                                  </option>
                                );
                              })}
                            </select>

                            {wouldExceed && (
                              <p className="text-[11px] text-amber-400 font-medium mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Workload note: {assignedTeacher?.name} will be at {currentLoad + row.periodsPerWeek}/{assignedTeacher?.maxPerWeek} periods (over limit).
                              </p>
                            )}
                          </div>
                        ) : (
                          // Split 2 Teachers
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="text-[10px] text-slate-400 mb-0.5 block">Staff 1 &amp; Periods</label>
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={row.staffId}
                                  onChange={(e) => {
                                    setWizardSubjects((prev) =>
                                      prev.map((r) =>
                                        r.subjectId === row.subjectId ? { ...r, staffId: e.target.value } : r
                                      )
                                    );
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg bg-[#161224] border border-white/10 text-white text-xs"
                                >
                                  <option value="">Select Staff 1...</option>
                                  {qualifiedStaff.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min={1}
                                  value={row.periods1 || 1}
                                  onChange={(e) => {
                                    const p1 = parseInt(e.target.value, 10) || 1;
                                    setWizardSubjects((prev) =>
                                      prev.map((r) =>
                                        r.subjectId === row.subjectId
                                          ? { ...r, periods1: p1, periods2: Math.max(1, row.periodsPerWeek - p1) }
                                          : r
                                      )
                                    );
                                  }}
                                  className="w-12 px-2 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white text-xs font-mono-code text-center"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 mb-0.5 block">Staff 2 &amp; Periods</label>
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={row.staffId2 || ''}
                                  onChange={(e) => {
                                    setWizardSubjects((prev) =>
                                      prev.map((r) =>
                                        r.subjectId === row.subjectId ? { ...r, staffId2: e.target.value } : r
                                      )
                                    );
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg bg-[#161224] border border-white/10 text-white text-xs"
                                >
                                  <option value="">Select Staff 2...</option>
                                  {qualifiedStaff.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min={1}
                                  value={row.periods2 || 1}
                                  onChange={(e) => {
                                    const p2 = parseInt(e.target.value, 10) || 1;
                                    setWizardSubjects((prev) =>
                                      prev.map((r) =>
                                        r.subjectId === row.subjectId
                                          ? { ...r, periods2: p2, periods1: Math.max(1, row.periodsPerWeek - p2) }
                                          : r
                                      )
                                    );
                                  }}
                                  className="w-12 px-2 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white text-xs font-mono-code text-center"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <MoltenButton size="sm" variant="ghost" onClick={() => setWizardStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </MoltenButton>
                <MoltenButton size="md" variant="molten" onClick={() => setWizardStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Next: Review &amp; Commit
                </MoltenButton>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* QUESTION 4: Review and Atomic Save                                    */}
          {/* ===================================================================== */}
          {wizardStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Q4. Review Cohort Curriculum &amp; Faculty Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Verify the subject-staff assignments before saving to store and database.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{q1Name} – {q1Section}</span>
                  {q1RoomLabel && <span className="text-slate-400 ml-2">({q1RoomLabel})</span>}
                </div>
                <div className="font-mono-code font-bold text-amber-300">
                  {wizardSelectedPeriods} / {totalSchoolSlots} periods
                </div>
              </div>

              {/* Review Table */}
              <div className="max-h-60 overflow-y-auto border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-black/40 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3">Faculty</th>
                      <th className="py-2 px-3 text-right">Periods/Wk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {wizardSubjects
                      .filter((s) => s.selected)
                      .map((row) => {
                        const subObj = subjects.find((s) => s.id === row.subjectId);
                        const t1 = teachers.find((t) => t.id === row.staffId);
                        const t2 = row.splitStaff && row.staffId2 ? teachers.find((t) => t.id === row.staffId2) : null;

                        return (
                          <tr key={row.subjectId} className="hover:bg-white/5">
                            <td className="py-2 px-3 flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subObj?.color }} />
                              <span className="font-bold text-white">{subObj?.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono-code">({subObj?.code})</span>
                            </td>
                            <td className="py-2 px-3 text-slate-300">
                              {row.splitStaff ? (
                                <span>{t1?.name || 'Unassigned'} ({row.periods1}p) + {t2?.name || 'Unassigned'} ({row.periods2}p)</span>
                              ) : (
                                <span>{t1 ? `${t1.name} (${t1.code})` : <strong className="text-red-400">Not Assigned</strong>}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono-code font-bold text-amber-300">
                              {row.periodsPerWeek}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {wizardSelectedPeriods !== totalSchoolSlots && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    Schedule has {wizardSelectedPeriods} periods vs {totalSchoolSlots} available slots. Class will be marked as{' '}
                    <strong>{wizardSelectedPeriods > totalSchoolSlots ? 'Over capacity' : 'Incomplete'}</strong> until adjusted.
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <MoltenButton size="sm" variant="ghost" onClick={() => setWizardStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </MoltenButton>
                <MoltenButton
                  size="md"
                  variant="molten"
                  onClick={handleSaveWizard}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Save Class &amp; Assignments
                </MoltenButton>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Quick Staff Creation Modal inside Wizard */}
      <Modal
        isOpen={Boolean(quickStaffSubjectId)}
        onClose={() => { setQuickStaffSubjectId(null); setQuickStaffError(null); }}
        maxWidth="md"
        title="Add Faculty for Subject"
        subtitle="Quickly register faculty and qualify them for this subject"
        icon={<Users className="w-5 h-5 text-amber-400" />}
      >
        <form onSubmit={handleCreateQuickStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={quickStaffName}
              onChange={(e) => {
                setQuickStaffName(e.target.value);
                setQuickStaffError(null);
                if (!quickStaffCode) {
                  const initials = e.target.value
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 4);
                  setQuickStaffCode(initials);
                }
              }}
              placeholder="e.g. Dr. Jane Smith"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Code * (Short)</label>
              <input
                type="text"
                value={quickStaffCode}
                onChange={(e) => { setQuickStaffCode(e.target.value); setQuickStaffError(null); }}
                placeholder="e.g. JS"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm uppercase font-mono-code focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Max Periods / Week</label>
              <input
                type="number"
                min={1}
                max={45}
                value={quickStaffMaxWeek}
                onChange={(e) => setQuickStaffMaxWeek(parseInt(e.target.value, 10) || 28)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-code focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {quickStaffError && <p className="text-xs text-red-400 font-medium">{quickStaffError}</p>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <MoltenButton type="button" size="sm" variant="ghost" onClick={() => setQuickStaffSubjectId(null)}>
              Cancel
            </MoltenButton>
            <MoltenButton type="submit" size="sm" variant="molten">
              Create &amp; Assign Faculty
            </MoltenButton>
          </div>
        </form>
      </Modal>

      {/* Copy Setup Modal */}
      <Modal
        isOpen={Boolean(copySourceClass)}
        onClose={() => setCopySourceClass(null)}
        maxWidth="lg"
        title="Copy Class Curriculum Setup"
        subtitle={`Copy subjects and teachers from ${copySourceClass?.name} – ${copySourceClass?.section}`}
        icon={<Copy className="w-5 h-5 text-amber-400" />}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Select the destination classes to receive the complete subject and faculty assignment structure:
          </p>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {classes
              .filter((c) => c.id !== copySourceClass?.id)
              .map((c) => {
                const isSelected = copyTargetIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setCopyTargetIds((prev) =>
                            isSelected ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                          );
                        }}
                        className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                      />
                      <span className="text-xs font-bold text-white">{c.name} – {c.section}</span>
                    </div>
                  </label>
                );
              })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <MoltenButton size="sm" variant="ghost" onClick={() => setCopySourceClass(null)}>
              Cancel
            </MoltenButton>
            <MoltenButton
              size="sm"
              variant="molten"
              disabled={copyTargetIds.length === 0}
              onClick={handleExecuteCopySetup}
            >
              Apply Copy ({copyTargetIds.length} Classes)
            </MoltenButton>
          </div>
        </div>
      </Modal>

      {/* Bulk Generator Modal */}
      <Modal
        isOpen={showQuickGen}
        onClose={() => setShowQuickGen(false)}
        maxWidth="lg"
        title="Batch Generate Cohorts"
        subtitle="Quickly create standard grade and section cohorts"
        icon={<Wand2 className="w-5 h-5 text-amber-400" />}
      >
        <form onSubmit={handleQuickGenConfirm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Starting Grade</label>
              <input
                type="number"
                min={1}
                max={12}
                value={startGrade}
                onChange={(e) => setStartGrade(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-code focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ending Grade</label>
              <input
                type="number"
                min={startGrade}
                max={12}
                value={endGrade}
                onChange={(e) => setEndGrade(parseInt(e.target.value, 10) || 12)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-code focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sections (comma separated)</label>
            <input
              type="text"
              value={sectionsInput}
              onChange={(e) => setSectionsInput(e.target.value)}
              placeholder="A, B, C"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm uppercase font-mono-code focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <MoltenButton type="button" size="sm" variant="ghost" onClick={() => setShowQuickGen(false)}>
              Cancel
            </MoltenButton>
            <MoltenButton type="submit" size="sm" variant="molten">
              Generate Cohorts
            </MoltenButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ReferentialWarningModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Class Cohort"
        entityName={deleteTarget ? `${deleteTarget.name} – ${deleteTarget.section}` : ''}
        affectedCount={deleteDependencyInfo.count}
        details={deleteDependencyInfo.details}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
