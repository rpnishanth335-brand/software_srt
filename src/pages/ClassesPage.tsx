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
  CheckSquare, 
  Square, 
  Search, 
  Download, 
  Upload, 
  HelpCircle,
  X,
  UserCheck,
  DoorOpen,
  Users
} from 'lucide-react';
import { ClassRoom, ID } from '../types';

export const ClassesPage: React.FC = () => {
  const { 
    project, 
    addClass, 
    updateClass, 
    deleteClass, 
    duplicateClass, 
    bulkDeleteClasses, 
    toggleSelectClass, 
    selectAllClasses, 
    quickGenerateClasses,
    checkEntityDependencies,
    addToast
  } = useTimetableStore();

  const { classes, teachers, rooms } = project;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'primary' | 'middle' | 'high' | 'senior'>('all');

  // Form State: Add Class
  const [name, setName] = useState('');
  const [section, setSection] = useState('A');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [strength, setStrength] = useState<number>(35);
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk Generator State
  const [showQuickGen, setShowQuickGen] = useState(false);
  const [startGrade, setStartGrade] = useState(6);
  const [endGrade, setEndGrade] = useState(10);
  const [sectionsInput, setSectionsInput] = useState('A, B');

  // Edit Modal State
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [editName, setEditName] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editRoomId, setEditRoomId] = useState('');
  const [editClassTeacherId, setEditClassTeacherId] = useState('');
  const [editStrength, setEditStrength] = useState(35);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete / Cascade Warning State
  const [deleteTarget, setDeleteTarget] = useState<ClassRoom | null>(null);
  const [deleteDependencyInfo, setDeleteDependencyInfo] = useState<{ count: number; details: string[] }>({ count: 0, details: [] });

  // Bulk Selection for batch operations
  const [selectedClassIds, setSelectedClassIds] = useState<ID[]>([]);

  // Filtering Logic
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchesSearch = 
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.room && cls.room.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (gradeFilter === 'all') return true;

      // Extract number from grade name
      const numMatch = cls.name.match(/\d+/);
      const gradeNum = numMatch ? parseInt(numMatch[0], 10) : 0;

      if (gradeFilter === 'primary') return gradeNum >= 1 && gradeNum <= 5;
      if (gradeFilter === 'middle') return gradeNum >= 6 && gradeNum <= 8;
      if (gradeFilter === 'high') return gradeNum >= 9 && gradeNum <= 10;
      if (gradeFilter === 'senior') return gradeNum >= 11 && gradeNum <= 12;

      return true;
    });
  }, [classes, searchQuery, gradeFilter]);

  // Handle Manual Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Class Name is required (e.g. Grade 10)');
      return;
    }
    if (!section.trim()) {
      setFormError('Section is required (e.g. A)');
      return;
    }

    // Check duplicate
    const normalizedName = name.trim().toLowerCase();
    const normalizedSec = section.trim().toUpperCase();
    const exists = classes.some(
      (c) => c.name.toLowerCase() === normalizedName && c.section.toUpperCase() === normalizedSec
    );

    if (exists) {
      setFormError(`Class ${name.trim()} - ${normalizedSec} already exists!`);
      return;
    }

    setFormError(null);
    const chosenRoom = rooms.find(r => r.id === selectedRoomId);
    addClass({
      name: name.trim(),
      section: normalizedSec,
      selected: true,
      room: chosenRoom ? `${chosenRoom.code || chosenRoom.number} (${chosenRoom.name})` : undefined,
      roomId: selectedRoomId || undefined,
      classTeacherId: classTeacherId || undefined,
      strength: strength || 35,
    });

    setName('');
    setSection('A');
    setSelectedRoomId('');
    setClassTeacherId('');
    setStrength(35);
  };

  // Handle Quick Generator Preview
  const quickGenPreview = useMemo(() => {
    const secList = sectionsInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const result: string[] = [];
    for (let g = startGrade; g <= endGrade; g++) {
      for (const s of secList) {
        result.push(`Grade ${g} - ${s}`);
      }
    }
    return result;
  }, [startGrade, endGrade, sectionsInput]);

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

  // Open Edit Modal
  const openEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    setEditName(cls.name);
    setEditSection(cls.section);
    setEditRoomId(cls.roomId || '');
    setEditClassTeacherId(cls.classTeacherId || '');
    setEditStrength(cls.strength || 35);
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    if (!editName.trim()) {
      setEditError('Class name cannot be empty');
      return;
    }
    if (!editSection.trim()) {
      setEditError('Section cannot be empty');
      return;
    }

    const normName = editName.trim().toLowerCase();
    const normSec = editSection.trim().toUpperCase();
    const isDup = classes.some(
      (c) => c.id !== editingClass.id && c.name.toLowerCase() === normName && c.section.toUpperCase() === normSec
    );
    if (isDup) {
      setEditError(`Another class with ${editName.trim()} - ${normSec} already exists.`);
      return;
    }

    const chosenRoom = rooms.find(r => r.id === editRoomId);
    updateClass(editingClass.id, {
      name: editName.trim(),
      section: normSec,
      roomId: editRoomId || undefined,
      room: chosenRoom ? `${chosenRoom.code || chosenRoom.number} (${chosenRoom.name})` : undefined,
      classTeacherId: editClassTeacherId || undefined,
      strength: editStrength || 35,
    });
    setEditingClass(null);
  };

  // Prompt Delete with Dependency Check
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

  // Bulk Selection
  const toggleSelectRow = (id: ID) => {
    setSelectedClassIds((prev) => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllRows = () => {
    if (selectedClassIds.length === filteredClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(filteredClasses.map(c => c.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedClassIds.length === 0) return;
    bulkDeleteClasses(selectedClassIds);
    setSelectedClassIds([]);
  };

  // CSV Export
  const exportClassesCSV = () => {
    const headers = ['Name', 'Section', 'Room', 'Strength'];
    const rows = classes.map((c) => [
      `"${c.name}"`,
      `"${c.section}"`,
      `"${c.room || ''}"`,
      c.strength || 35,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${project.school.name.replace(/\s+/g, '_')}_Classes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Classes exported to CSV successfully.', 'success');
  };

  // Download Sample Template
  const downloadTemplate = () => {
    const csv = 'Name,Section,Room,Strength\nGrade 1,A,Room 101,30\nGrade 1,B,Room 102,30\nGrade 2,A,Room 201,32';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ChronoForge_Classes_Template.csv';
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
        let importedCount = 0;

        lines.slice(1).forEach((line) => {
          const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 2 && parts[0] && parts[1]) {
            addClass({
              name: parts[0],
              section: parts[1].toUpperCase(),
              room: parts[2] || undefined,
              strength: parts[3] ? parseInt(parts[3], 10) : 35,
              selected: true,
            });
            importedCount++;
          }
        });

        if (importedCount > 0) {
          addToast(`Successfully imported ${importedCount} classes from CSV!`, 'success');
        } else {
          addToast('No valid class rows found in CSV.', 'warning');
        }
      } catch {
        addToast('Failed to parse CSV file. Please verify format.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const allTimetableSelected = classes.length > 0 && classes.every((c) => c.selected);
  const selectedCount = classes.filter((c) => c.selected).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Classes &amp; Cohort Sections
            </h1>
            <p className="text-xs text-slate-400">
              {classes.length} total classes ({selectedCount} active for generation)
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

          <MoltenButton size="sm" variant="glass" onClick={exportClassesCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </MoltenButton>

          <MoltenButton size="sm" variant="ghost" onClick={downloadTemplate}>
            Template
          </MoltenButton>

          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => setShowQuickGen(!showQuickGen)}
            leftIcon={<Wand2 className="w-3.5 h-3.5" />}
          >
            Bulk Generator
          </MoltenButton>
        </div>
      </div>

      {/* Why We Ask Hint */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs">
        <HelpCircle className="w-4 h-4 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">How this works:</span> Each class has its own timetable grid. Check "Include in Timetable" to generate periods for it. You can define homerooms and assign class teachers who are given preference during periods.
        </div>
      </div>

      {/* Quick Batch Generator Drawer */}
      {showQuickGen && (
        <PlasmaGlass glow className="p-6 border-amber-500/40 space-y-4 animate-slideIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-ember-400" />
              Batch Class Generator
            </h3>
            <button onClick={() => setShowQuickGen(false)} className="text-xs text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleQuickGenConfirm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Start Grade</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={startGrade}
                  onChange={(e) => setStartGrade(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">End Grade</label>
                <input
                  type="number"
                  min={startGrade}
                  max={12}
                  value={endGrade}
                  onChange={(e) => setEndGrade(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sections (comma separated)</label>
                <input
                  type="text"
                  value={sectionsInput}
                  onChange={(e) => setSectionsInput(e.target.value)}
                  placeholder="A, B, C"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs">
              <span className="font-semibold text-slate-400">Classes to create ({quickGenPreview.length}): </span>
              <span className="text-amber-300 font-mono-code">{quickGenPreview.slice(0, 12).join(', ')}{quickGenPreview.length > 12 ? '...' : ''}</span>
            </div>

            <div className="flex justify-end gap-2">
              <MoltenButton type="button" size="sm" variant="ghost" onClick={() => setShowQuickGen(false)}>
                Cancel
              </MoltenButton>
              <MoltenButton type="submit" size="sm" variant="molten" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Create {quickGenPreview.length} Classes
              </MoltenButton>
            </div>
          </form>
        </PlasmaGlass>
      )}

      {/* Manual Class Addition Form */}
      <PlasmaGlass className="p-4 sm:p-5 border-white/10">
        <form onSubmit={handleAddSubmit} className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-ember-400" /> Add Individual Class
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Class Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setFormError(null); }}
                placeholder="e.g. Grade 10"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Section *</label>
              <input
                type="text"
                value={section}
                onChange={(e) => { setSection(e.target.value); setFormError(null); }}
                placeholder="e.g. A"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500 uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Homeroom</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-sm focus:outline-none focus:border-ember-500"
              >
                <option value="">None / Custom</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.code || r.number} - {r.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Class Teacher</label>
              <select
                value={classTeacherId}
                onChange={(e) => setClassTeacherId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-sm focus:outline-none focus:border-ember-500"
              >
                <option value="">None Assigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Students</label>
              <input
                type="number"
                min={1}
                max={100}
                value={strength}
                onChange={(e) => setStrength(parseInt(e.target.value, 10) || 30)}
                className="w-full px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-ember-500"
              />
            </div>

            <div className="sm:col-span-1">
              <MoltenButton type="submit" size="md" variant="molten" className="w-full justify-center">
                Add
              </MoltenButton>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-400 font-medium animate-fadeIn">{formError}</p>
          )}
        </form>
      </PlasmaGlass>

      {/* Controls Bar: Search, Filters, Bulk Selection */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Grade filter chips */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {(['all', 'primary', 'middle', 'high', 'senior'] as const).map((gf) => (
              <button
                key={gf}
                onClick={() => setGradeFilter(gf)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  gradeFilter === gf
                    ? 'bg-ember-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {gf}
              </button>
            ))}
          </div>

          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => selectAllClasses(!allTimetableSelected)}
            leftIcon={allTimetableSelected ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
          >
            {allTimetableSelected ? 'Exclude All' : 'Include All in Solver'}
          </MoltenButton>

          <button
            type="button"
            onClick={handleSelectAllRows}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10"
          >
            {selectedClassIds.length === filteredClasses.length && filteredClasses.length > 0
              ? 'Deselect Rows'
              : 'Select All Rows'}
          </button>

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

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes or rooms..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-ember-500"
          />
        </div>
      </div>

      {/* Classes Table / Cards Grid */}
      {filteredClasses.length === 0 ? (
        <PlasmaGlass className="p-12 text-center space-y-4">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No classes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'Try clearing your search query or grade filter.' : 'Add your first class above or use the Bulk Generator to create grade cohorts.'}
          </p>
          {!searchQuery && (
            <MoltenButton size="sm" variant="molten" onClick={() => setShowQuickGen(true)} leftIcon={<Wand2 className="w-4 h-4" />}>
              Open Batch Generator
            </MoltenButton>
          )}
        </PlasmaGlass>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClasses.map((cls) => {
            const classTeacher = teachers.find(t => t.id === cls.classTeacherId);
            const isBatchSelected = selectedClassIds.includes(cls.id);

            return (
              <PlasmaGlass
                key={cls.id}
                hoverEffect
                className={`p-4 transition-all border ${
                  cls.selected
                    ? 'border-ember-500/40 bg-[#161224]/80 shadow-ember-glow'
                    : 'border-white/5 opacity-60 bg-[#0d0c14]/40'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isBatchSelected}
                      onChange={() => toggleSelectRow(cls.id)}
                      className="rounded border-white/20 bg-black/40 text-ember-500 focus:ring-0 cursor-pointer"
                      title="Select for bulk delete"
                    />
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-200">
                        {cls.name} – {cls.section}
                      </h4>
                      <div className="text-[11px] text-slate-400 font-mono-code flex items-center gap-1">
                        <DoorOpen className="w-3 h-3 text-slate-500" />
                        {cls.room || 'No Room'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateClass(cls.id)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Duplicate Class"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(cls)}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
                      title="Edit Class"
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

                {/* Details */}
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px]">
                      <UserCheck className="w-3 h-3 text-ember-400" />
                      Class Teacher:
                    </span>
                    <span className="text-slate-200 font-medium text-[11px]">
                      {classTeacher ? classTeacher.name : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Users className="w-3 h-3 text-slate-500" />
                      Strength:
                    </span>
                    <span className="text-slate-200 font-mono-code text-[11px]">
                      {cls.strength || 35} students
                    </span>
                  </div>
                </div>

                {/* Solver inclusion toggle */}
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleSelectClass(cls.id)}
                    className="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white transition-colors"
                  >
                    {cls.selected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>{cls.selected ? 'Included in Solver' : 'Excluded from Solver'}</span>
                  </button>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    cls.selected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'
                  }`}>
                    {cls.selected ? 'Active' : 'Off'}
                  </span>
                </div>
              </PlasmaGlass>
            );
          })}
        </div>
      )}

      {/* Edit Class Modal */}
      <Modal
        isOpen={Boolean(editingClass)}
        onClose={() => setEditingClass(null)}
        maxWidth="md"
        title="Edit Class Details"
        icon={<Edit2 className="w-5 h-5 text-ember-400" />}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Class Name *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Section *</label>
            <input
              type="text"
              value={editSection}
              onChange={(e) => setEditSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Homeroom</label>
            <select
              value={editRoomId}
              onChange={(e) => setEditRoomId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            >
              <option value="">None / Custom</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.code || r.number} - {r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Class Teacher</label>
            <select
              value={editClassTeacherId}
              onChange={(e) => setEditClassTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            >
              <option value="">None Assigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Student Strength</label>
            <input
              type="number"
              min={1}
              max={120}
              value={editStrength}
              onChange={(e) => setEditStrength(parseInt(e.target.value, 10) || 30)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {editError && (
            <p className="text-xs text-red-400 font-medium">{editError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <MoltenButton type="button" size="sm" variant="ghost" onClick={() => setEditingClass(null)}>
              Cancel
            </MoltenButton>
            <MoltenButton type="submit" size="sm" variant="molten">
              Save Changes
            </MoltenButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal with Cascade Check */}
      <ReferentialWarningModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Class"
        entityName={deleteTarget ? `${deleteTarget.name} - ${deleteTarget.section}` : ''}
        affectedCount={deleteDependencyInfo.count}
        details={deleteDependencyInfo.details}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
