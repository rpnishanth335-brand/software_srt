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
  HelpCircle, 
  Upload, 
  Flame
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

export const ExportPage: React.FC = () => {
  const { project, selectedClassId, loadProject, setCurrentRoute, addToast } = useTimetableStore();
  const { classes, teachers } = project;
  const selectedClasses = classes.filter((c) => c.selected);

  const activeVersion: TimetableVersion | undefined =
    project.timetables.find((t) => t.id === project.currentVersionId) || project.timetables[0];
  const slots: Slot[] = activeVersion?.slots || [];

  const [pdfScope, setPdfScope] = useState<'allClasses' | 'singleClass' | 'allTeachers'>('allClasses');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const currentClassId = selectedClassId || selectedClasses[0]?.id;
  const currentClassObj = classes.find((c) => c.id === currentClassId);

  // PDF Export Handler
  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      if (pdfScope === 'allClasses') {
        exportAllClassesPdf(project, slots);
        addToast('Successfully exported Multi-Page All Classes PDF!', 'success');
      } else if (pdfScope === 'singleClass' && currentClassId) {
        exportClassPdf(project, currentClassId, slots);
        addToast(`Successfully exported PDF for ${currentClassObj?.name}-${currentClassObj?.section}!`, 'success');
      } else if (pdfScope === 'allTeachers') {
        exportAllTeachersPdf(project, slots);
        addToast('Successfully exported Faculty Schedules PDF booklet!', 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to generate PDF export.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Excel (.xlsx) Export Handler
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      await exportExcelWorkbook(project, slots);
      addToast('Multi-sheet Excel Workbook (.xlsx) generated and downloaded!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Excel export failed.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // CSV Export Handler
  const handleCsvExport = () => {
    try {
      exportCsvTimetable(project, slots);
      addToast('Flat CSV Timetable data downloaded.', 'success');
    } catch (err) {
      console.error(err);
      addToast('CSV export failed.', 'error');
    }
  };

  // JSON Project Snapshot Backup
  const handleBackupExport = () => {
    try {
      exportProjectBackup(project);
      addToast('Full Project Backup (.chronoforge.json) saved to Downloads!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Backup export failed.', 'error');
    }
  };

  // Import Backup JSON
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importProjectBackup(file);
      loadProject(imported);
      addToast(`Restored project: ${imported.school.name}`, 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to restore project', 'error');
    }
    e.target.value = '';
  };

  const hasTimetable = slots.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ember-500/20 border border-ember-500/40 flex items-center justify-center text-ember-gold shadow-ember-glow">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Export Center &amp; Output Formats
            </h1>
            <p className="text-xs text-slate-400">
              Generate publication-grade PDF booklets, styled Excel sheets, and flat SIS data
            </p>
          </div>
        </div>
      </div>

      {/* Why We Ask Hint */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-ember-500/10 border border-ember-500/20 text-ember-200 text-xs">
        <HelpCircle className="w-4 h-4 text-ember-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Direct client downloads:</span> ChronoForge runs 100% in your browser. All PDF rendering, Excel XML authoring, and CSV file blobs are generated locally and downloaded straight to your computer without sending school data to any remote server.
        </div>
      </div>

      {!hasTimetable && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-white">No Timetable Generated Yet:</span> Timetable exports (PDF, Excel, CSV) require an active generated schedule. You can still export project data backups or go to the Generator to synthesize your timetable.
          </div>
          <MoltenButton
            size="sm"
            variant="molten"
            onClick={() => setCurrentRoute('generate')}
            leftIcon={<Flame className="w-3.5 h-3.5" />}
          >
            Go to Generator
          </MoltenButton>
        </div>
      )}

      {/* Grid of 4 Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. PDF Export */}
        <PlasmaGlass glow={hasTimetable} className="p-6 border-white/10 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Publication PDF Timetables</h3>
                <p className="text-xs text-slate-400">Printable landscape vector tables with school crest</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-[11px] font-semibold text-slate-300">Document Scope:</label>
              <div className="space-y-1.5 text-xs text-slate-300">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/40 cursor-pointer border border-white/5">
                  <input
                    type="radio"
                    name="pdfScope"
                    value="allClasses"
                    checked={pdfScope === 'allClasses'}
                    onChange={() => setPdfScope('allClasses')}
                    className="accent-amber-500"
                  />
                  <span>Complete Student Booklet (1 page per class)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/40 cursor-pointer border border-white/5">
                  <input
                    type="radio"
                    name="pdfScope"
                    value="singleClass"
                    checked={pdfScope === 'singleClass'}
                    onChange={() => setPdfScope('singleClass')}
                    className="accent-amber-500"
                  />
                  <span>Single Class ({currentClassObj ? `${currentClassObj.name}-${currentClassObj.section}` : 'Selected'})</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/40 cursor-pointer border border-white/5">
                  <input
                    type="radio"
                    name="pdfScope"
                    value="allTeachers"
                    checked={pdfScope === 'allTeachers'}
                    onChange={() => setPdfScope('allTeachers')}
                    className="accent-amber-500"
                  />
                  <span>Faculty Master Booklet ({teachers.length} teachers)</span>
                </label>
              </div>
            </div>
          </div>

          <MoltenButton
            size="md"
            variant="molten"
            disabled={!hasTimetable || isExporting}
            onClick={handlePdfExport}
            leftIcon={<Download className="w-4 h-4" />}
            className="w-full justify-center"
          >
            {isExporting ? 'Generating PDF...' : 'Download PDF Booklet'}
          </MoltenButton>
        </PlasmaGlass>

        {/* 2. Excel (.xlsx) Export */}
        <PlasmaGlass glow={hasTimetable} className="p-6 border-white/10 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Multi-Sheet Excel Workbook</h3>
                <p className="text-xs text-slate-400">Master grid, class tabs, and teacher summary matrices</p>
              </div>
            </div>

            <ul className="text-xs text-slate-400 space-y-1.5 pt-2 list-disc list-inside">
              <li>Sheet 1: Master Institution Grid (Day × Period × Class)</li>
              <li>Sheet 2: Faculty Workload Summary and Hours Audit</li>
              <li>Sheets 3–N: Formatted individual class schedules with subject codes</li>
            </ul>
          </div>

          <MoltenButton
            size="md"
            variant="glass"
            disabled={!hasTimetable || isExporting}
            onClick={handleExcelExport}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
            className="w-full justify-center"
          >
            Download Excel (.xlsx)
          </MoltenButton>
        </PlasmaGlass>

        {/* 3. CSV Timetable Export */}
        <PlasmaGlass glow={hasTimetable} className="p-6 border-white/10 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Flat CSV Data File</h3>
                <p className="text-xs text-slate-400">Standard tabular format for Student Information Systems (SIS)</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              Exports slot assignments in standard comma-separated format: Class, Day, Period, Subject Code, Teacher Code, Room Code.
            </p>
          </div>

          <MoltenButton
            size="md"
            variant="glass"
            disabled={!hasTimetable}
            onClick={handleCsvExport}
            leftIcon={<Download className="w-4 h-4 text-blue-400" />}
            className="w-full justify-center"
          >
            Download Flat CSV
          </MoltenButton>
        </PlasmaGlass>

        {/* 4. Full Project JSON Backup & Restore */}
        <PlasmaGlass className="p-6 border-white/10 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Full Project Backup &amp; Restore</h3>
                <p className="text-xs text-slate-400">Portable JSON file preserving school config, staff, and versions</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              Save your complete project snapshot or transfer your configuration to another browser.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MoltenButton
              size="md"
              variant="glass"
              onClick={handleBackupExport}
              leftIcon={<Download className="w-4 h-4 text-purple-400" />}
              className="justify-center"
            >
              Export JSON
            </MoltenButton>

            <label className="cursor-pointer">
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              <span className="w-full h-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors">
                <Upload className="w-4 h-4" /> Restore JSON
              </span>
            </label>
          </div>
        </PlasmaGlass>
      </div>
    </div>
  );
};
