# Architectural & Design Decisions Log

This document tracks technical decisions, sensible defaults, and trade-offs made during the design and development of **ChronoForge**.

---

### [ADR-001] Solver Architecture: CSP with Forward Checking + Simulated Annealing + Kempe Chains in Web Worker
- **Decision:** Execute the timetable solver in a dedicated Web Worker via Comlink. The solver uses a hybrid approach:
  1. MRV (Minimum Remaining Values) / Most-Constrained-First heuristic with forward checking for construction.
  2. Simulated annealing local search with Kempe-chain swap operators for soft-constraint optimization and plateau escaping.
  3. Targeted repair with an unsatisfiable-core extractor to pinpoint conflicting rules when unresolvable.
- **Rationale:** Timetabling is NP-hard. Pure backtracking fails on large schedules; pure annealing can get stuck in local minima with hard violations. Hybrid approach provides sub-10s execution for typical school loads while remaining deterministic via seeded PRNG.

---

### [ADR-002] Visual Theme: SVG-Filter Liquid Glass Refraction with Graceful Fallbacks
- **Decision:** Use an SVG filter pipeline (`feTurbulence`, `feDisplacementMap`, `feGaussianBlur`, `feColorMatrix`) with standard CSS backdrop blur as base, coupled with an HTML5 2D/WebGL canvas for embers.
- **Rationale:** Delivers the "Plasma Glass / Molten Glass Refraction" aesthetic. Fallback mode switches seamlessly to standard CSS glassmorphism when GPU performance or browser SVG backdrop support (e.g., specific Safari/Firefox versions) is degraded.

---

### [ADR-003] Storage & Offline Persistence: Dexie (IndexedDB) + Zustand Sync
- **Decision:** Primary application state is managed in a modular Zustand store, synced to IndexedDB using Dexie.
- **Rationale:** Ensures zero data loss, instant hot reload, offline availability, and the ability to manage multiple saved school projects simultaneously.

---

### [ADR-004] PDF Font & Unicode Support: Embedded Subsets
- **Decision:** Embed a clean Unicode font (such as Noto Sans / Roboto) in jsPDF to support multi-language teacher/student names (e.g., Tamil, Hindi, accented Latin) without character corruption.
- **Rationale:** School environments often use regional script names; standard Type 1 Helvetica fonts in jsPDF mangle non-Latin text.

---

### [ADR-005] Default Period & Timing Configuration
- **Decision:** Demo school defaults to 6 working days (Mon–Sat), 8 periods/day (Saturday 4 periods), 45-minute periods starting at 08:30 AM, with a 15-minute recess after Period 2 and a 40-minute lunch after Period 4.
- **Rationale:** Standard, realistic school schedule providing rich test constraints for double periods, morning preferences, and teacher availability.

---

### [ADR-006] Atomic Double-Period Slot Swapping in Simulated Annealing
- **Decision:** Double-period labs (2x consecutive periods) must occupy disjoint 2-slot blocks (e.g., 1-2, 5-6, 7-8) that never cross breaks (recess or lunch). The local search simulated annealing engine treats double periods as atomic 2-slot blocks during swap operations rather than single-slot moves.
- **Rationale:** Single-slot random swaps fractured consecutive pairs and caused excessive hard constraint penalties. Atomic 2-slot block swapping guarantees consecutive placement invariants throughout annealing.

---

### [ADR-007] Pigeonhole Math & Daily Teacher Load Balancing
- **Decision:** In a 6-day school schedule where Saturday has 4 periods, a teacher carrying 36 periods/week must teach 32 periods across the 5 standard weekdays ($32 \div 5 = 6.4$ periods/day). The feasibility calculator enforces that `maxPerDay` must be $\ge 7$ for such faculty members.
- **Rationale:** Mathematical pigeonhole principle. Setting `maxPerDay` to 6 for a 36-period teacher is provably impossible ($5 \times 6 + 4 = 34 < 36$).

---

### [ADR-008] Client-Side Multi-Format Export Architecture
- **Decision:** All export formats (Adobe PDF via `jspdf` + `jspdf-autotable`, Excel workbooks via `exceljs`, CSV with UTF-8 BOM, and JSON backup) run 100% in browser memory and trigger native downloads.
- **Rationale:** Ensures zero data leakage, works completely offline without backend infrastructure, and provides instant download speeds.

---

### [ADR-009] Local-First Optional AI Layer with Offline Heuristic Fallback
- **Decision:** The AI Assistant modal accepts optional Gemini / OpenAI keys stored in `localStorage`, but features an integrated offline heuristic parser that parses rules and explains schedules without requiring an internet connection or API key.
- **Rationale:** Strict adherence to privacy-first, zero-backend, 100% local operation while still enabling conversational interaction.

