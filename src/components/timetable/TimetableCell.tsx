import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Lock, Unlock, GripVertical, AlertCircle } from 'lucide-react';
import { Slot, Subject, Teacher } from '../../types';

interface TimetableCellProps {
  slot: Slot;
  subject?: Subject;
  teacher?: Teacher;
  isConflict?: boolean;
  conflictReason?: string;
  onToggleLock: () => void;
  isDragging?: boolean;
}

export const TimetableCell: React.FC<TimetableCellProps> = ({
  slot,
  subject,
  teacher,
  isConflict = false,
  conflictReason,
  onToggleLock,
}) => {
  const cellId = `${slot.classId}:${slot.day}:${slot.period}`;

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `drag-${cellId}`,
    data: { slot },
    disabled: slot.locked || !slot.subjectId,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${cellId}`,
    data: { slot },
  });

  // Combine drag and drop refs
  const setCombinedRef = (el: HTMLElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  if (!slot.subjectId) {
    // Empty / Free slot
    return (
      <div
        ref={setCombinedRef}
        className={`h-24 p-2 rounded-xl border border-dashed transition-all flex flex-col items-center justify-center text-center select-none ${
          isOver
            ? 'border-ember-400 bg-ember-500/20 scale-[1.02]'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        }`}
      >
        <span className="text-[11px] font-mono-code text-slate-500">Free Period</span>
      </div>
    );
  }

  const bgColor = subject?.color ? `${subject.color}25` : 'rgba(255, 255, 255, 0.08)';
  const borderColor = subject?.color || 'rgba(255, 255, 255, 0.2)';

  return (
    <div
      ref={setCombinedRef}
      tabIndex={0}
      role="gridcell"
      aria-label={`${subject?.name || 'Subject'} on Day ${slot.day} Period ${slot.period}${slot.locked ? ' (Pinned)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggleLock();
        }
      }}
      style={{
        ...style,
        backgroundColor: isConflict ? 'rgba(239, 68, 68, 0.25)' : bgColor,
        borderColor: isConflict ? '#ef4444' : isOver ? '#ffb703' : borderColor,
      }}
      className={`relative h-24 p-2.5 rounded-xl border transition-all duration-200 select-none flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-amber-400 ${
        isDragging
          ? 'opacity-40 scale-105 shadow-2xl ring-2 ring-ember-400'
          : isOver
          ? 'scale-[1.03] shadow-ember-glow ring-2 ring-amber-400'
          : 'shadow-glass-specular hover:shadow-glass-hover hover:-translate-y-0.5'
      } ${isConflict ? 'animate-pulse border-red-500 ring-2 ring-red-500/50' : ''}`}
    >
      {/* Top Header: Code & Lock Toggle */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          {!slot.locked && (
            <span
              {...listeners}
              {...attributes}
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-white"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>
          )}
          <span
            style={{ color: isConflict ? '#fca5a5' : subject?.color || '#fff' }}
            className="text-xs font-extrabold tracking-wide truncate font-mono-code"
          >
            {subject?.code || 'SUB'}
          </span>
          {slot.isDoublePeriodPart && (
            <span className="text-[9px] font-mono-code px-1 rounded bg-purple-500/30 text-purple-200 font-bold">
              2X
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleLock}
          title={slot.locked ? 'Slot is Pinned/Locked (Solver preserves this)' : 'Lock slot to pin'}
          className={`p-1 rounded transition-colors ${
            slot.locked
              ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30'
              : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-200'
          }`}
        >
          {slot.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>
      </div>

      {/* Middle: Subject Full Name */}
      <div className="text-[11px] font-semibold text-slate-100 truncate mt-0.5">
        {subject?.name || 'Subject'}
      </div>

      {/* Bottom Footer: Teacher & Room */}
      <div className="flex items-center justify-between text-[10px] font-mono-code pt-1 border-t border-white/10 text-slate-300">
        <span className="font-bold text-amber-200 truncate" title={teacher?.name}>
          {teacher?.code || 'TBA'}
        </span>
        <span className="text-slate-400 truncate">
          {subject?.specialRoomId || 'Homeroom'}
        </span>
      </div>

      {/* Conflict Reason Overlay Tooltip */}
      {isConflict && conflictReason && (
        <div className="absolute -top-7 left-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg flex items-center gap-1 z-30">
          <AlertCircle className="w-3 h-3" />
          <span className="truncate">{conflictReason}</span>
        </div>
      )}
    </div>
  );
};
