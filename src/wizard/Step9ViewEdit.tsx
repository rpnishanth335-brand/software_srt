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
  Sparkles, 
  History, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { TimetableVersion, Slot } from '../types';

export const Step9ViewEdit: React.FC = () => {
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
    setStep,
    setTimetableVersion
  } = useTimetableStore();

  const { classes, teachers, rules } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  // Active timetable version
  const activeVersion: TimetableVersion | undefined =
    project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];

  const currentSlots: Slot[] = activeVersion?.slots || [];

  // Active Cohort ID
  const currentClassId = selectedClassId || selectedClasses[0]?.id || '';
  const currentTeacherId = selectedTeacherId || teachers[0]?.id || '';

  // Conflict state feedback for manual drag-and-drop
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);
  const [conflictSlotKeys, setConflictSlotKeys] = useState<Set<string>>(new Set());
  const [conflictReasonMap, setConflictReasonMap] = useState<Map<string, string>>(new Map());

  // Modal State
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Cohort navigation (prev / next)
  const currentClassIndex = selectedClasses.findIndex((c) => c.id === currentClassId);
  const handlePrevClass = () => {
    if (currentClassIndex > 0) {
      setSelectedClassId(selectedClasses[currentClassIndex - 1].id);
    }
  };
  const handleNextClass = () => {
    if (currentClassIndex < selectedClasses.length - 1) {
      setSelectedClassId(selectedClasses[currentClassIndex + 1].id);
    }
  };

  // Drag End Validator & Live Conflict Detection
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceSlot = active.data.current?.slot as Slot | undefined;
    const targetSlot = over.data.current?.slot as Slot | undefined;

    if (!sourceSlot || !targetSlot) return;

    // Disallow moving locked slots
    if (sourceSlot.locked) {
      setConflictBanner('Cannot move a pinned / locked slot.');
      return;
    }
    if (targetSlot.locked) {
      setConflictBanner('Target slot is pinned / locked and cannot be overwritten.');
      return;
    }

    // Live Hard Conflict Validation:
    // If moving sourceSlot (with teacher T) to targetSlot (day2, period2):
    // Check if teacher T is already teaching in ANY OTHER CLASS on (day2, period2)!
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

        setConflictBanner(msg);

        // Highlight conflicting target cell in red
        const targetKey = `${targetSlot.classId}:${targetSlot.day}:${targetSlot.period}`;
        setConflictSlotKeys(new Set([targetKey]));
        setConflictReasonMap(new Map([[targetKey, 'Teacher Clash']]));

        setTimeout(() => {
          setConflictBanner(null);
          setConflictSlotKeys(new Set());
          setConflictReasonMap(new Map());
        }, 4000);

        return; // REJECT CONFLICTING MOVE
      }

      // Check if teacher is blocked on target slot
      const teacherObj = teachers.find((t) => t.id === sourceSlot.teacherId);
      if (
        teacherObj &&
        teacherObj.blocked.some((b) => b.day === targetSlot.day && b.period === targetSlot.period) &&
        rules.hardRules.respectTeacherBlocked
      ) {
        const msg = `Conflict blocked: ${teacherObj.name} has marked this slot as BLOCKED in their availability grid.`;
        setConflictBanner(msg);
        return;
      }
    }

    // Move is valid! Apply swap
    setConflictBanner(null);
    moveOrSwapSlot(
      { classId: sourceSlot.classId, day: sourceSlot.day, period: sourceSlot.period },
      { classId: targetSlot.classId, day: targetSlot.day, period: targetSlot.period }
    );
  };

  const currentClassObj = selectedClasses.find((c) => c.id === currentClassId) || selectedClasses[0];

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Interactive Timetable Workspace:</span> View schedules by class cohort, teacher faculty, or full master grid. You can drag and drop cells to swap periods with live conflict prevention, pin/lock cells with the pin icon, and compare past saved runs.
        </div>
      </div>

      {/* Dynamic Conflict Alert Banner */}
      {conflictBanner && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs sm:text-sm flex items-center justify-between shadow-2xl animate-bounce">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-bold">{conflictBanner}</span>
          </div>
          <button
            onClick={() => setConflictBanner(null)}
            className="text-xs text-red-300 hover:text-white underline font-mono-code ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Toolbar & View Switcher */}
      <PlasmaGlass className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
            <button
              onClick={() => setActiveTab('byClass')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'byClass'
                  ? 'bg-gradient-to-r from-ember-600 to-ember-plasma text-white shadow-ember-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              By Class Cohort
            </button>

            <button
              onClick={() => setActiveTab('byTeacher')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'byTeacher'
                  ? 'bg-gradient-to-r from-ember-600 to-ember-plasma text-white shadow-ember-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              By Faculty Member
            </button>

            <button
              onClick={() => setActiveTab('master')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'master'
                  ? 'bg-gradient-to-r from-ember-600 to-ember-plasma text-white shadow-ember-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Master Grid
            </button>
          </div>

          {/* Controls: Undo/Redo, Versions, Export */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              title="Undo Move (Ctrl+Z)"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              title="Redo Move (Ctrl+Y)"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <MoltenButton
              size="sm"
              variant="glass"
              onClick={() => setShowVersionModal(true)}
              leftIcon={<History className="w-3.5 h-3.5 text-purple-400" />}
            >
              Versions ({project.timetables.length})
            </MoltenButton>

            <MoltenButton
              size="sm"
              variant="glass"
              onClick={() => setStep(8)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            >
              Re-Forge
            </MoltenButton>

            <MoltenButton
              size="sm"
              variant="molten"
              onClick={() => setStep(10)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export System
            </MoltenButton>
          </div>
        </div>

        {/* Sub-Header: Selectors per Tab */}
        {activeTab === 'byClass' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono-code text-slate-400">Class Cohort:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevClass}
                  disabled={currentClassIndex <= 0}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={currentClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-[#0b0a10] border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-300 focus:outline-none"
                >
                  {selectedClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} – {cls.section} ({cls.room || 'Room TBA'})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleNextClass}
                  disabled={currentClassIndex >= selectedClasses.length - 1}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-xs font-mono-code text-slate-400 flex items-center gap-3">
              <span>Homeroom: <strong className="text-slate-200">{currentClassObj?.room || 'None'}</strong></span>
              <span>•</span>
              <span>Hard Clashes: <strong className="text-emerald-400">0</strong></span>
            </div>
          </div>
        )}

        {activeTab === 'byTeacher' && (
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <span className="text-xs font-mono-code text-slate-400">Faculty Member:</span>
            <select
              value={currentTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="bg-[#0b0a10] border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-300 focus:outline-none"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code}) • Max {t.maxPerWeek} periods/wk
                </option>
              ))}
            </select>
          </div>
        )}
      </PlasmaGlass>

      {/* Grid Canvas with Drag & Drop Context */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {activeTab === 'byClass' && (
          <TimetableGridClass
            project={project}
            classId={currentClassId}
            slots={currentSlots}
            conflictSlotKeys={conflictSlotKeys}
            conflictReasonMap={conflictReasonMap}
            onToggleLock={toggleLockSlot}
          />
        )}

        {activeTab === 'byTeacher' && (
          <TimetableGridTeacher
            project={project}
            teacherId={currentTeacherId}
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
