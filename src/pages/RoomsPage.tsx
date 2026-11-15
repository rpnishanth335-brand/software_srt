import React, { useState, useMemo } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { ReferentialWarningModal } from '../components/ReferentialWarningModal';
import { 
  DoorOpen, 
  Plus, 
  Trash2, 
  Copy, 
  Edit2, 
  Search, 
  Download, 
  Upload, 
  HelpCircle,
  X,
  Users,
  FlaskConical,
  GraduationCap
} from 'lucide-react';
import { Room, ID } from '../types';

export const RoomsPage: React.FC = () => {
  const { 
    project, 
    addRoom, 
    updateRoom, 
    deleteRoom, 
    duplicateRoom, 
    bulkDeleteRooms, 
    checkEntityDependencies,
    addToast 
  } = useTimetableStore();

  const { rooms, classes, subjects } = project;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'classroom' | 'lab' | 'ground' | 'other'>('all');

  // Form State: Add Room
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<Room['type']>('classroom');
  const [capacity, setCapacity] = useState<number>(40);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editType, setEditType] = useState<Room['type']>('classroom');
  const [editCapacity, setEditCapacity] = useState(40);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Prompt State
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<{ count: number; details: string[] }>({ count: 0, details: [] });

  // Bulk Selection
  const [selectedRoomIds, setSelectedRoomIds] = useState<ID[]>([]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch = 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.code || r.number).toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (typeFilter === 'classroom') return r.type === 'classroom';
      if (typeFilter === 'lab') return r.type.includes('lab');
      if (typeFilter === 'ground') return r.type === 'ground';
      if (typeFilter === 'other') return r.type !== 'classroom' && !r.type.includes('lab') && r.type !== 'ground';

      return true;
    });
  }, [rooms, searchQuery, typeFilter]);

  // Handle Add Room
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Room Name is required (e.g. Physics Lab)');
      return;
    }
    if (!code.trim()) {
      setFormError('Room Code is required (e.g. LAB-01)');
      return;
    }

    const normCode = code.trim().toUpperCase();
    if (rooms.some(r => (r.code || r.number).toUpperCase() === normCode)) {
      setFormError(`Room Code "${normCode}" is already in use.`);
      return;
    }

    setFormError(null);
    addRoom({
      name: name.trim(),
      number: normCode,
      code: normCode,
      type,
      capacity: capacity || 40,
    });

    setName('');
    setCode('');
    setCapacity(40);
  };

  // Open Edit Modal
  const openEdit = (r: Room) => {
    setEditingRoom(r);
    setEditName(r.name);
    setEditCode(r.code || r.number || '');
    setEditType(r.type);
    setEditCapacity(r.capacity || 40);
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    if (!editName.trim()) {
      setEditError('Room Name is required');
      return;
    }
    if (!editCode.trim()) {
      setEditError('Room Code is required');
      return;
    }

    const normCode = editCode.trim().toUpperCase();
    const isDup = rooms.some(r => r.id !== editingRoom.id && (r.code || r.number).toUpperCase() === normCode);
    if (isDup) {
      setEditError(`Room Code "${normCode}" is already in use by another room.`);
      return;
    }

    updateRoom(editingRoom.id, {
      name: editName.trim(),
      number: normCode,
      code: normCode,
      type: editType,
      capacity: editCapacity || 40,
    });
    setEditingRoom(null);
  };

  // Delete Prompt
  const promptDelete = (r: Room) => {
    const deps = checkEntityDependencies('room', r.id);
    setDeleteTarget(r);
    setDependencyInfo({
      count: deps.affectedAssignments + deps.affectedSlots,
      details: deps.details,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteRoom(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Bulk Delete
  const toggleSelectRow = (id: ID) => {
    setSelectedRoomIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedRoomIds.length === 0) return;
    bulkDeleteRooms(selectedRoomIds);
    setSelectedRoomIds([]);
  };

  // CSV Export
  const exportRoomsCSV = () => {
    const headers = ['Name', 'Code', 'Type', 'Capacity'];
    const rows = rooms.map(r => [
      `"${r.name}"`,
      `"${r.code}"`,
      r.type,
      r.capacity || 40,
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.school.name.replace(/\s+/g, '_')}_Rooms.csv`;
    link.click();
    addToast('Rooms exported to CSV.', 'success');
  };

  // Download Template
  const downloadTemplate = () => {
    const csv = 'Name,Code,Type,Capacity\nMain Physics Lab,LAB-01,lab,36\nRoom 101,RM-101,classroom,40\nBasketball Court,COURT-A,ground,60';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ChronoForge_Rooms_Template.csv';
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
            addRoom({
              name: parts[0],
              number: parts[1].toUpperCase(),
              code: parts[1].toUpperCase(),
              type: (parts[2] as Room['type']) || 'classroom',
              capacity: parts[3] ? parseInt(parts[3], 10) : 40,
            });
            imported++;
          }
        });

        if (imported > 0) {
          addToast(`Imported ${imported} rooms from CSV!`, 'success');
        } else {
          addToast('No valid room rows found in CSV.', 'warning');
        }
      } catch {
        addToast('Failed to parse rooms CSV file.', 'error');
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
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Rooms &amp; Physical Infrastructure
            </h1>
            <p className="text-xs text-slate-400">
              {rooms.length} facilities registered (labs, classrooms, grounds)
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

          <MoltenButton size="sm" variant="glass" onClick={exportRoomsCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
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
          <span className="font-bold text-white">How this works:</span> The solver prevents room clashing — two classes will never be assigned to the same laboratory, sports court, or classroom at the same period.
        </div>
      </div>

      {/* Add Room Form */}
      <PlasmaGlass className="p-4 sm:p-5 border-white/10">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-ember-400" /> Register Facility / Room
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Room Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setFormError(null); }}
                placeholder="e.g. Physics Lab 1"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Code / Room # *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setFormError(null); }}
                placeholder="e.g. LAB-01"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-ember-500 uppercase font-mono-code"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Facility Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Room['type'])}
                className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-sm focus:outline-none focus:border-ember-500 capitalize"
              >
                <option value="classroom">Classroom</option>
                <option value="lab">Science Lab</option>
                <option value="ground">Sports Ground / Court</option>
                <option value="other">Library / Auditorium / Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                max={500}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 40)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-ember-500 font-mono-code"
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

      {/* Controls: Search, Filters & Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {(['all', 'classroom', 'lab', 'ground', 'other'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTypeFilter(tf)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  typeFilter === tf
                    ? 'bg-ember-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {selectedRoomIds.length > 0 && (
            <MoltenButton
              size="sm"
              variant="ghost"
              onClick={handleBulkDelete}
              className="text-red-400 hover:bg-red-500/10"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Selected ({selectedRoomIds.length})
            </MoltenButton>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room name or code..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-ember-500"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <PlasmaGlass className="p-12 text-center space-y-4">
          <DoorOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No rooms found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'Try clearing your search query.' : 'Register your first room or laboratory above.'}
          </p>
        </PlasmaGlass>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((r) => {
            const isBatchSelected = selectedRoomIds.includes(r.id);
            const homeroomClasses = classes.filter(c => c.roomId === r.id);
            const requiringSubjects = subjects.filter(s => s.specialRoomId === r.id);

            return (
              <PlasmaGlass
                key={r.id}
                hoverEffect
                className="p-4 transition-all border border-white/10 bg-[#161224]/70 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isBatchSelected}
                      onChange={() => toggleSelectRow(r.id)}
                      className="rounded border-white/20 bg-black/40 text-ember-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {r.name}
                      </h4>
                      <div className="text-[11px] text-amber-300 font-mono-code font-semibold">
                        {r.code}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateRoom(r.id)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(r)}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promptDelete(r)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">Type:</span>
                    <span className="text-slate-200 capitalize font-medium text-[11px]">
                      {r.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" /> Capacity:
                    </span>
                    <span className="text-slate-200 font-mono-code text-[11px]">
                      {r.capacity || 40} seats
                    </span>
                  </div>

                  {homeroomClasses.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-ember-400" /> Homeroom of:
                      </span>
                      <span className="text-amber-300 font-semibold text-[11px]">
                        {homeroomClasses.map(c => `${c.name}-${c.section}`).join(', ')}
                      </span>
                    </div>
                  )}

                  {requiringSubjects.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] flex items-center gap-1">
                        <FlaskConical className="w-3 h-3 text-purple-400" /> Required by:
                      </span>
                      <span className="text-purple-300 font-semibold text-[11px]">
                        {requiringSubjects.map(s => s.code).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </PlasmaGlass>
            );
          })}
        </div>
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <PlasmaGlass glow className="max-w-md w-full p-6 border-ember-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-ember-400" /> Edit Room Details
              </h3>
              <button onClick={() => setEditingRoom(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Room Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Code / Room # *</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 uppercase font-mono-code"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(parseInt(e.target.value, 10) || 40)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 font-mono-code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Facility Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as Room['type'])}
                  className="w-full px-3 py-2 rounded-xl bg-[#161224] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 capitalize"
                >
                  <option value="classroom">Classroom</option>
                  <option value="lab">Science Lab</option>
                  <option value="ground">Sports Ground / Court</option>
                  <option value="other">Library / Auditorium / Other</option>
                </select>
              </div>

              {editError && (
                <p className="text-xs text-red-400 font-medium">{editError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <MoltenButton type="button" size="sm" variant="ghost" onClick={() => setEditingRoom(null)}>
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

      {/* Delete Confirmation Modal */}
      <ReferentialWarningModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Room"
        entityName={deleteTarget ? `${deleteTarget.name} (${deleteTarget.code})` : ''}
        affectedCount={dependencyInfo.count}
        details={dependencyInfo.details}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
