import React, { useState, useMemo } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { ReferentialWarningModal } from '../components/ReferentialWarningModal';
import { Modal } from '../components/ui/Modal';
import {
  BookOpen,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Sparkles,
  Search,
  Download,
  Upload,
  HelpCircle,
  Layers,
  Sun
} from 'lucide-react';
import { Subject, ID } from '../types';

const PRESET_COLORS = [
  '#f97316', // Ember Orange
  '#eab308', // Gold
  '#3b82f6', // Sapphire Blue
  '#10b981', // Emerald Green
  '#8b5cf6', // Amethyst Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
];

export const SubjectsPage: React.FC = () => {
  const {
    project,
    addSubject,
    updateSubject,
    deleteSubject,
    duplicateSubject,
    bulkDeleteSubjects,
    addCommonSubjects,
    checkEntityDependencies,
    addToast
  } = useTimetableStore();

  const { subjects, teachers } = project;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'theory' | 'lab' | 'sports' | 'activity'>('all');

  // Form State: Add Subject
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#f97316');
  const [type, setType] = useState<Subject['type']>('theory');
  const [defaultPeriodsPerWeek, setDefaultPeriodsPerWeek] = useState(5);
  const [doublePeriod, setDoublePeriod] = useState(false);
  const [preferMorning, setPreferMorning] = useState(false);
  const [maxPerDay, setMaxPerDay] = useState(2);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editType, setEditType] = useState<Subject['type']>('theory');
  const [editDefaultPeriodsPerWeek, setEditDefaultPeriodsPerWeek] = useState(5);
  const [editDoublePeriod, setEditDoublePeriod] = useState(false);
  const [editPreferMorning, setEditPreferMorning] = useState(false);
  const [editMaxPerDay, setEditMaxPerDay] = useState(2);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Target for Referential Modal
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<{ count: number; details: string[] }>({ count: 0, details: [] });

  // Bulk Selection
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<ID[]>([]);

  // Auto-suggest code when typing subject name
  const handleNameChange = (val: string) => {
    setName(val);
    setFormError(null);
    if (!code || code === autoSuggestCode(name)) {
      setCode(autoSuggestCode(val));
    }
  };

  const autoSuggestCode = (str: string): string => {
    const clean = str.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
      return words.map(w => w[0]).slice(0, 4).join('');
    } else if (words.length === 2) {
      return (words[0].slice(0, 2) + words[1].slice(0, 2)).slice(0, 4);
    } else if (words.length === 1) {
      return words[0].slice(0, 4);
    }
    return '';
  };

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      return true;
    });
  }, [subjects, searchQuery, typeFilter]);

  // Handle Add
  const executeAddSubject = (): boolean => {
    if (!name.trim()) {
      setFormError('Subject Name is required (e.g. Physics)');
      return false;
    }
    if (!code.trim()) {
      setFormError('Subject Code is required (e.g. PHY)');
      return false;
    }

    const normCode = code.trim().toUpperCase();
    if (subjects.some(s => s.code.toUpperCase() === normCode)) {
      setFormError(`Subject Code "${normCode}" is already in use.`);
      return false;
    }

    setFormError(null);
    addSubject({
      name: name.trim(),
      code: normCode,
      color,
      type,
      defaultPeriodsPerWeek: defaultPeriodsPerWeek || 5,
      doublePeriod,
      preferMorning,
      maxPerDay,
    });
    return true;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (executeAddSubject()) {
      setName('');
      setCode('');
      setDoublePeriod(false);
      setPreferMorning(false);
      setMaxPerDay(2);
    }
  };

  const handleAddAnother = (e: React.MouseEvent) => {
    e.preventDefault();
    if (executeAddSubject()) {
      setName('');
      setCode('');
      // Keep type and periods for easy sequential creation
      addToast('Added! Ready for next subject.', 'info');
    }
  };

  // Open Edit
  const openEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setEditName(sub.name);
    setEditCode(sub.code);
    setEditColor(sub.color);
    setEditType(sub.type);
    setEditDefaultPeriodsPerWeek(sub.defaultPeriodsPerWeek || 5);
    setEditDoublePeriod(sub.doublePeriod || false);
    setEditPreferMorning(sub.preferMorning || false);
    setEditMaxPerDay(sub.maxPerDay || 2);
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    if (!editName.trim()) {
      setEditError('Subject Name is required');
      return;
    }
    if (!editCode.trim()) {
      setEditError('Subject Code is required');
      return;
    }

    const normCode = editCode.trim().toUpperCase();
    const isDup = subjects.some(s => s.id !== editingSubject.id && s.code.toUpperCase() === normCode);
    if (isDup) {
      setEditError(`Subject code "${normCode}" is already used by another subject.`);
      return;
    }

    updateSubject(editingSubject.id, {
      name: editName.trim(),
      code: normCode,
      color: editColor,
      type: editType,
      defaultPeriodsPerWeek: editDefaultPeriodsPerWeek || 5,
      doublePeriod: editDoublePeriod,
      preferMorning: editPreferMorning,
      maxPerDay: editMaxPerDay,
    });
    setEditingSubject(null);
  };

  // Delete Prompt
  const promptDelete = (sub: Subject) => {
    const deps = checkEntityDependencies('subject', sub.id);
    setDeleteTarget(sub);
    setDependencyInfo({
      count: deps.affectedAssignments + deps.affectedSlots,
      details: deps.details,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteSubject(deleteTarget.id, true);
      setDeleteTarget(null);
    }
  };

  // Bulk Delete
  const toggleSelectRow = (id: ID) => {
    setSelectedSubjectIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedSubjectIds.length === 0) return;
    bulkDeleteSubjects(selectedSubjectIds);
    setSelectedSubjectIds([]);
  };

  // CSV Export
  const exportSubjectsCSV = () => {
    const headers = ['Name', 'Code', 'Type', 'Color', 'DefaultPeriodsPerWeek', 'DoublePeriod', 'PreferMorning', 'MaxPerDay'];
    const rows = subjects.map(s => [
      `"${s.name}"`,
      `"${s.code}"`,
      s.type,
      `"${s.color}"`,
      s.defaultPeriodsPerWeek || 5,
      s.doublePeriod ? 'true' : 'false',
      s.preferMorning ? 'true' : 'false',
      s.maxPerDay || 2,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.school.name.replace(/\s+/g, '_')}_Subjects.csv`;
    link.click();
    addToast('Subjects exported to CSV successfully.', 'success');
  };

  // Download Template
  const downloadTemplate = () => {
    const csv = 'Name,Code,Type,Color,DefaultPeriodsPerWeek,DoublePeriod,PreferMorning,MaxPerDay\nPhysics,PHY,lab,#3b82f6,4,true,false,2\nMathematics,MATH,theory,#f97316,6,false,true,2\nPhysical Education,PE,sports,#10b981,2,false,false,2';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ChronoForge_Subjects_Template.csv';
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
            addSubject({
              name: parts[0],
              code: parts[1].toUpperCase(),
              type: (parts[2]?.toLowerCase() as Subject['type']) || 'theory',
              color: parts[3] || PRESET_COLORS[imported % PRESET_COLORS.length],
              defaultPeriodsPerWeek: parts[4] ? parseInt(parts[4], 10) : 5,
              doublePeriod: parts[5]?.toLowerCase() === 'true',
              preferMorning: parts[6]?.toLowerCase() === 'true',
              maxPerDay: parts[7] ? parseInt(parts[7], 10) : 2,
            });
            imported++;
          }
        });

        if (imported > 0) {
          addToast(`Imported ${imported} subjects from CSV!`, 'success');
        } else {
          addToast('No valid subject rows found in CSV.', 'warning');
        }
      } catch {
        addToast('Failed to parse subjects CSV.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Subjects &amp; Curriculum Catalog
            </h1>
            <p className="text-xs text-slate-400">
              {subjects.length} subjects registered ({subjects.filter(s => s.doublePeriod).length} practical/lab blocks)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={addCommonSubjects}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
          >
            Add Common Subjects Preset
          </MoltenButton>

          <label className="cursor-pointer">
            <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </span>
          </label>

          <MoltenButton size="sm" variant="glass" onClick={exportSubjectsCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
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
          <span className="font-bold text-white">How this works:</span> Double-period subjects (such as Chemistry Lab or Physics Lab) are guaranteed to be scheduled as two consecutive periods and will never be split across a recess. Morning priority prioritizes core cognitive subjects earlier in the day.
        </div>
      </div>

      {/* Add Subject Form */}
      <PlasmaGlass className="p-4 sm:p-5 border-white/10">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-ember-400" /> Register New Subject
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Physics"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Code * (Short)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setFormError(null); }}
                placeholder="e.g. PHY"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500 uppercase font-mono-code"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Subject['type'])}
                className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-sm focus:outline-none focus:border-ember-500 capitalize"
              >
                <option value="theory">Theory</option>
                <option value="lab">Lab / Practical</option>
                <option value="sports">Sports</option>
                <option value="activity">Activity / Arts</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Default Periods/Wk *</label>
              <input
                type="number"
                min={1}
                max={15}
                value={defaultPeriodsPerWeek}
                onChange={(e) => setDefaultPeriodsPerWeek(parseInt(e.target.value, 10) || 5)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-code focus:outline-none focus:border-ember-500"
                title="Default periods per week to pre-fill in class setup"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tag Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <div className="flex items-center gap-1 overflow-x-auto">
                  {PRESET_COLORS.slice(0, 5).map((pc) => (
                    <button
                      key={pc}
                      type="button"
                      onClick={() => setColor(pc)}
                      className="w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-125 shrink-0"
                      style={{ backgroundColor: pc }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="sm:col-span-3 flex items-center gap-2">
              <MoltenButton type="submit" size="md" variant="molten" className="flex-1 justify-center">
                Add Subject
              </MoltenButton>
              <MoltenButton type="button" size="md" variant="glass" onClick={handleAddAnother} className="px-3">
                Add Another
              </MoltenButton>
            </div>
          </div>

          {/* Flags row */}
          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-white/5 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={doublePeriod}
                onChange={(e) => setDoublePeriod(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-ember-500 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Requires Double Period (2 consecutive slots)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferMorning}
                onChange={(e) => setPreferMorning(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-ember-500 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Prefer Morning Periods
              </span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Max per day:</span>
              <input
                type="number"
                min={1}
                max={4}
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(parseInt(e.target.value, 10) || 2)}
                className="w-14 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white text-xs font-mono-code focus:outline-none"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-400 font-medium animate-fadeIn">{formError}</p>
          )}
        </form>
      </PlasmaGlass>

      {/* Controls: Search, Type Filter, Bulk Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {(['all', 'theory', 'lab', 'sports', 'activity'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTypeFilter(tf)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${typeFilter === tf
                  ? 'bg-ember-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {selectedSubjectIds.length > 0 && (
            <MoltenButton
              size="sm"
              variant="ghost"
              onClick={handleBulkDelete}
              className="text-red-400 hover:bg-red-500/10"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Selected ({selectedSubjectIds.length})
            </MoltenButton>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects or codes..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-ember-500"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <PlasmaGlass className="p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No subjects found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search query or filter.' : 'Add your first subject or click "Add Common Subjects Preset" to pre-load a standard school curriculum.'}
          </p>
          {!searchQuery && (
            <MoltenButton size="sm" variant="molten" onClick={addCommonSubjects} leftIcon={<Sparkles className="w-4 h-4" />}>
              Add Common Subjects
            </MoltenButton>
          )}
        </PlasmaGlass>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubjects.map((sub) => {
            const qualifiedTeachers = teachers.filter(t => t.subjectIds.includes(sub.id));
            const isBatchSelected = selectedSubjectIds.includes(sub.id);

            return (
              <PlasmaGlass
                key={sub.id}
                hoverEffect
                className="p-4 transition-all border border-white/10 bg-[#161224]/70"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isBatchSelected}
                      onChange={() => toggleSelectRow(sub.id)}
                      className="rounded border-white/20 bg-black/40 text-ember-500 focus:ring-0 cursor-pointer"
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: sub.color }}
                    />
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {sub.name}
                      </h4>
                      <div className="text-[11px] text-amber-300 font-mono-code font-semibold">
                        {sub.code}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateSubject(sub.id)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Duplicate Subject"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(sub)}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promptDelete(sub)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">Type:</span>
                    <span className="text-slate-200 capitalize font-medium text-[11px]">
                      {sub.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">Qualified Faculty:</span>
                    <span className="text-slate-200 font-mono-code text-[11px]">
                      {qualifiedTeachers.length} teacher{qualifiedTeachers.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">Default Load:</span>
                    <span className="text-amber-300 font-mono-code text-[11px] font-bold">
                      {sub.defaultPeriodsPerWeek || 5} periods/wk
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                  {sub.doublePeriod && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      <Layers className="w-2.5 h-2.5" /> Double Period
                    </span>
                  )}
                  {sub.preferMorning && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Sun className="w-2.5 h-2.5" /> Morning Priority
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-white/5 text-slate-400">
                    Max {sub.maxPerDay || 2}/day
                  </span>
                </div>
              </PlasmaGlass>
            );
          })}
        </div>
      )}

      {/* Edit Subject Modal */}
      <Modal
        isOpen={Boolean(editingSubject)}
        onClose={() => setEditingSubject(null)}
        maxWidth="md"
        title="Edit Subject Details"
        icon={<Edit2 className="w-4 h-4 text-ember-400" />}
      >

        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Name *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Code *</label>
              <input
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 uppercase font-mono-code"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as Subject['type'])}
                className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 capitalize"
              >
                <option value="theory">Theory</option>
                <option value="lab">Lab / Practical</option>
                <option value="sports">Sports</option>
                <option value="activity">Activity / Arts</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Default Periods / Week *</label>
            <input
              type="number"
              min={1}
              max={15}
              value={editDefaultPeriodsPerWeek}
              onChange={(e) => setEditDefaultPeriodsPerWeek(parseInt(e.target.value, 10) || 5)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-code focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <span className="text-xs text-slate-300 font-mono-code">{editColor}</span>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editDoublePeriod}
                onChange={(e) => setEditDoublePeriod(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-ember-500 focus:ring-0"
              />
              <span>Requires Double Period (consecutive)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editPreferMorning}
                onChange={(e) => setEditPreferMorning(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-ember-500 focus:ring-0"
              />
              <span>Prefer Morning Schedule</span>
            </label>

            <div className="flex items-center gap-2 pt-1">
              <span>Max periods per day:</span>
              <input
                type="number"
                min={1}
                max={4}
                value={editMaxPerDay}
                onChange={(e) => setEditMaxPerDay(parseInt(e.target.value, 10) || 2)}
                className="w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs font-mono-code"
              />
            </div>
          </div>

          {editError && (
            <p className="text-xs text-red-400 font-medium">{editError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <MoltenButton type="button" size="sm" variant="ghost" onClick={() => setEditingSubject(null)}>
              Cancel
            </MoltenButton>
            <MoltenButton type="submit" size="sm" variant="molten">
              Save Changes
            </MoltenButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ReferentialWarningModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Subject"
        entityName={deleteTarget ? `${deleteTarget.name} (${deleteTarget.code})` : ''}
        affectedCount={dependencyInfo.count}
        details={dependencyInfo.details}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
