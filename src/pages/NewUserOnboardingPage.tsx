import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useTimetableStore } from '../store/useTimetableStore';
import { ChronoForgeLogo } from '../components/ChronoForgeLogo';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Coffee, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { Break, PeriodTime } from '../types';

interface NewUserOnboardingPageProps {
  onComplete: () => void;
}

const DAYS_OF_WEEK = [
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
];

export const NewUserOnboardingPage: React.FC<NewUserOnboardingPageProps> = ({ onComplete }) => {
  const { user, signOut } = useAuth();
  const { project, completeOnboarding } = useTimetableStore();

  const [schoolName, setSchoolName] = useState(
    project.school.name && project.school.name !== 'ChronoForge High School' 
      ? project.school.name 
      : ''
  );
  const [academicYear, setAcademicYear] = useState(project.school.year || '2025–2026');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    project.school.days && project.school.days.length > 0 ? project.school.days : [1, 2, 3, 4, 5]
  );
  const [periodsPerDay, setPeriodsPerDay] = useState<number>(7);
  const [startTime, setStartTime] = useState<string>('08:30');
  const [periodDuration, setPeriodDuration] = useState<number>(45);

  const [breaks, setBreaks] = useState<Break[]>([
    { id: 'b1', name: 'Morning Recess', afterPeriod: 2, durationMinutes: 15 },
    { id: 'b2', name: 'Lunch Break', afterPeriod: 4, durationMinutes: 40 },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle day selection
  const handleToggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length <= 1) return; // Must have at least 1 day
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  // Helper to recompute period clock times based on start time, duration, and breaks
  const calculatePeriodTimes = (start: string, duration: number, activeBreaks: Break[], maxPeriods: number): PeriodTime[] => {
    const [startH, startM] = start.split(':').map(Number);
    let currentMinutes = (startH || 8) * 60 + (startM || 30);
    const times: PeriodTime[] = [];

    const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    for (let p = 1; p <= maxPeriods; p++) {
      const pStart = currentMinutes;
      const pEnd = currentMinutes + duration;

      times.push({
        period: p,
        startTime: formatTime(pStart),
        endTime: formatTime(pEnd),
        durationMinutes: duration,
      });

      currentMinutes = pEnd;

      const brk = activeBreaks.find((b) => b.afterPeriod === p);
      if (brk) {
        currentMinutes += brk.durationMinutes;
      }
    }

    return times;
  };

  // Handle preset selections
  const applyPreset = (preset: 'standard5' | 'extended6') => {
    if (preset === 'standard5') {
      setSelectedDays([1, 2, 3, 4, 5]);
      setPeriodsPerDay(7);
      setStartTime('08:30');
      setPeriodDuration(45);
      setBreaks([
        { id: 'b1', name: 'Morning Recess', afterPeriod: 2, durationMinutes: 15 },
        { id: 'b2', name: 'Lunch Break', afterPeriod: 4, durationMinutes: 40 },
      ]);
    } else {
      setSelectedDays([1, 2, 3, 4, 5, 6]);
      setPeriodsPerDay(8);
      setStartTime('08:00');
      setPeriodDuration(40);
      setBreaks([
        { id: 'b1', name: 'Morning Break', afterPeriod: 2, durationMinutes: 15 },
        { id: 'b2', name: 'Lunch', afterPeriod: 4, durationMinutes: 45 },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = schoolName.trim();

    if (!cleanName) {
      setError('Please enter your School or Institution name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Compute period counts by day
    const periodsByDay: Record<number, number> = {};
    selectedDays.forEach((d) => {
      periodsByDay[d] = periodsPerDay;
    });

    const periodTimes = calculatePeriodTimes(startTime, periodDuration, breaks, periodsPerDay);

    // Commit to Timetable Store
    completeOnboarding({
      name: cleanName,
      year: academicYear.trim() || '2025–2026',
      academicYear: academicYear.trim() || '2025–2026',
      days: selectedDays,
      periodsByDay,
      periodTimes,
      breaks,
      isConfigured: true,
    });

    // Mark user onboarding complete in localStorage
    if (user?.uid) {
      localStorage.setItem(`chronoforge_onboarded_${user.uid}`, 'true');
    }

    // Enter full web page
    onComplete();
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#080612] text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full border-b border-white/10 bg-[#0c0a17]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between z-20">
        <ChronoForgeLogo size="sm" subtitle="INSTITUTION SETUP" />

        {/* User Info & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-amber-500/40" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                {user?.displayName?.[0] || 'U'}
              </div>
            )}
            <span className="font-semibold text-slate-200 hidden sm:inline max-w-[140px] truncate">
              {user?.displayName || user?.email}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="p-2 rounded-xl text-slate-400 hover:text-red-300 hover:bg-white/5 transition-colors text-xs flex items-center gap-1.5"
            title="Sign out and switch accounts"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative z-10">
        {/* Ambient Plasma Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-3xl bg-[#100d1e]/95 border border-white/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl relative">
          {/* Welcome Banner */}
          <div className="text-center space-y-2 pb-6 border-b border-white/10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>New Institution Onboarding</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Welcome, {user?.displayName?.split(' ')[0] || 'Administrator'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Before entering your master timetable workspace, configure your school's foundational structure. These parameters calibrate the AI constraint solver for your daily schedule.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="pt-5 pb-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Quick Institution Presets:</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset('standard5')}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
              >
                Standard 5-Day (Mon–Fri, 7 Periods)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('extended6')}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
              >
                Comprehensive 6-Day (Mon–Sat, 8 Periods)
              </button>
            </div>
          </div>

          {/* Setup Form */}
          <form onSubmit={handleSubmit} className="py-4 space-y-6">
            {/* Step 1: School Identity */}
            <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <span>1. Institution Identity</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    School / Institution Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => {
                      setSchoolName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. St. Xavier's International School"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs sm:text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Academic Year / Term
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2025–2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Working Days */}
            <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>2. Weekly Working Days</span>
              </h2>

              <p className="text-xs text-slate-400">
                Select the days classes operate at your institution:
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day.day);
                  return (
                    <button
                      key={day.day}
                      type="button"
                      onClick={() => handleToggleDay(day.day)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm'
                          : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{day.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Daily Timing & Periods */}
            <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>3. Daily Schedule & Period Duration</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Periods per Day
                  </label>
                  <select
                    value={periodsPerDay}
                    onChange={(e) => setPeriodsPerDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                  >
                    {[5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num} className="bg-[#141022]">
                        {num} Periods / Day
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    School Starts At
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Period Duration
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={30}
                      max={90}
                      step={5}
                      value={periodDuration}
                      onChange={(e) => setPeriodDuration(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 shrink-0">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Breaks Configuration */}
            <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Coffee className="w-3.5 h-3.5" />
                <span>4. Recess & Lunch Breaks</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {breaks.map((brk) => (
                  <div key={brk.id} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{brk.name}</span>
                      <span className="text-[11px] font-mono-code text-amber-300">
                        After Period {brk.afterPeriod}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Duration: <strong className="text-slate-200">{brk.durationMinutes} minutes</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submission Area */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Your configuration will be saved securely in browser IndexedDB.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl font-bold text-sm text-slate-900 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 hover:from-amber-300 hover:to-amber-100 shadow-ember-glow flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>Save School & Enter ChronoForge ERP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
