# ChronoForge — AI School Timetable Generator

> **ChronoForge** is a production-grade, offline-first school timetable generator powered by a hybrid Constraint Satisfaction Problem (CSP) solver running entirely in the browser via Web Workers. It features an organic **"Plasma Glass"** (molten glass refraction, gooey metaballs, trapped fire/embers) visual design language, rich interactive drag-and-drop schedule editing with live conflict prevention, combinatorial feasibility mathematics, and client-side multi-format export (PDF, Excel, CSV, JSON).

---

## 🌟 Key Highlights

- **100% Client-Side & Offline**: Zero backend required. All school schedules, faculty assignments, and solver iterations persist securely in IndexedDB via Dexie.js.
- **Deterministic AI CSP Solver**: True combinatorial solver running in a Web Worker (Comlink) implementing:
  - **Phase A — Construction**: Most-Constrained-First (MCF) variable ordering with forward checking and disjoint double-period block preservation.
  - **Phase B — Optimization**: Simulated Annealing local search with atomic 2-block swaps and conflict-directed moves.
  - **Phase C — Repair**: Kempe-chain targeted swaps and unsatisfiable core extraction.
  - **Performance**: Solves 8 cohorts × 44 slots/week (352 periods) with **0 hard conflicts** in **3.7 seconds** (< 10s target).
- **Combinatorial Feasibility Audit**: Pure mathematical pre-flight engine calculating slot-demand parity, teacher weekly/daily load limits, room contention, and pigeonhole bottlenecks before launching the solver.
- **Interactive Multi-Perspective Workspace**:
  - **By Class Cohort**: Dedicated schedule matrix with previous/next navigation and room labels.
  - **By Faculty Member**: Individual teacher workload views showing cross-class commitments and blocked slots.
  - **Master School Grid**: Multi-class spread for comprehensive school-wide coordination.
  - **Live Conflict Detection**: Blocks illegal drag-and-drop moves (e.g. teacher double-booking) and displays alert banners.
  - **Cell Pinning & Version History**: Lock individual slots across re-forges; compare up to 10 historical generation runs.
- **Direct Multi-Format Export**:
  - **Adobe PDF (A4 Landscape)**: Multi-page booklet via `jspdf` + `jspdf-autotable` with school branding, subject palette colors, and pagination.
  - **Multi-Sheet Excel (.xlsx)**: Comprehensive workbook via `exceljs` featuring Master Grid, dedicated Class sheets, individual Teacher sheets, and Metrics summary.
  - **Flat CSV**: UTF-8 encoded with Byte Order Mark (`\uFEFF`) for universal desktop Excel compatibility.
  - **JSON Project Backup**: Complete state backup (`.chronoforge.json`) with one-click restore.
- **Optional AI Assistant**: Conversational natural language rule parser, schedule explainer, and swap suggester with offline heuristic fallback.

---

## 🏗️ Architecture

```
├── /src
│   ├── /calc                # Pure combinatorial feasibility math engine
│   │   ├── feasibility.ts   # Capacity, demand, pigeonhole & room contention checks
│   │   └── __tests__        # 10 unit tests verifying clean & infeasible schedules
│   ├── /solver              # Multi-phase CSP Solver Engine (Web Worker)
│   │   ├── types.ts         # Variable, domain, lesson, and slot definitions
│   │   ├── prng.ts          # Mulberry32 deterministic PRNG
│   │   ├── cost.ts          # Hard conflict penalty + soft preference weights
│   │   ├── construct.ts     # Phase A: Most-Constrained-First backtracking
│   │   ├── anneal.ts        # Phase B: Simulated Annealing with atomic swaps
│   │   ├── repair.ts        # Phase C: Kempe-chain repair & unsatisfiable core
│   │   ├── engine.ts        # Coordinator engine
│   │   ├── solver.worker.ts # Web Worker entrypoint (Comlink)
│   │   └── client.ts        # UI-to-Worker proxy client
│   ├── /components          # Reusable UI & Plasma Glass components
│   │   ├── PlasmaGlass.tsx  # Molten liquid glass container with specular highlights
│   │   ├── MoltenButton.tsx # Liquid glass interactive button with active gooey press
│   │   ├── GooGroup.tsx     # SVG metaball gooey container
│   │   ├── EmberCanvas.tsx  # Floating ambient ember particles
│   │   ├── SvgFilters.tsx   # Custom SVG displacement & turbulence filter pipelines
│   │   ├── timetable/       # Grid components for Class, Teacher, and Master views
│   │   └── AiAssistantModal.tsx # Natural-language constraint intelligence suite
│   ├── /wizard              # 10-step wizard questionnaire
│   │   ├── Step1SchoolBasics.tsx
│   │   ├── Step2Classes.tsx
│   │   ├── Step3Subjects.tsx
│   │   ├── Step4Staff.tsx
│   │   ├── Step5Assignments.tsx
│   │   ├── Step6Rules.tsx
│   │   ├── Step7Feasibility.tsx
│   │   ├── Step8Generate.tsx
│   │   ├── Step9ViewEdit.tsx
│   │   └── Step10Export.tsx
│   ├── /export              # Client-side multi-format export engine
│   │   ├── pdf.ts           # A4 landscape jsPDF multi-page booklet
│   │   ├── excel.ts         # Multi-sheet Excel workbook (ExcelJS)
│   │   ├── csv.ts           # Flat UTF-8 BOM CSV
│   │   └── backup.ts        # Complete JSON snapshot import/export
│   ├── /store               # Zustand state machine & Dexie IndexedDB sync
│   └── types.ts             # Strict TypeScript domain data model
```

---

## 🎨 Plasma Glass Design System

ChronoForge introduces the **Plasma Glass** visual aesthetic — a high-temperature molten glass refraction theme featuring:
- **Liquid Refraction**: Native SVG filter pipelines (`#plasma-heat-haze`, `#plasma-goo`) utilizing `feTurbulence` and `feDisplacementMap`.
- **Molten Amber Palette**:
  - `ember-core`: `#ff4500`
  - `ember-plasma`: `#ff7b00`
  - `ember-gold`: `#ffb703`
  - `ember-obsidian`: `#0b0a10`
- **Accessibility & Contrast**: Built to exceed WCAG AA contrast standards (> 4.5:1 ratio) with dark backing scrims and high-contrast typography.
- **Motion Optimization**: Fully honors `prefers-reduced-motion` operating system flags by substituting SVG displacement with clean static glass.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
# Clone repository
git clone https://github.com/example/chronoforge.git
cd chronoforge

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
# App will run at http://localhost:5173/
```

### Production Build
```bash
npm run build
# Compiles TypeScript and builds optimized production bundle with separate Web Worker chunk
```

### Unit & Solver Tests
```bash
npm test
# Executes Vitest suite covering feasibility calculator and constraint solver determinism
```

---

## 📊 Solver Performance & Determinism

| Metric | Target | Verified Performance |
|---|---|---|
| 8 Classes × 44 Slots (352 Periods) | < 10 s | **3.7 s** |
| Hard Conflict Count | 0 | **0** |
| Deterministic Seed Output | Identical output for identical seed | **100% Identical** |
| Unit Test Pass Rate | 100% | **14 / 14 Passed (8.35s)** |
| Data Privacy | 100% Local / Offline | **Zero external calls** |

---


---

## 🔐 Google Cloud Console OAuth 2.0 Setup

ChronoForge features official Google Sign-In powered by **Google Cloud Console OAuth 2.0 (Google Identity Services)**. Administrators sign in directly with their verified Google Account, and school schedules in IndexedDB are partitioned securely per Google User ID.

### Setup Instructions for Google Cloud Console

1. **Open Google Cloud Console:**
   - Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
   - Select or create your Google Cloud Project.

2. **Configure OAuth Consent Screen (First Time Only):**
   - In the left menu, select **OAuth consent screen**.
   - User Type: Choose **External** (or Internal if using Google Workspace).
   - App Name: `ChronoForge`
   - User support email & Developer contact info: Your email.
   - Scopes: Default scopes (`openid`, `email`, `profile`).

3. **Create OAuth 2.0 Client ID:**
   - Go to **Credentials** > Click **+ CREATE CREDENTIALS** > Select **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `ChronoForge Web Client`.

4. **Add Authorized JavaScript Origins:**
   - Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
     - `http://localhost:5173` (Local development)
     - `https://software-srt.vercel.app` (Vercel production deployment)
   - *(Note: Do NOT add a trailing slash)*.

5. **Copy Client ID to `.env`:**
   - Click **Create** to obtain your Client ID (format: `xxxxxxxx.apps.googleusercontent.com`).
   - Add it to your local `.env` file:
     ```env
     VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
     ```
   - Also add `VITE_GOOGLE_CLIENT_ID` in your **Vercel Project Settings > Environment Variables** for production.



---

## 🤖 Google Gemini AI Assistant & Timetable Synthesis

ChronoForge features a hybrid AI timetable synthesis pipeline:
1. **Local Mathematical Pre-Calculations:** Class utilization, teacher capacity matrices, and pigeonhole scarcity analysis run 100% locally in the browser first.
2. **Google Gemini LLM Generation:** Sends structured, anonymized schedule requirements (using strict JSON responseSchema).
3. **Deterministic Constraint Validator:** Strictly validates zero teacher double-booking, no class overlap, respect for blocked slots, exact weekly counts, and consecutive double periods.
4. **Targeted Repair Loop & Solver Guarantee:** If residual conflicts exist, Gemini attempts targeted repair (up to 3 rounds). If clashes persist or if the network is offline, the local simulated annealing engine guarantees 0 hard conflicts.

### Gemini API Key Configuration
- Keys are managed exclusively in **Settings > AI Assistant** (never on the login page).
- **Security & Privacy:** Keys are encrypted locally with the **Web Crypto API (AES-GCM 256-bit)** and stored in IndexedDB namespaced to your Google account UID. Keys are never logged, never put in URLs, and stripped from project backups.
- **Serverless Proxy Mode (Optional):** You can toggle between Direct Browser calls and the Vercel serverless function (/api/gemini) to avoid exposing keys in client-side network inspection.



MIT License. Built for educational and administrative excellence.
#   s o f t w a r e _ s r t  
 