import React, { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { useTimetableStore } from '../store/useTimetableStore';
import { TimetableGridClass } from '../components/timetable/TimetableGridClass';
import { TimetableGridTeacher } from '../components/timetable/TimetableGridTeacher';
import { TimetableGridMaster } from '../components/timetable/TimetableGridMaster';
import { VersionHistoryModal } from '../components/timetable/VersionHistoryModal';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  GraduationCap, 
  Users, 
  Grid3X3, 
  Undo2, 
  Redo2, 
  History, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  CalendarDays,
  Flame
} from 'lucide-react';
import { TimetableVersion, Slot } from '../types';

export const ViewerPage: React.FC = () => {
  const { 
    project, 
    activeTab, 
    setActiveTab, 
    selectedClassId, 
    setSelectedClassId, 
    selectedTeacherId, 
    setSelectedTeacherId, 
    moveOrSwapSlot, 
    toggleLockSlot, 
    undo, 
    redo, 
    undoStack, 
    redoStack, 
    setCurrentRoute,
    setTimetableVersion,
    addToast
  } = useTimetableStore();

  const { classes, teachers, rules } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  const activeVersion: TimetableVersion | undefined =
    project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];

  const currentSlots: Slot[] = activeVersion?.slots || [];

  const effectiveClassId = selectedClassId || selectedClasses[0]?.id || '';
  const effectiveTeacherId = selectedTeacherId || teachers[0]?.id || '';

  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);
  const [conflictSlotKeys, setConflictSlotKeys] = useState<Set<string>>(new Set());
  const [conflictReasonMap, setConflictReasonMap] = useState<Map<string, string>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceSlot = active.data.current?.slot as Slot | undefined;
    const targetSlot = over.data.current?.slot as Slot | undefined;

    if (!sourceSlot || !targetSlot) return;

    if (sourceSlot.locked) {
      setConflictAlert('Cannot move a pinned / locked slot.');
      addToast('Cannot move a pinned / locked slot.', 'warning');
      return;
    }
    if (targetSlot.locked) {
      setConflictAlert('Target slot is locked.');
      addToast('Target slot is locked.', 'warning');
      return;
    }

    if (sourceSlot.teacherId) {
      const isTeacherClash = currentSlots.some((s) => {
        return (
          s.classId !== sourceSlot.classId &&
          s.day === targetSlot.day &&
          s.period === targetSlot.period &&
          s.teacherId === sourceSlot.teacherId
        );
      });

      if (isTeacherClash && rules.hardRules.noTeacherClash) {
        const teacherObj = teachers.find((t) => t.id === sourceSlot.teacherId);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const msg = `Conflict blocked: ${teacherObj?.name || 'Teacher'} (${teacherObj?.code}) is already teaching another class on ${dayNames[targetSlot.day]} Period ${targetSlot.period}!`;
        setConflictAlert(msg);
        addToast(msg, 'error');

        const targetKey = `${targetSlot.classId}:${targetSlot.day}:${targetSlot.period}`;
        setConflictSlotKeys(new Set([targetKey]));
        setConflictReasonMap(new Map([[targetKey, 'Teacher Clash']]));

        setTimeout(() => {
          setConflictAlert(null);
          setConflictSlotKeys(new Set());
          setConflictReasonMap(new Map());
        }, 4000);
        return;
      }

      const teacherObj = teachers.find((t) => t.id === sourceSlot.teacherId);
      if (
        teacherObj &&
        teacherObj.blocked.some((b) => b.day === targetSlot.day && b.period === targetSlot.period) &&
        rules.hardRules.respectTeacherBlocked
      ) {
        const msg = `Conflict blocked: ${teacherObj.name} is marked as BLOCKED in availability on that slot.`;
        setConflictAlert(msg);
        addToast(msg, 'error');
        return;
      }
    }

    setConflictAlert(null);
    moveOrSwapSlot(
      { classId: sourceSlot.classId, day: sourceSlot.day, period: sourceSlot.period },
      { classId: targetSlot.classId, day: targetSlot.day, period: targetSlot.period }
    );
    addToast('Period repositioned.', 'info');
  };

  const handleClassNav = (direction: 'prev' | 'next') => {
    const currentIndex = selectedClasses.findIndex((c) => c.id === effectiveClassId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % selectedClasses.length
      : (currentIndex - 1 + selectedClasses.length) % selectedClasses.length;
    setSelectedClassId(selectedClasses[newIndex].id);
  };

  const handleTeacherNav = (direction: 'prev' | 'next') => {
    const currentIndex = teachers.findIndex((t) => t.id === effectiveTeacherId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % teachers.length
      : (currentIndex - 1 + teachers.length) % teachers.length;
    setSelectedTeacherId(teachers[newIndex].id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Timetable Viewer &amp; Interactive Editor
            </h1>
            <p className="text-xs text-slate-400">
              {activeVersion ? (activeVersion.name || 'Current Timetable') : 'No schedule generated yet'} • {currentSlots.length} active lesson blocks
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className={`p-1.5 rounded-lg transition-colors ${
                undoStack.length > 0 ? 'text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Undo manual edit (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className={`p-1.5 rounded-lg transition-colors ${
                redoStack.length > 0 ? 'text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'
              }`}
              title="Redo manual edit (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => setShowVersionModal(true)}
            leftIcon={<History className="w-4 h-4 text-purple-400" />}
          >
            Versions ({project.timetables.length})
          </MoltenButton>

          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => setCurrentRoute('export')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Center
          </MoltenButton>
        </div>
      </div>

      {/* If No Timetable has been generated yet */}
      {currentSlots.length === 0 ? (
        <PlasmaGlass className="p-12 text-center space-y-4">
          <CalendarDays className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Timetable Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Run the AI generator from the Generate tab to synthesize an initial conflict-free schedule.
          </p>
          <MoltenButton
            size="md"
            variant="molten"
            onClick={() => setCurrentRoute('generate')}
            leftIcon={<Flame className="w-4 h-4" />}
          >
            Go to Generator
          </MoltenButton>
        </PlasmaGlass>
      ) : (
        <>
          {/* Conflict Toast Notification */}
          {conflictAlert && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs animate-shake">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{conflictAlert}</span>
              </div>
              <button onClick={() => setConflictAlert(null)} className="text-red-300 hover:text-white text-xs">
                Dismiss
              </button>
            </div>
          )}

          {/* View Tab Selector & Entity Pager */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* View Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
              <button
                onClick={() => setActiveTab('byClass')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'byClass'
                    ? 'bg-amber-500 text-white shadow-ember-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> By Class
              </button>

              <button
                onClick={() => setActiveTab('byTeacher')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'byTeacher'
                    ? 'bg-amber-500 text-white shadow-ember-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> By Teacher
              </button>

              <button
                onClick={() => setActiveTab('master')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'master'
                    ? 'bg-amber-500 text-white shadow-ember-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" /> Master Grid
              </button>
            </div>

            {/* Entity Selectors (Class / Teacher) */}
            {activeTab === 'byClass' && selectedClasses.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClassNav('prev')}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  title="Previous Class"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={effectiveClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#161224] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  {selectedClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} – {cls.section} ({cls.room || 'No Room'})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleClassNav('next')}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  title="Next Class"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeTab === 'byTeacher' && teachers.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTeacherNav('prev')}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  title="Previous Faculty"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={effectiveTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#161224] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleTeacherNav('next')}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  title="Next Faculty"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* DnD Context & Grid Rendering */}
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            {activeTab === 'byClass' && effectiveClassId && (
              <TimetableGridClass
                project={project}
                classId={effectiveClassId}
                slots={currentSlots}
                conflictSlotKeys={conflictSlotKeys}
                conflictReasonMap={conflictReasonMap}
                onToggleLock={toggleLockSlot}
              />
            )}

            {activeTab === 'byTeacher' && effectiveTeacherId && (
              <TimetableGridTeacher
                project={project}
                teacherId={effectiveTeacherId}
                slots={currentSlots}
              />
            )}

            {activeTab === 'master' && (
              <TimetableGridMaster
                project={project}
                slots={currentSlots}
              />
            )}
          </DndContext>
        </>
      )}

      {/* Version History Modal */}
      {showVersionModal && (
        <VersionHistoryModal
          project={project}
          currentVersionId={project.currentVersionId}
          onSelectVersion={setTimetableVersion}
          onClose={() => setShowVersionModal(false)}
        />
      )}
    </div>
  );
};
