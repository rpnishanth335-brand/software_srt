import React, { useState } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Coffee, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  HelpCircle,
  Check
} from 'lucide-react';
import { Break, PeriodTime } from '../types';

const DAYS_OF_WEEK = [
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
  { day: 0, name: 'Sunday', short: 'Sun' },
];

export const Step1SchoolBasics: React.FC = () => {
  const { project, updateSchool, setWorkingDays, setPeriodsForDay } = useTimetableStore();
  const { school } = project;

  const [startTime, setStartTime] = useState<string>('08:30');
  const [periodDuration, setPeriodDuration] = useState<number>(45);

  // Helper to recompute period clock times based on start time, duration, and breaks
  const recalculateTimes = (start: string, duration: number, breaks: Break[], maxPeriods: number) => {
    const [startH, startM] = start.split(':').map(Number);
    let currentMinutes = (startH || 8) * 60 + (startM || 30);
    const calculated: PeriodTime[] = [];

    for (let p = 1; p <= maxPeriods; p++) {
      const pStart = currentMinutes;
      const pEnd = currentMinutes + duration;

      const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      };

      calculated.push({
        period: p,
        startTime: formatTime(pStart),
        endTime: formatTime(pEnd),
        durationMinutes: duration,
      });

      currentMinutes = pEnd;

      // Add break minutes if a break follows period p
      const breakAfter = breaks.find((b) => b.afterPeriod === p);
      if (breakAfter) {
        currentMinutes += breakAfter.durationMinutes;
      }
    }

    updateSchool({ periodTimes: calculated });
  };

  const handleDayToggle = (dayNum: number) => {
    let nextDays = [...school.days];
    if (nextDays.includes(dayNum)) {
      if (nextDays.length > 1) {
        nextDays = nextDays.filter((d) => d !== dayNum);
      }
    } else {
      nextDays.push(dayNum);
    }
    setWorkingDays(nextDays);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateSchool({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBreak = () => {
    const newBreak: Break = {
      id: `break-${Date.now()}`,
      name: 'Break',
      afterPeriod: 2,
      durationMinutes: 15,
    };
    const nextBreaks = [...school.breaks, newBreak];
    updateSchool({ breaks: nextBreaks });
    recalculateTimes(startTime, periodDuration, nextBreaks, 8);
  };

  const handleRemoveBreak = (id: string) => {
    const nextBreaks = school.breaks.filter((b) => b.id !== id);
    updateSchool({ breaks: nextBreaks });
    recalculateTimes(startTime, periodDuration, nextBreaks, 8);
  };

  const handleBreakChange = (id: string, updates: Partial<Break>) => {
    const nextBreaks = school.breaks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    updateSchool({ breaks: nextBreaks });
    recalculateTimes(startTime, periodDuration, nextBreaks, 8);
  };

  // Max period count across any day
  const maxDayPeriods = Math.max(...Object.values(school.periodsByDay), 8);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Why we ask this:</span> The school calendar, working days, and period timing structure define the mathematical slot matrix. The solver ensures double periods do not span across break times and that period clock times render with precision in PDF exports.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Institution Details */}
        <PlasmaGlass className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-ember-500/20 border border-ember-500/30 flex items-center justify-center text-ember-gold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Institution Profile</h2>
              <p className="text-xs text-slate-400">School identity for headers and exports</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                School / Institution Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={school.name}
                onChange={(e) => updateSchool({ name: e.target.value })}
                placeholder="e.g. St. Jude International Academy"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Academic Year <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={school.year}
                onChange={(e) => updateSchool({ year: e.target.value })}
                placeholder="e.g. 2026–2027"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                School Emblem / Logo (Optional, used in PDF headers)
              </label>
              <div className="flex items-center gap-4">
                {school.logo ? (
                  <div className="relative w-16 h-16 rounded-xl border border-white/20 overflow-hidden bg-black/40 flex items-center justify-center">
                    <img src={school.logo} alt="School Logo" className="w-full h-full object-contain p-1" />
                    <button
                      onClick={() => updateSchool({ logo: undefined })}
                      className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/15 rounded-xl hover:border-ember-500/50 hover:bg-white/5 cursor-pointer transition-all">
                    <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-400">Click to upload logo PNG/JPG</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>
        </PlasmaGlass>

        {/* Section 2: Working Days & Periods */}
        <PlasmaGlass className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-ember-500/20 border border-ember-500/30 flex items-center justify-center text-ember-gold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Working Days Schedule</h2>
              <p className="text-xs text-slate-400">Select active days and daily period counts</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Active Days of the Week ({school.days.length} Days Active)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const isActive = school.days.includes(d.day);
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => handleDayToggle(d.day)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center border ${
                        isActive
                          ? 'bg-gradient-to-b from-ember-500 to-ember-600 text-white border-amber-300/40 shadow-ember-glow'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div>{d.short}</div>
                      {isActive && <Check className="w-3 h-3 mx-auto mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Periods Per Day */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-300">
                Periods Configured per Day (1–12)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {school.days.map((d) => {
                  const dayObj = DAYS_OF_WEEK.find((x) => x.day === d);
                  const count = school.periodsByDay[d] || 8;
                  return (
                    <div key={d} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-xs font-medium text-slate-300">{dayObj?.name}</span>
                      <select
                        value={count}
                        onChange={(e) => setPeriodsForDay(d, parseInt(e.target.value, 10))}
                        className="bg-[#0b0a10] border border-white/20 rounded-lg px-2 py-1 text-xs text-ember-300 font-bold focus:outline-none"
                      >
                        {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                          <option key={num} value={num}>
                            {num} periods
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </PlasmaGlass>
      </div>

      {/* Section 3: Period Timing & Breaks */}
      <PlasmaGlass className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ember-500/20 border border-ember-500/30 flex items-center justify-center text-ember-gold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Period Timings &amp; Break Schedule</h2>
              <p className="text-xs text-slate-400">Recess, Lunch, and clock time computation</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Start Time:</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  recalculateTimes(e.target.value, periodDuration, school.breaks, maxDayPeriods);
                }}
                className="bg-white/5 border border-white/15 px-2.5 py-1 rounded-lg text-ember-300 font-mono-code focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Duration:</span>
              <select
                value={periodDuration}
                onChange={(e) => {
                  const d = parseInt(e.target.value, 10);
                  setPeriodDuration(d);
                  recalculateTimes(startTime, d, school.breaks, maxDayPeriods);
                }}
                className="bg-white/5 border border-white/15 px-2 py-1 rounded-lg text-ember-300 font-mono-code focus:outline-none"
              >
                <option value={40}>40 mins</option>
                <option value={45}>45 mins</option>
                <option value={50}>50 mins</option>
                <option value={60}>60 mins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Breaks Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-amber-400" />
              Configured Breaks
            </span>
            <MoltenButton size="sm" variant="glass" onClick={handleAddBreak} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Break
            </MoltenButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {school.breaks.map((b) => (
              <div key={b.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={b.name}
                      onChange={(e) => handleBreakChange(b.id, { name: e.target.value })}
                      className="bg-transparent border-b border-white/20 text-xs font-bold text-white focus:outline-none focus:border-ember-400 w-28"
                    />
                    <span className="text-[11px] text-slate-400">after Period</span>
                    <select
                      value={b.afterPeriod}
                      onChange={(e) => handleBreakChange(b.id, { afterPeriod: parseInt(e.target.value, 10) })}
                      className="bg-[#0b0a10] border border-white/20 rounded px-1.5 py-0.5 text-xs text-amber-300"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                        <option key={p} value={p}>P{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Duration:</span>
                    <select
                      value={b.durationMinutes}
                      onChange={(e) => handleBreakChange(b.id, { durationMinutes: parseInt(e.target.value, 10) })}
                      className="bg-[#0b0a10] border border-white/20 rounded px-1.5 py-0.5 text-xs text-slate-200"
                    >
                      <option value={10}>10 mins</option>
                      <option value={15}>15 mins</option>
                      <option value={20}>20 mins</option>
                      <option value={30}>30 mins</option>
                      <option value={40}>40 mins</option>
                      <option value={45}>45 mins</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveBreak(b.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Calculated Period Timeline Preview */}
        <div className="pt-4 border-t border-white/10">
          <label className="block text-xs font-mono-code text-slate-400 uppercase tracking-wider mb-3">
            Computed Clock Timeline (Monday Preview)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {(school.periodTimes || []).slice(0, school.periodsByDay[1] || 8).map((pt) => {
              const breakAfter = school.breaks.find((b) => b.afterPeriod === pt.period);
              return (
                <div key={pt.period} className="relative">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-xs font-bold text-amber-400 font-mono-code">P{pt.period}</div>
                    <div className="text-[11px] text-slate-200 mt-1 font-mono-code">{pt.startTime}</div>
                    <div className="text-[10px] text-slate-400 font-mono-code">{pt.endTime}</div>
                  </div>
                  {breakAfter && (
                    <div className="mt-1 text-[9px] font-bold text-center text-amber-300/80 bg-amber-500/10 rounded py-0.5 border border-amber-500/20">
                      ☕ {breakAfter.name} ({breakAfter.durationMinutes}m)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </PlasmaGlass>
    </div>
  );
};
