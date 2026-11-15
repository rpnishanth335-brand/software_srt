# MASTER PROMPT — "ChronoForge": AI School Timetable Generator
> Paste this whole file into Antigravity (Planning mode) as the project brief. Save a copy in the repo root as `MASTER_PROMPT.md` and follow it phase by phase.

---

## 0. ROLE AND WORKING RULES

You are a senior full-stack engineer, constraint-solver specialist, and creative UI engineer. Build a complete, production-quality **School Timetable Generator** web app named **ChronoForge**.

Working rules:
1. **Plan first.** Produce an Implementation Plan artifact, a Task List, and an architecture diagram before writing code. Wait for my approval of the plan, then execute.
2. **Work in phases** (Section 12). Finish, test, and demo each phase (browser screenshot or recording artifact) before starting the next.
3. **Never fake the logic.** The timetable must come from a real solver, not hard-coded or random sample data.
4. **Everything must run locally and offline** (no backend required). Data stays in the browser (IndexedDB). Cloud AI is optional and off by default.
5. Write clean TypeScript (strict mode), small modules, JSDoc on public functions, and unit tests for the solver.
6. If a requirement is ambiguous, choose the sensible default, note it in `DECISIONS.md`, and continue. Don't stop to ask unless blocked.

---

## 1. PRODUCT GOAL

A school admin answers a short guided questionnaire (a wizard). The app then:
1. Calculates whether a valid timetable is even possible (feasibility math).
2. Generates a conflict-free timetable for **all selected classes** using a solver ("AI generator").
3. Lets the admin view the result **per class**, **per teacher**, and as a **master grid**.
4. Allows manual fixes with live conflict detection.
5. Exports to **PDF, Excel (.xlsx), and CSV** straight to the user's Downloads folder.

The UI must be visually stunning: **Plasma Glass / Molten Glass Refraction** (Section 9).

---

## 2. TECH STACK (fixed unless something is impossible)

| Area | Choice |
|---|---|
| Framework | React 18 + Vite + TypeScript (strict) |
| Styling | Tailwind CSS + CSS variables for theme tokens |
| State | Zustand (with `persist` middleware) |
| Storage | IndexedDB via Dexie (projects auto-saved, multiple school projects supported) |
| Solver | Custom TypeScript solver running in a **Web Worker** (Comlink for messaging) |
| Animation | Framer Motion (UI motion) + SVG filters + Canvas 2D/WebGL (fire effects) |
| Forms | React Hook Form + Zod validation |
| Export | `jspdf` + `jspdf-autotable` (PDF), `exceljs` or `xlsx` (Excel), native Blob (CSV) |
| Drag & drop | `@dnd-kit/core` |
| Testing | Vitest (solver and calculators), Playwright (wizard to export end-to-end flow) |
| Optional AI | Gemini/any LLM via user-provided API key, strictly optional (Section 7) |

---

## 3. THE WIZARD (QUESTIONNAIRE) — exact steps

Build a multi-step wizard with a progress rail, Back/Next, autosave on every change, and inline validation. Every step has a "why we ask" hint line. Allow loading a **demo school** (e.g., 8 classes, 12 teachers) with one click.

### Step 1 — School basics
- School name, academic year, optional logo upload (used in PDF header).
- **Working days per week:** numeric selector `1–7`. Then a day-picker (Mon…Sun chips) to choose *which* days (e.g., 5 = Mon–Fri, or 6 = Mon–Sat). Custom day names allowed.
- **Periods per day:** numeric stepper `1–12`. Option: different period counts on specific days (e.g., Saturday = 4 periods).
- Period timings: start time, duration per period, and breaks (short break / lunch) inserted after chosen period numbers. Auto-calculate each period's clock time.

### Step 2 — Classes
- Choose how to add: quick generator (e.g., "Grades 1–10, Sections A–C") or manual add.
- A **multi-select grid of classes** with checkboxes + "Select all". Only *selected* classes are included in generation.
- Per class: name, section, room (optional), class teacher (optional, filled after Step 4).

### Step 3 — Subjects
- Subject name, short code, color tag, type (Theory / Lab / Sports / Activity).
- Flags: `requiresDoublePeriod` (consecutive 2 periods), `preferMorning`, `maxPerDay`, `needsSpecialRoom` (lab/ground).
- Import subject list from CSV.

### Step 4 — Staff (Teachers)
- Teacher name, short code, employee ID (optional).
- **Subjects handled** (multi-select).
- **Classes handled** (multi-select, restricted to selected classes).
- Limits: max periods/day, max periods/week, max consecutive periods.
- **Unavailability grid** (day × period click-to-block) and "preferred off day".

### Step 5 — Assignment matrix (the core data)
A table: **rows = selected classes, columns = subjects**. Each cell holds:
- Periods per week for that subject in that class (number, 0 = not taught).
- Assigned teacher (dropdown filtered to teachers who can teach that subject and class).
- Auto-fill helper: "Suggest teacher by lowest load".
- Live **row total** vs available slots, with red/amber/green status.

### Step 6 — Rules and preferences
Hard rules (never violated) and soft rules (optimized with weights, adjustable by sliders):
- Hard: no teacher in two places at once; no class has two subjects at once; respect teacher unavailability; respect max/day and max/week; fill every period (no free periods unless allowed); double-period subjects must be consecutive and not cross a break.
- Soft: spread a subject evenly across the week (not the same subject twice per day unless needed); heavy subjects in the morning; minimize teacher gaps; limit consecutive periods of the same teacher; keep same subject at a consistent period across days; avoid first/last period for a given teacher; keep Sports/Activity at last periods.
- Toggle: allow free periods (library/study) and how many.

### Step 7 — Feasibility report (the "calculate everything" step)
Run the calculator BEFORE the solver and show a clear report:
- Total slots per class = `workingDays × periodsPerDay`; required periods per class = sum of assigned subject periods. Flag mismatch (over or under).
- Per teacher: required periods/week vs max/week vs available (non-blocked) slots.
- Per subject: total weekly demand; teacher capacity pool.
- Special-room/lab collisions (two classes needing the single lab at once).
- Pigeonhole checks (e.g., 3 classes need teacher T in the same limited slots).
- Output: **errors (blocking)**, **warnings**, and **actionable fix suggestions** ("Class 8-A has 38 periods required but only 35 slots: reduce Maths by 3 or add a period on Saturday").
- Generate button is disabled until there are zero blocking errors.

### Step 8 — Generate
- Select classes to generate (all or subset), seed (for reproducibility), quality mode (Fast / Balanced / Best).
- Show live progress: phase, iterations, conflicts remaining, soft-score trend sparkline, Cancel button.
- On finish: summary card (hard conflicts = 0, soft score, time taken).

### Step 9 — View and edit
- Tabs: **By Class**, **By Teacher**, **Master Grid**.
- Class selector (dropdown + prev/next arrows). Each cell shows subject (colored) + teacher short code + room.
- Drag-and-drop cells to swap/move; instantly validate, highlight conflicts in red, show what rule broke, offer Undo/Redo.
- Lock a cell (pin) so re-generation keeps it. "Regenerate unlocked only" button.
- Compare versions (keep up to 10 saved versions with timestamps and score).

### Step 10 — Export
See Section 8.

---

## 4. DATA MODEL (TypeScript)

```ts
type ID = string;
interface Project { id: ID; school: School; classes: ClassRoom[]; subjects: Subject[]; teachers: Teacher[]; assignments: Assignment[]; rules: RuleConfig; timetables: TimetableVersion[]; updatedAt: number; }
interface School { name: string; year: string; logo?: string; days: number[]; /*0-6*/ periodsByDay: Record<number, number>; periodTimes: PeriodTime[]; breaks: Break[]; }
interface ClassRoom { id: ID; name: string; section: string; selected: boolean; room?: string; classTeacherId?: ID; }
interface Subject { id: ID; name: string; code: string; color: string; type: 'theory'|'lab'|'sports'|'activity'; doublePeriod: boolean; maxPerDay: number; preferMorning: boolean; specialRoomId?: ID; }
interface Teacher { id: ID; name: string; code: string; subjectIds: ID[]; classIds: ID[]; maxPerDay: number; maxPerWeek: number; maxConsecutive: number; blocked: Array<{day:number; period:number}>; }
interface Assignment { classId: ID; subjectId: ID; teacherId: ID; periodsPerWeek: number; }
interface Slot { classId: ID; day: number; period: number; subjectId: ID | null; teacherId: ID | null; locked: boolean; }
interface TimetableVersion { id: ID; createdAt: number; seed: number; slots: Slot[]; hardConflicts: number; softScore: number; }
```

---

## 5. SOLVER DESIGN (the "AI" generator)

Implement in `/src/solver/` and run in a Web Worker. Must be deterministic for a given seed.

1. **Model as a CSP:** variables = (class, day, period); domain = (subject, teacher) pairs from assignments; hard constraints as above.
2. **Phase A — Construction:** order "lessons" by difficulty (double periods, scarce teachers, labs first = most-constrained-first). Place with constraint propagation + backtracking (forward checking).
3. **Phase B — Optimization:** simulated annealing / min-conflicts local search with moves: swap two slots in a class, swap a teacher's two slots across classes, move a lesson to another day. Cost = `hardWeight * hardViolations + Σ softWeight_i * softViolation_i`. Reheat on stagnation.
4. **Phase C — Repair:** if hard violations remain, run targeted repair (Kempe-chain style swaps), then report unsatisfiable core ("which rules conflict") instead of failing silently.
5. Respect **locked slots** as fixed assignments.
6. Report progress every ~100 ms via worker messages; support cancellation.
7. **Performance targets:** 20 classes × 6 days × 8 periods solved in < 10 s in Balanced mode on a normal laptop; UI never freezes.
8. Unit tests: known-feasible tiny instances, known-infeasible instances (must return a clear explanation), double-period placement, teacher unavailability, lock preservation, seed reproducibility.

---

## 6. CALCULATION MODULE (`/src/calc/`)

Pure functions, fully unit-tested, used by Step 5 live totals and Step 7 report:
- `slotsPerClass()`, `requiredPerClass()`, `teacherLoad()`, `teacherCapacity()`, `subjectDemand()`, `roomContention()`, `pigeonholeChecks()`, `suggestFixes()`.
- Return structured results `{severity, code, message, affected[], suggestion}` — never just strings.

---

## 7. OPTIONAL AI ASSISTANT LAYER (off by default)

Settings page with an optional API key field (stored locally only). When enabled:
- **Natural-language rules:** "Mrs. Priya shouldn't teach after lunch on Fridays" → parsed into structured constraints, shown for confirmation before applying.
- **Explain conflicts:** plain-language explanation of why a generation failed and what to change.
- **Smart suggestions** on the feasibility report.
The app must be fully functional without this layer. Never send data anywhere unless the user enables it, and show what will be sent.

---

## 8. EXPORT SYSTEM

Export dialog with checkboxes: **what** (selected classes / all classes / selected teachers / master grid) and **format**. Files download directly through the browser to the Downloads folder with clean names like `ChronoForge_<School>_<Class>_<YYYY-MM-DD>.pdf`.

- **PDF:** A4 landscape, school logo + name + academic year header, one page per class (and per teacher if chosen), color-coded subject cells, period times in the left column, legend of subject→teacher at the bottom, page footer with generated date. Include an "All classes in one PDF" and "separate PDF per class (zipped)" option. Support Unicode names (embed a Unicode font such as Noto Sans so Tamil and other scripts render correctly).
- **Excel (.xlsx):** One sheet per class + a Master sheet + Teachers sheet + Summary sheet; styled headers, merged title rows, cell fill colors matching subjects, frozen header row, auto column widths, print-ready page setup.
- **CSV:** Flat, tool-friendly format: `Class,Day,Period,StartTime,EndTime,Subject,Teacher,Room` (UTF-8 with BOM so Excel opens it correctly), plus an optional per-class CSV zip.
- **Import/backup:** Export/Import the whole project as `.chronoforge.json`.
- Show a success toast with a "Open downloads" hint, and handle errors gracefully.

---

## 9. VISUAL DESIGN — "PLASMA GLASS" (Liquid Glass Refraction + Fire)

Concept: UI surfaces are curved, translucent glass lenses that bend the light behind them, with living plasma and flame trapped inside and around them. Dark, cinematic base (deep charcoal/obsidian #0b0a10 with warm ember gradients).

**Required effects (all must be implemented):**
1. **Liquid glass refraction:** Cards, buttons, modals, nav use a glass material: `backdrop-filter: blur() saturate()` plus an SVG filter (`feTurbulence` + `feDisplacementMap`) so the background visibly bends at edges like a thick lens. Add specular highlights (top-left inner highlight, bottom-right soft shadow) and slight chromatic aberration on edges (offset R/G/B channels).
2. **Thermal refraction (heat haze):** Content behind glass wavers upward like heat over asphalt. Animate `feTurbulence` `baseFrequency`/`seed` slowly and scale displacement subtly (2–6 px) so text stays readable.
3. **Ember rim lighting:** The inner border of each glass element glows white-gold to electric orange via an animated `conic-gradient` / mask border; intensity flickers randomly like flame light (use noise-driven keyframes, not a uniform pulse). Hover increases heat; focus shows a bright ring.
4. **Molten droplet merging (gooey):** Pills, chips, and adjacent buttons use an SVG goo filter (`feGaussianBlur` + `feColorMatrix` threshold) so they stretch like lava when close, then snap together with a soft amber flash. Used for the wizard progress rail, day-picker chips, tab switcher, and the sliding active-tab indicator.
5. **Fire particles:** A canvas/WebGL layer renders rising embers and sparks around primary buttons and behind the hero; embers brighten as they pass through glass. Generate button during solving becomes a "forge": swirling plasma inside the lens, with intensity tied to solver progress (more heat = lower conflict count).
6. **Page transitions:** Wizard steps transition with a molten wipe/refraction ripple from the clicked button.
7. **Timetable grid:** Cells are small glass tiles tinted by subject color; dragging a tile lifts it with refraction + glowing trail; invalid drops flash red-hot with a shake.

**Performance and accessibility (mandatory):**
- Respect `prefers-reduced-motion` (static glow, no haze/particles).
- Auto-detect low-end devices / low FPS and degrade effects gracefully (Quality toggle: High / Medium / Low in Settings).
- Keep animation at 60 fps on mid laptops; use `will-change`, GPU layers, offscreen canvas, and cap particle counts.
- Text contrast meets WCAG AA over all glass surfaces; effects must never reduce legibility of timetable data.
- Provide a provided fallback (plain frosted glass) for browsers lacking SVG-filter-in-backdrop support (e.g., Firefox/Safari).
- Provide a light "Daylight Glass" theme variant and a printer-friendly view with no effects.

Create a reusable `<PlasmaGlass>` component, `<MoltenButton>`, `<GooGroup>`, `<EmberCanvas>`, and a `useHeatHaze()` hook, plus a `/design` Storybook-style page showing every component.

---

## 10. UX DETAILS
- Fully responsive (desktop first, tablet OK, mobile view-only for timetables).
- Keyboard accessible, ARIA labels, focus states.
- Friendly empty states, undo/redo everywhere, autosave indicator, unsaved-change guard.
- Localization-ready (i18n files; ship English now, structure ready for Tamil/Hindi).
- Onboarding tooltip tour on first run.

---

## 11. PROJECT STRUCTURE
```
/src
  /app            routes, layout
  /wizard         step components (Step1…Step10)
  /components     PlasmaGlass, MoltenButton, GooGroup, EmberCanvas, TimetableGrid
  /solver         csp.ts, construct.ts, anneal.ts, repair.ts, worker.ts, cost.ts
  /calc           feasibility + load calculators
  /export         pdf.ts, excel.ts, csv.ts, backup.ts
  /store          zustand slices, dexie db
  /ai             optional LLM adapters
  /theme          tokens, svg-filters.tsx
  /tests          unit + e2e
DECISIONS.md  README.md  MASTER_PROMPT.md
```

---

## 12. PHASES AND ACCEPTANCE CRITERIA

**Phase 1 — Foundation:** project scaffold, theme tokens, PlasmaGlass components, design page. ✅ Glass + haze + ember rim + goo visible in browser.
**Phase 2 — Wizard and data:** Steps 1–6 with validation, autosave, demo data, assignment matrix with live totals. ✅ Reload keeps all data.
**Phase 3 — Calculator:** Step 7 feasibility report. ✅ Unit tests pass; infeasible demo shows correct fix suggestions.
**Phase 4 — Solver:** worker, construction, annealing, repair, locking, progress. ✅ Demo school (8 classes × 6 days × 8 periods) solves with 0 hard conflicts in < 10 s; tests pass.
**Phase 5 — Views and editing:** by class / teacher / master, drag-and-drop, conflict highlighting, versions. ✅ Manual conflicting move is blocked and explained.
**Phase 6 — Export:** PDF, Excel, CSV, backup. ✅ Files open correctly in PDF reader / Excel / Google Sheets; Unicode names render.
**Phase 7 — Polish:** optional AI layer, performance modes, reduced-motion, a11y audit, README. ✅ Lighthouse Performance ≥ 85, Accessibility ≥ 95.
**Phase 8 — E2E:** Playwright test: full wizard → generate → switch classes → export all three formats.

Definition of Done: `npm run dev` works, `npm test` is green, `npm run build` succeeds, README explains setup, and a recorded walkthrough artifact shows the full flow.

---

## 13. FIRST ACTION
Start now: read this file fully, then output (1) the Implementation Plan, (2) the Task List by phase, (3) the architecture diagram, and (4) a list of any risks or assumptions. Do NOT start coding until I approve the plan.
