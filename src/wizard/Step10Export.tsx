import React, { useState } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { PlasmaGlass } from '../components/PlasmaGlass';
import { MoltenButton } from '../components/MoltenButton';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Database, 
  Download, 
  CheckCircle2, 
  HelpCircle, 
  Upload, 
  Layers,
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  exportClassPdf, 
  exportAllClassesPdf, 
  exportAllTeachersPdf, 
  exportExcelWorkbook, 
  exportCsvTimetable, 
  exportProjectBackup, 
  importProjectBackup 
} from '../export';
import { Slot, TimetableVersion } from '../types';

export const Step10Export: React.FC = () => {
  const { project, selectedClassId, loadProject, setStep } = useTimetableStore();
  const { school, classes, teachers } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  // Active timetable version
  const activeVersion: TimetableVersion | undefined =
    project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
  const slots: Slot[] = activeVersion?.slots || [];

  // Export scope for PDF
  const [pdfScope, setPdfScope] = useState<'allClasses' | 'singleClass' | 'allTeachers'>('allClasses');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentClassId = selectedClassId || selectedClasses[0]?.id;
  const currentClassObj = classes.find((c) => c.id === currentClassId);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // 1. PDF Export Handler
  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      if (pdfScope === 'allClasses') {
        exportAllClassesPdf(project, slots);
        showNotification('Successfully exported Multi-Page All Classes PDF!');
      } else if (pdfScope === 'singleClass' && currentClassId) {
        exportClassPdf(project, currentClassId, slots);
        showNotification(`Successfully exported PDF for Class ${currentClassObj?.name}-${currentClassObj?.section}!`);
      } else if (pdfScope === 'allTeachers') {
        exportAllTeachersPdf(project, slots);
        showNotification('Successfully exported Multi-Page All Faculty Schedules PDF!');
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Excel Export Handler
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      await exportExcelWorkbook(project, slots);
      showNotification('Successfully generated & downloaded Multi-Sheet Excel Workbook (.xlsx)!');
    } catch (err) {
      console.error('Excel Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. CSV Export Handler
  const handleCsvExport = () => {
    try {
      exportCsvTimetable(project, slots);
      showNotification('Successfully downloaded UTF-8 BOM CSV Dataset!');
    } catch (err) {
      console.error('CSV Export Error:', err);
    }
  };

  // 4. JSON Backup Export
  const handleBackupExport = () => {
    try {
      exportProjectBackup(project);
      showNotification('Complete project snapshot exported as .chronoforge.json!');
    } catch (err) {
      console.error('Backup Export Error:', err);
    }
  };

  // 5. JSON Restore Handler
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const restored = await importProjectBackup(file);
      loadProject(restored);
      showNotification(`Restored project: ${restored.school.name} (${restored.classes.length} classes)!`);
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Invalid JSON file'}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* "Why we ask" Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs sm:text-sm">
        <HelpCircle className="w-5 h-5 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Direct Client-Side Downloads:</span> All files (PDF, Excel, CSV, JSON) are generated 100% inside your browser's memory without passing through any external servers. Click any export format to save it straight to your Downloads folder.
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Summary Stat Pill */}
      <PlasmaGlass className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/30 flex items-center justify-center text-amber-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Active Timetable Snapshot</h4>
            <p className="text-xs text-slate-400 font-mono-code">
              {school.name} • {selectedClasses.length} Cohorts • {teachers.length} Faculty • {slots.length} Slots
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MoltenButton
            size="sm"
            variant="glass"
            onClick={() => setStep(9)}
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
          >
            Back to Workspace
          </MoltenButton>
        </div>
      </PlasmaGlass>

      {/* Main Export Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: PDF Document */}
        <PlasmaGlass glow className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-300">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono-code px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                A4 Landscape
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Adobe PDF Timetable</h3>
              <p className="text-xs text-slate-400 mt-1">
                Official print-ready PDF with school branding, colored subject headers, room assignments, and page numbers.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-mono-code text-slate-300">Select Export Scope:</label>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
                  <input
                    type="radio"
                    name="pdfScope"
                    checked={pdfScope === 'allClasses'}
                    onChange={() => setPdfScope('allClasses')}
                    className="accent-ember-500"
                  />
                  <span>All Selected Classes ({selectedClasses.length} pages)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
                  <input
                    type="radio"
                    name="pdfScope"
                    checked={pdfScope === 'singleClass'}
                    onChange={() => setPdfScope('singleClass')}
                    className="accent-ember-500"
                  />
                  <span>
                    Current Class Only ({currentClassObj?.name} - {currentClassObj?.section})
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
                  <input
                    type="radio"
                    name="pdfScope"
                    checked={pdfScope === 'allTeachers'}
                    onChange={() => setPdfScope('allTeachers')}
                    className="accent-ember-500"
                  />
                  <span>All Faculty Schedules ({teachers.length} pages)</span>
                </label>
              </div>
            </div>
          </div>

          <MoltenButton
            onClick={handlePdfExport}
            disabled={isExporting}
            variant="molten"
            className="w-full mt-4"
            leftIcon={<Download className="w-4 h-4" />}
          >
            {isExporting ? 'Generating PDF...' : 'Download PDF Document'}
          </MoltenButton>
        </PlasmaGlass>

        {/* Card 2: Excel Workbook (.xlsx) */}
        <PlasmaGlass glow className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono-code px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                .xlsx Multi-Sheet
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Excel Master Workbook</h3>
              <p className="text-xs text-slate-400 mt-1">
                Multi-tab spreadsheet with Master Timetable, dedicated sheets for every class cohort, individual teacher sheets, and metrics breakdown.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs font-mono-code text-slate-300">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheet 1: Master School Timetable</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheets 2–{selectedClasses.length + 1}: Class-by-Class Schedules</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheets {selectedClasses.length + 2}–{selectedClasses.length + teachers.length + 1}: Faculty Workloads</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheet {selectedClasses.length + teachers.length + 2}: Summary Metrics & Load Audit</span>
              </div>
            </div>
          </div>

          <MoltenButton
            onClick={handleExcelExport}
            disabled={isExporting}
            variant="glass"
            className="w-full mt-4"
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            {isExporting ? 'Building Workbook...' : 'Download Multi-Sheet Excel'}
          </MoltenButton>
        </PlasmaGlass>

        {/* Card 3: Flat CSV */}
        <PlasmaGlass glow className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                <FileCode className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono-code px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                UTF-8 BOM (.csv)
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Flat CSV Dataset</h3>
              <p className="text-xs text-slate-400 mt-1">
                Raw timetable data with UTF-8 BOM encoding for seamless import into Excel, Google Sheets, or school management SIS software.
              </p>
            </div>

            <p className="text-xs text-slate-400 font-mono-code bg-white/5 p-3 rounded-xl border border-white/10">
              Columns: Class, Section, Room, Day, Period, StartTime, EndTime, SubjectCode, SubjectName, SubjectType, TeacherCode, TeacherName, IsLocked
            </p>
          </div>

          <MoltenButton
            onClick={handleCsvExport}
            variant="glass"
            className="w-full mt-4"
            leftIcon={<Download className="w-4 h-4 text-blue-400" />}
          >
            Download CSV Dataset
          </MoltenButton>
        </PlasmaGlass>

        {/* Card 4: Project JSON Backup & Restore */}
        <PlasmaGlass glow className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono-code px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                .chronoforge.json
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Project Backup & Restore</h3>
              <p className="text-xs text-slate-400 mt-1">
                Full JSON backup containing all school details, faculty availability, subject rules, and all 10 saved timetable versions.
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white cursor-pointer hover:bg-white/10 transition-colors">
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Import JSON Backup</span>
                <input
                  type="file"
                  accept=".json,.chronoforge.json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <MoltenButton
            onClick={handleBackupExport}
            variant="glass"
            className="w-full mt-4"
            leftIcon={<Download className="w-4 h-4 text-purple-400" />}
          >
            Export Complete Backup
          </MoltenButton>
        </PlasmaGlass>
      </div>
    </div>
  );
};
