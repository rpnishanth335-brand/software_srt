import React, { useState, useMemo } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { ReferentialWarningModal } from '../components/ReferentialWarningModal';
import { 
  Users, 
  Plus, 
  Trash2, 
  Copy, 
  Edit2, 
  Search, 
  Download, 
  Upload, 
  HelpCircle,
  X,
  Calendar,
  Clock,
  CalendarDays
} from 'lucide-react';
import { Teacher, ID, DayPeriod, Slot } from '../types';

export const StaffPage: React.FC = () => {
  const { 
    project, 
    addTeacher, 
    updateTeacher, 
    deleteTeacher, 
    duplicateTeacher, 
    bulkDeleteTeachers,
    blockTeacherWholeDay,
    blockTeacherWholePeriod,
    unblockTeacherAll,
    checkEntityDependencies,
    addToast 
  } = useTimetableStore();

  const { teachers, subjects, classes, school, timetables, currentVersionId } = project;
  const activeTimetable = timetables.find(t => t.id === currentVersionId) || timetables[0];
  const timetableSlots: Slot[] = activeTimetable?.slots || [];
  const maxDayPeriods = Math.max(...Object.values(school.periodsByDay), 8);
  const activeDays = school.days || [1, 2, 3, 4, 5];

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form State: Add Teacher
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<ID[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<ID[]>([]);
  const [maxPerDay, setMaxPerDay] = useState(5);
  const [maxPerWeek, setMaxPerWeek] = useState(26);
  const [maxConsecutive, setMaxConsecutive] = useState(3);
  const [preferredOffDay, setPreferredOffDay] = useState<number | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSubjects, setEditSubjects] = useState<ID[]>([]);
  const [editClasses, setEditClasses] = useState<ID[]>([]);
  const [editMaxPerDay, setEditMaxPerDay] = useState(5);
  const [editMaxPerWeek, setEditMaxPerWeek] = useState(26);
  const [editMaxConsecutive, setEditMaxConsecutive] = useState(3);
  const [editPreferredOffDay, setEditPreferredOffDay] = useState<number | undefined>(undefined);
  const [editError, setEditError] = useState<string | null>(null);

  // Availability Drawer / Modal State
  const [activeAvailabilityTeacher, setActiveAvailabilityTeacher] = useState<Teacher | null>(null);
  const [blockDayChoice, setBlockDayChoice] = useState<number>(activeDays[0] || 1);
  const [blockPeriodChoice, setBlockPeriodChoice] = useState<number>(1);

  // Personal Timetable View Modal
  const [scheduleViewTeacher, setScheduleViewTeacher] = useState<Teacher | null>(null);

  // Delete Target for Referential Integrity Warning
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<{ count: number; details: string[] }>({ count: 0, details: [] });

  // Bulk Selection
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<ID[]>([]);

  // Auto suggest code from full name initials
  const handleNameChange = (val: string) => {
    setName(val);
    setFormError(null);
    if (!code || code === autoSuggestTeacherCode(name)) {
      setCode(autoSuggestTeacherCode(val));
    }
  };

  const autoSuggestTeacherCode = (fullName: string): string => {
    const clean = fullName.trim().toUpperCase().replace(/[^A-Z\s]/g, '');
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 3) {
      return (parts[0][0] + parts[1][0] + parts[2][0]).slice(0, 4);
    } else if (parts.length === 2) {
      return (parts[0].slice(0, 2) + parts[1].slice(0, 2)).slice(0, 4);
    } else if (parts.length === 1) {
      return parts[0].slice(0, 3);
    }
    return '';
  };

  // Workload calculator: counts total assigned periods per teacher
  const workloadMap = useMemo(() => {
    const map = new Map<ID, number>();
    project.assignments.forEach((a) => {
      if (a.teacherId) {
        const cur = map.get(a.teacherId) || 0;
        map.set(a.teacherId, cur + a.periodsPerWeek);
      }
    });
    return map;
  }, [project.assignments]);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.employeeId && t.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchSearch;
    });
  }, [teachers, searchQuery]);

  // Handle Add Teacher
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Teacher full name is required');
      return;
    }
    if (!code.trim()) {
      setFormError('Teacher code is required (e.g. JS)');
      return;
    }

    const normCode = code.trim().toUpperCase();
    if (teachers.some(t => t.code.toUpperCase() === normCode)) {
      setFormError(`Teacher code "${normCode}" is already assigned.`);
      return;
    }

    if (selectedSubjects.length === 0 && subjects.length > 0) {
      addToast('Note: No subjects were selected for this teacher. You can assign subjects later.', 'warning');
    }

    setFormError(null);
    addTeacher({
      name: name.trim(),
      code: normCode,
      employeeId: employeeId.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      subjectIds: selectedSubjects,
      classIds: selectedClasses.length > 0 ? selectedClasses : classes.map(c => c.id),
      maxPerDay: maxPerDay || 5,
      maxPerWeek: maxPerWeek || 26,
      maxConsecutive: maxConsecutive || 3,
      preferredOffDay,
      blocked: [],
    });

    setName('');
    setCode('');
    setEmployeeId('');
    setEmail('');
    setPhone('');
    setSelectedSubjects([]);
    setSelectedClasses([]);
    setPreferredOffDay(undefined);
  };

  // Open Edit Modal
  const openEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditCode(t.code);
    setEditEmployeeId(t.employeeId || '');
    setEditEmail(t.email || '');
    setEditPhone(t.phone || '');
    setEditSubjects([...t.subjectIds]);
    setEditClasses([...t.classIds]);
    setEditMaxPerDay(t.maxPerDay);
    setEditMaxPerWeek(t.maxPerWeek);
    setEditMaxConsecutive(t.maxConsecutive);
    setEditPreferredOffDay(t.preferredOffDay);
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editName.trim()) {
      setEditError('Teacher name cannot be empty');
      return;
    }
    if (!editCode.trim()) {
      setEditError('Teacher code cannot be empty');
      return;
    }

    const normCode = editCode.trim().toUpperCase();
    const isDup = teachers.some(t => t.id !== editingTeacher.id && t.code.toUpperCase() === normCode);
    if (isDup) {
      setEditError(`Code "${normCode}" is already in use by another teacher.`);
      return;
    }

    updateTeacher(editingTeacher.id, {
      name: editName.trim(),
      code: normCode,
      employeeId: editEmployeeId.trim() || undefined,
      email: editEmail.trim() || undefined,
      phone: editPhone.trim() || undefined,
      subjectIds: editSubjects,
      classIds: editClasses,
      maxPerDay: editMaxPerDay,
      maxPerWeek: editMaxPerWeek,
      maxConsecutive: editMaxConsecutive,
      preferredOffDay: editPreferredOffDay,
    });
    setEditingTeacher(null);
  };

  // Delete Prompt
  const promptDelete = (t: Teacher) => {
    const deps = checkEntityDependencies('teacher', t.id);
    setDeleteTarget(t);
    setDependencyInfo({
      count: deps.affectedAssignments + deps.affectedSlots,
      details: deps.details,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteTeacher(deleteTarget.id, true);
      setDeleteTarget(null);
    }
  };

  // Bulk Delete
  const toggleSelectRow = (id: ID) => {
    setSelectedTeacherIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedTeacherIds.length === 0) return;
    bulkDeleteTeachers(selectedTeacherIds);
    setSelectedTeacherIds([]);
  };

  // Toggle single cell in availability grid
  const toggleBlockSlot = (teacher: Teacher, day: number, period: number) => {
    const exists = teacher.blocked.some(b => b.day === day && b.period === period);
    let newBlocked: DayPeriod[];
    if (exists) {
      newBlocked = teacher.blocked.filter(b => !(b.day === day && b.period === period));
    } else {
      newBlocked = [...teacher.blocked, { day, period }];
    }
    updateTeacher(teacher.id, { blocked: newBlocked });
    // Update local state if drawer is open
    setActiveAvailabilityTeacher({ ...teacher, blocked: newBlocked });
  };

  // CSV Export
  const exportTeachersCSV = () => {
    const headers = ['Name', 'Code', 'EmployeeID', 'Email', 'MaxPerDay', 'MaxPerWeek', 'Subjects'];
    const rows = teachers.map(t => {
      const subCodes = t.subjectIds.map(sid => subjects.find(s => s.id === sid)?.code).filter(Boolean).join(';');
      return [
        `"${t.name}"`,
        `"${t.code}"`,
        `"${t.employeeId || ''}"`,
        `"${t.email || ''}"`,
        t.maxPerDay,
        t.maxPerWeek,
        `"${subCodes}"`,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.school.name.replace(/\s+/g, '_')}_Teachers.csv`;
    link.click();
    addToast('Teachers exported to CSV.', 'success');
  };

  // Download Template
  const downloadTemplate = () => {
    const csv = 'Name,Code,EmployeeID,Email,MaxPerDay,MaxPerWeek\nDr. Alan Turing,AT,EMP-101,turing@school.edu,5,24\nProf. Marie Curie,MC,EMP-102,curie@school.edu,5,26';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ChronoForge_Staff_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        let imported = 0;

        lines.slice(1).forEach((line) => {
          const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 2 && parts[0] && parts[1]) {
            addTeacher({
              name: parts[0],
              code: parts[1].toUpperCase(),
              employeeId: parts[2] || undefined,
              email: parts[3] || undefined,
              maxPerDay: parts[4] ? parseInt(parts[4], 10) : 5,
              maxPerWeek: parts[5] ? parseInt(parts[5], 10) : 26,
              maxConsecutive: 3,
              subjectIds: subjects.map(s => s.id), // defaults to all
              classIds: classes.map(c => c.id),
              blocked: [],
            });
            imported++;
          }
        });

        if (imported > 0) {
          addToast(`Imported ${imported} staff members from CSV!`, 'success');
        } else {
          addToast('No valid staff rows found in CSV.', 'warning');
        }
      } catch {
        addToast('Failed to parse staff CSV file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Faculty &amp; Teaching Staff
            </h1>
            <p className="text-xs text-slate-400">
              {teachers.length} faculty members registered with individualized workload policies
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </span>
          </label>

          <MoltenButton size="sm" variant="glass" onClick={exportTeachersCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </MoltenButton>

          <MoltenButton size="sm" variant="ghost" onClick={downloadTemplate}>
            Template
          </MoltenButton>
        </div>
      </div>

      {/* Why We Ask Hint */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs">
        <HelpCircle className="w-4 h-4 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">How this works:</span> The solver strictly guarantees zero teacher double-booking. The Unavailability Grid allows you to block periods for staff meetings, part-time faculty days off, or bus duties.
        </div>
      </div>

      {/* Add Teacher Form */}
      <PlasmaGlass className="p-4 sm:p-5 border-white/10">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-ember-400" /> Add New Faculty Member
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Dr. Jane Doe"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Code * (Short)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setFormError(null); }}
                placeholder="e.g. JD"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500 uppercase font-mono-code"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Employee ID</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-012"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500 font-mono-code"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email / Phone</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@school.edu"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500"
              />
            </div>

            <div className="sm:col-span-2">
              <MoltenButton type="submit" size="md" variant="molten" className="w-full justify-center">
                Add Faculty
              </MoltenButton>
            </div>
          </div>

          {/* Subjects Handled Selector */}
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400">
                Subjects Handled ({selectedSubjects.length}/{subjects.length} selected)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedSubjects.length === subjects.length) {
                    setSelectedSubjects([]);
                  } else {
                    setSelectedSubjects(subjects.map(s => s.id));
                  }
                }}
                className="text-[10px] text-amber-300 hover:text-white"
              >
                {selectedSubjects.length === subjects.length ? 'Deselect All' : 'Select All Subjects'}
              </button>
            </div>

            {subjects.length === 0 ? (
              <p className="text-xs text-amber-400/80">No subjects created yet. You can add subjects in the Subjects tab.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg bg-black/20 border border-white/5">
                {subjects.map((sub) => {
                  const isChecked = selectedSubjects.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubjects(prev =>
                          isChecked ? prev.filter(id => id !== sub.id) : [...prev, sub.id]
                        );
                      }}
                      className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                      <span>{sub.name} ({sub.code})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workload Limits Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Max Periods / Day</label>
              <input
                type="number"
                min={1}
                max={12}
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(parseInt(e.target.value, 10) || 5)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono-code"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Max Periods / Week</label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxPerWeek}
                onChange={(e) => setMaxPerWeek(parseInt(e.target.value, 10) || 26)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono-code"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Max Consecutive Periods</label>
              <input
                type="number"
                min={1}
                max={6}
                value={maxConsecutive}
                onChange={(e) => setMaxConsecutive(parseInt(e.target.value, 10) || 3)}
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono-code"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Preferred Off Day</label>
              <select
                value={preferredOffDay ?? ''}
                onChange={(e) => setPreferredOffDay(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                className="w-full px-3 py-1.5 rounded-lg bg-[#161224] border border-white/10 text-white text-xs"
              >
                <option value="">No preference</option>
                {activeDays.map((d: number) => (
                  <option key={d} value={d}>{dayNames[d]}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-400 font-medium animate-fadeIn">{formError}</p>
          )}
        </form>
      </PlasmaGlass>

      {/* Controls: Search & Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {selectedTeacherIds.length > 0 && (
            <MoltenButton
              size="sm"
              variant="ghost"
              onClick={handleBulkDelete}
              className="text-red-400 hover:bg-red-500/10"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Selected ({selectedTeacherIds.length})
            </MoltenButton>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty name, code, ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-ember-500"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      {filteredTeachers.length === 0 ? (
        <PlasmaGlass className="p-12 text-center space-y-4">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No faculty members found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search terms.' : 'Add your first faculty member above or import from CSV.'}
          </p>
        </PlasmaGlass>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((t) => {
            const isBatchSelected = selectedTeacherIds.includes(t.id);
            const assignedCount = workloadMap.get(t.id) || 0;
            const workloadPct = Math.round((assignedCount / t.maxPerWeek) * 100);
            const handledSubs = subjects.filter(s => t.subjectIds.includes(s.id));

            let barColor = 'bg-emerald-500';
            if (workloadPct > 100) barColor = 'bg-red-500';
            else if (workloadPct > 80) barColor = 'bg-amber-500';

            return (
              <PlasmaGlass
                key={t.id}
                hoverEffect
                className="p-4 transition-all border border-white/10 bg-[#161224]/70 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isBatchSelected}
                      onChange={() => toggleSelectRow(t.id)}
                      className="rounded border-white/20 bg-black/40 text-ember-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {t.name}
                      </h4>
                      <div className="text-[11px] text-amber-300 font-mono-code font-semibold flex items-center gap-1.5">
                        <span>{t.code}</span>
                        {t.employeeId && (
                          <span className="text-slate-500 font-normal">({t.employeeId})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateTeacher(t.id)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promptDelete(t)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Workload Status Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Weekly Workload:
                    </span>
                    <span className={`font-mono-code font-bold ${workloadPct > 100 ? 'text-red-400' : 'text-slate-200'}`}>
                      {assignedCount} / {t.maxPerWeek} hrs ({workloadPct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, workloadPct)}%` }}
                    />
                  </div>
                </div>

                {/* Subjects Handled Chips */}
                <div className="pt-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Teaches:</div>
                  <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                    {handledSubs.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No subjects assigned</span>
                    ) : (
                      handledSubs.map(s => (
                        <span
                          key={s.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-white/10 bg-black/30 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-slate-300">{s.code}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Availability & Schedule View */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveAvailabilityTeacher(t)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Availability ({t.blocked.length} blocked)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleViewTeacher(t)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Schedule</span>
                  </button>
                </div>
              </PlasmaGlass>
            );
          })}
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <PlasmaGlass glow className="max-w-lg w-full p-6 border-ember-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-ember-400" /> Edit Faculty Details
              </h3>
              <button onClick={() => setEditingTeacher(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Code *</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 uppercase font-mono-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editEmployeeId}
                    onChange={(e) => setEditEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 font-mono-code"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email / Phone</label>
                  <input
                    type="text"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subjects Qualified</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-black/30 border border-white/10">
                  {subjects.map(s => {
                    const isChecked = editSubjects.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setEditSubjects(prev =>
                            isChecked ? prev.filter(x => x !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          isChecked
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        {s.name} ({s.code})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Max / Day</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={editMaxPerDay}
                    onChange={(e) => setEditMaxPerDay(parseInt(e.target.value, 10) || 5)}
                    className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono-code"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Max / Week</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editMaxPerWeek}
                    onChange={(e) => setEditMaxPerWeek(parseInt(e.target.value, 10) || 26)}
                    className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono-code"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Max Consecutive</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={editMaxConsecutive}
                    onChange={(e) => setEditMaxConsecutive(parseInt(e.target.value, 10) || 3)}
                    className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono-code"
                  />
                </div>
              </div>

              {editError && (
                <p className="text-xs text-red-400 font-medium">{editError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <MoltenButton type="button" size="sm" variant="ghost" onClick={() => setEditingTeacher(null)}>
                  Cancel
                </MoltenButton>
                <MoltenButton type="submit" size="sm" variant="molten">
                  Save Changes
                </MoltenButton>
              </div>
            </form>
          </PlasmaGlass>
        </div>
      )}

      {/* Availability Grid Modal */}
      {activeAvailabilityTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <PlasmaGlass glow className="max-w-2xl w-full p-6 border-amber-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-ember-400" />
                  Availability &amp; Blocked Slots: {activeAvailabilityTeacher.name} ({activeAvailabilityTeacher.code})
                </h3>
                <p className="text-xs text-slate-400">Click any period box to block or unblock. Solver guarantees zero assignments in blocked slots.</p>
              </div>
              <button onClick={() => setActiveAvailabilityTeacher(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Bulk Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-black/30 border border-white/10 text-xs">
              <span className="font-semibold text-slate-400">Quick Actions:</span>

              {/* Block Day */}
              <div className="flex items-center gap-1">
                <select
                  value={blockDayChoice}
                  onChange={(e) => setBlockDayChoice(parseInt(e.target.value, 10))}
                  className="px-2 py-1 rounded bg-[#161224] border border-white/10 text-white text-xs"
                >
                  {activeDays.map((d: number) => (
                    <option key={d} value={d}>{dayNames[d]}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    blockTeacherWholeDay(activeAvailabilityTeacher.id, blockDayChoice);
                    const updated = useTimetableStore.getState().project.teachers.find(t => t.id === activeAvailabilityTeacher.id);
                    if (updated) setActiveAvailabilityTeacher(updated);
                  }}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/30"
                >
                  Block Day
                </button>
              </div>

              {/* Block Period */}
              <div className="flex items-center gap-1">
                <select
                  value={blockPeriodChoice}
                  onChange={(e) => setBlockPeriodChoice(parseInt(e.target.value, 10))}
                  className="px-2 py-1 rounded bg-[#161224] border border-white/10 text-white text-xs"
                >
                  {Array.from({ length: maxDayPeriods }, (_, i) => i + 1).map(p => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    blockTeacherWholePeriod(activeAvailabilityTeacher.id, blockPeriodChoice);
                    const updated = useTimetableStore.getState().project.teachers.find(t => t.id === activeAvailabilityTeacher.id);
                    if (updated) setActiveAvailabilityTeacher(updated);
                  }}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/30"
                >
                  Block Period
                </button>
              </div>

              {/* Clear All */}
              <button
                type="button"
                onClick={() => {
                  unblockTeacherAll(activeAvailabilityTeacher.id);
                  const updated = useTimetableStore.getState().project.teachers.find(t => t.id === activeAvailabilityTeacher.id);
                  if (updated) setActiveAvailabilityTeacher(updated);
                }}
                className="ml-auto px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              >
                Clear All Blocks
              </button>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-center">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-semibold text-slate-400 border border-white/10">Day / Period</th>
                    {Array.from({ length: maxDayPeriods }, (_, i) => i + 1).map(p => (
                      <th key={p} className="p-2 font-mono-code text-slate-300 border border-white/10">
                        P{p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeDays.map((day: number) => (
                    <tr key={day}>
                      <td className="p-2 text-left font-bold text-slate-200 border border-white/10 bg-white/5">
                        {dayNames[day]}
                      </td>
                      {Array.from({ length: maxDayPeriods }, (_, i) => i + 1).map(period => {
                        const isBlocked = activeAvailabilityTeacher.blocked.some(b => b.day === day && b.period === period);
                        return (
                          <td key={period} className="p-1 border border-white/10">
                            <button
                              type="button"
                              onClick={() => toggleBlockSlot(activeAvailabilityTeacher, day, period)}
                              className={`w-full py-2 rounded-lg font-bold transition-all text-xs ${
                                isBlocked
                                  ? 'bg-red-500/30 border border-red-500/60 text-red-200 shadow-inner'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                              }`}
                            >
                              {isBlocked ? 'BLOCKED' : 'Free'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <MoltenButton size="sm" variant="molten" onClick={() => setActiveAvailabilityTeacher(null)}>
                Done
              </MoltenButton>
            </div>
          </PlasmaGlass>
        </div>
      )}

      {/* Teacher Weekly Schedule View Drawer */}
      {scheduleViewTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <PlasmaGlass glow className="max-w-3xl w-full p-6 border-amber-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-ember-400" />
                  Personal Timetable: {scheduleViewTeacher.name} ({scheduleViewTeacher.code})
                </h3>
                <p className="text-xs text-slate-400">Classes assigned to this teacher across the weekly timetable</p>
              </div>
              <button onClick={() => setScheduleViewTeacher(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {timetableSlots.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No timetable generated yet. Run the solver from the Generate tab to create teacher schedules.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs text-center">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-slate-400 border border-white/10">Day / Period</th>
                      {Array.from({ length: maxDayPeriods }, (_, i) => i + 1).map(p => (
                        <th key={p} className="p-2 font-mono-code text-slate-300 border border-white/10">
                          P{p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeDays.map((day: number) => (
                      <tr key={day}>
                        <td className="p-2 text-left font-bold text-slate-200 border border-white/10 bg-white/5">
                          {dayNames[day]}
                        </td>
                        {Array.from({ length: maxDayPeriods }, (_, i) => i + 1).map(period => {
                          const slot = timetableSlots.find(
                            (s: Slot) => s.teacherId === scheduleViewTeacher.id && s.day === day && s.period === period
                          );
                          const isBlocked = scheduleViewTeacher.blocked.some(b => b.day === day && b.period === period);
                          const cls = slot ? classes.find(c => c.id === slot.classId) : null;
                          const sub = slot ? subjects.find(s => s.id === slot.subjectId) : null;

                          return (
                            <td key={period} className="p-1 border border-white/10 min-w-[70px]">
                              {isBlocked ? (
                                <div className="py-2 rounded bg-red-950/40 border border-red-500/30 text-[10px] text-red-400 font-semibold">
                                  Blocked
                                </div>
                              ) : slot ? (
                                <div
                                  className="p-1.5 rounded border text-left shadow-sm"
                                  style={{
                                    backgroundColor: `${sub?.color || '#f97316'}22`,
                                    borderColor: `${sub?.color || '#f97316'}55`,
                                  }}
                                >
                                  <div className="font-bold text-white text-[11px] truncate">
                                    {sub?.code || 'SUB'}
                                  </div>
                                  <div className="text-[10px] text-slate-300 truncate">
                                    {cls ? `${cls.name}-${cls.section}` : 'Class'}
                                  </div>
                                </div>
                              ) : (
                                <div className="py-2 text-[10px] text-slate-600">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-white/10">
              <MoltenButton size="sm" variant="ghost" onClick={() => setScheduleViewTeacher(null)}>
                Close
              </MoltenButton>
            </div>
          </PlasmaGlass>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ReferentialWarningModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Faculty Member"
        entityName={deleteTarget ? `${deleteTarget.name} (${deleteTarget.code})` : ''}
        affectedCount={dependencyInfo.count}
        details={dependencyInfo.details}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
