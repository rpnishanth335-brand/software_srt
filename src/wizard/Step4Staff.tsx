import React, { useState } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  Users, 
  Plus, 
  Trash2, 
  Ban, 
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ID } from '../types';

export const Step4Staff: React.FC = () => {
  const { 
    project, 
    addTeacher, 
    deleteTeacher, 
    toggleTeacherBlocked 
  } = useTimetableStore();

  const { teachers, subjects, classes, school } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  // Active expanded teacher for unavailability matrix
  const [expandedTeacherId, setExpandedTeacherId] = useState<ID | null>(teachers[0]?.id || null);

  // New teacher form state
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<ID[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<ID[]>([]);
  const [maxPerDay, setMaxPerDay] = useState<number>(5);
  const [maxPerWeek, setMaxPerWeek] = useState<number>(26);
  const [maxConsecutive, setMaxConsecutive] = useState<number>(3);

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || selectedSubjects.length === 0) return;

    addTeacher({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      subjectIds: selectedSubjects,
      classIds: selectedClassIds.length > 0 ? selectedClassIds : selectedClasses.map((c) => c.id),
      maxPerDay,
      maxPerWeek,
      maxConsecutive,
      blocked: [],
    });

    setName('');
    setCode('');
    setSelectedSubjects([]);
    setSelectedClassIds([]);
  };

  const toggleSubjectSelect = (subId: ID) => {
    setSelectedSubjects((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleClassSelect = (clsId: ID) => {
    setSelectedClassIds((prev) =>
      prev.includes(clsId) ? prev.filter((id) => id !== clsId) : [...prev, clsId]
    );
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Why we ask this:</span> Teachers cannot be in two places at once. The unavailability grid allows teachers to block out staff meetings, part-time off-periods, or preferred days off. The solver strictly guarantees zero assignments during blocked periods.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ember-500/20 border border-ember-500/30 flex items-center justify-center text-ember-gold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Teaching Faculty ({teachers.length})</h2>
            <p className="text-xs text-slate-400">Configure subject capabilities, maximum weekly workloads, and availability blocks</p>
          </div>
        </div>
      </div>

      {/* Add New Teacher Form */}
      <PlasmaGlass className="p-6 space-y-4">
        <h3 className="text-xs font-mono-code text-ember-400 uppercase tracking-wider">
          Register Faculty Member
        </h3>

        <form onSubmit={handleAddTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Teacher Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Arthur Pendelton"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-ember-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Short Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. AP"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-ember-500 uppercase font-mono-code"
              />
            </div>

            <div className="flex items-center gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">Max/Day</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(parseInt(e.target.value, 10))}
                  className="w-16 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">Max/Wk</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={maxPerWeek}
                  onChange={(e) => setMaxPerWeek(parseInt(e.target.value, 10))}
                  className="w-16 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">Max Cons.</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={maxConsecutive}
                  onChange={(e) => setMaxConsecutive(parseInt(e.target.value, 10))}
                  className="w-16 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-center"
                />
              </div>
            </div>
          </div>

          {/* Subject Eligibility Multi-select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Subjects Taught (select all that apply) *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((sub) => {
                const isSelected = selectedSubjects.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubjectSelect(sub.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-ember-500 text-white border-amber-300 shadow-sm'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {sub.name} ({sub.code})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Class Cohorts Handled Multi-select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Cohorts Handled (leave blank to allow all selected classes)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {selectedClasses.map((cls) => {
                const isSelected = selectedClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => toggleClassSelect(cls.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {cls.name}-{cls.section}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <MoltenButton type="submit" size="sm" variant="molten" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Teacher
            </MoltenButton>
          </div>
        </form>
      </PlasmaGlass>

      {/* Teachers Directory & Unavailability Grid */}
      <div className="space-y-4">
        {teachers.map((tch) => {
          const isExpanded = expandedTeacherId === tch.id;
          const assignedSubjects = subjects.filter((s) => tch.subjectIds.includes(s.id));

          return (
            <PlasmaGlass key={tch.id} className="p-5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ember-500/30 to-purple-500/30 border border-white/15 flex items-center justify-center font-bold text-amber-300 font-mono-code">
                    {tch.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{tch.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono-code">
                        Max {tch.maxPerDay}/day • {tch.maxPerWeek}/week
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {assignedSubjects.map((s) => (
                        <span
                          key={s.id}
                          style={{ borderColor: s.color }}
                          className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border text-slate-300"
                        >
                          {s.code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MoltenButton
                    size="sm"
                    variant="glass"
                    onClick={() => setExpandedTeacherId(isExpanded ? null : tch.id)}
                    leftIcon={<Ban className="w-3.5 h-3.5 text-red-400" />}
                    rightIcon={isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  >
                    {tch.blocked.length > 0 ? `${tch.blocked.length} Blocked Slots` : 'Availability Grid'}
                  </MoltenButton>

                  <button
                    onClick={() => deleteTeacher(tch.id)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Click-to-Block Unavailability Matrix Drawer */}
              {isExpanded && (
                <div className="mt-5 pt-4 border-t border-white/10 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 font-mono-code">
                      <Ban className="w-3.5 h-3.5 text-red-400" />
                      Click any slot to toggle BLOCKED (red = teacher unavailable):
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono-code">
                      {tch.blocked.length} slots blocked
                    </span>
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="min-w-[480px]">
                      <div className="grid grid-cols-9 gap-1 text-center text-[10px] font-mono-code text-slate-400 mb-1">
                        <div>Day</div>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                          <div key={p}>P{p}</div>
                        ))}
                      </div>

                      {school.days.map((dayNum) => (
                        <div key={dayNum} className="grid grid-cols-9 gap-1 items-center mb-1">
                          <div className="text-[11px] font-bold text-slate-300 text-center font-mono-code">
                            {dayNames[dayNum]}
                          </div>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((periodNum) => {
                            const isWithinDayLimit = periodNum <= (school.periodsByDay[dayNum] || 8);
                            const isBlocked = tch.blocked.some(
                              (b) => b.day === dayNum && b.period === periodNum
                            );

                            if (!isWithinDayLimit) {
                              return <div key={periodNum} className="h-7 rounded bg-white/[0.02]" />;
                            }

                            return (
                              <button
                                key={periodNum}
                                type="button"
                                onClick={() => toggleTeacherBlocked(tch.id, dayNum, periodNum)}
                                className={`h-7 rounded text-[10px] font-mono-code font-bold transition-all border ${
                                  isBlocked
                                    ? 'bg-red-500/30 text-red-200 border-red-500/50 shadow-inner'
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:border-amber-400/50 hover:bg-white/10'
                                }`}
                              >
                                {isBlocked ? '✕' : 'FREE'}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </PlasmaGlass>
          );
        })}
      </div>
    </div>
  );
};
