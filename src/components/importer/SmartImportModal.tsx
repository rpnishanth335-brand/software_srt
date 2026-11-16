import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { MoltenButton } from '../MoltenButton';
import { PlasmaGlass } from '../PlasmaGlass';
import { useTimetableStore } from '../../store/useTimetableStore';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { 
  ImportTargetEntity, 
  RawParsedWorkbook, 
  ColumnMappingItem, 
  CleanedStaffRow, 
  CleanedSubjectRow,
  NewSubjectSuggestion, 
  ImportExecutionResult 
} from '../../services/importer/types';
import { parseFileToWorkbook, getSheetData } from '../../services/importer/fileParser';
import { autoMapColumns, saveUserMapping } from '../../services/importer/columnMapper';
import { cleanAndValidateStaffRows, cleanAndValidateSubjectRows } from '../../services/importer/dataCleaner';
import { downloadStaffTemplate, downloadSubjectsTemplate } from '../../services/importer/templateGenerator';
import { Teacher, Subject } from '../../types';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: ImportTargetEntity;
  onImportComplete?: (result: ImportExecutionResult) => void;
}

export const SmartImportModal: React.FC<SmartImportModalProps> = ({
  isOpen,
  onClose,
  entity = 'staff',
  onImportComplete,
}) => {
  const { project, addTeacher, addSubject, deleteTeacher, deleteSubject, deleteClass, addToast } = useTimetableStore();
  const { teachers, subjects } = project;

  // Wizard Step: 1 = Upload, 2 = Mapping, 3 = Review, 4 = Result
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<RawParsedWorkbook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2: Mapping State
  const [mappings, setMappings] = useState<ColumnMappingItem[]>([]);
  const [headerRowIdx, setHeaderRowIdx] = useState<number>(0);
  const [rememberMapping, setRememberMapping] = useState<boolean>(true);

  // Step 3: Review & Clean State
  const [cleanedStaff, setCleanedStaff] = useState<CleanedStaffRow[]>([]);
  const [cleanedSubjects, setCleanedSubjects] = useState<CleanedSubjectRow[]>([]);
  const [newSubjectSuggestions, setNewSubjectSuggestions] = useState<NewSubjectSuggestion[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'warning' | 'error' | 'duplicate'>('all');
  const [duplicateApplyAll, setDuplicateApplyAll] = useState<'skip' | 'update' | 'new'>('skip');

  // Step 4: Result State
  const [importResult, setImportResult] = useState<ImportExecutionResult | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setRawFile(null);
      setWorkbook(null);
      setSelectedSheet('');
      setUploadError(null);
      setMappings([]);
      setCleanedStaff([]);
      setCleanedSubjects([]);
      setNewSubjectSuggestions([]);
      setImportResult(null);
      setIsCommitting(false);
    }
  }, [isOpen]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
    e.target.value = '';
  };

  const processSelectedFile = async (file: File) => {
    setIsParsing(true);
    setUploadError(null);
    try {
      const parsedWb = await parseFileToWorkbook(file);
      setRawFile(file);
      setWorkbook(parsedWb);
      setSelectedSheet(parsedWb.selectedSheetName);
      setHeaderRowIdx(parsedWb.headerRowIndex);

      // Auto-map columns
      const autoMapped = autoMapColumns(parsedWb.headers, parsedWb.rows, entity);
      setMappings(autoMapped);

      setStep(2);
    } catch (err: any) {
      console.error(err);
      setUploadError(err?.message || 'Failed to read spreadsheet. File may be corrupted.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Sheet Switch in Step 1 or 2
  const handleSheetChange = async (sheetName: string) => {
    if (!rawFile) return;
    setIsParsing(true);
    try {
      const data = await getSheetData(rawFile, sheetName);
      setSelectedSheet(sheetName);
      setHeaderRowIdx(data.headerRowIndex);
      const autoMapped = autoMapColumns(data.headers, data.rows, entity);
      setMappings(autoMapped);
      if (workbook) {
        setWorkbook({
          ...workbook,
          selectedSheetName: sheetName,
          headers: data.headers,
          rows: data.rows,
          headerRowIndex: data.headerRowIndex,
        });
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Could not load sheet.');
    } finally {
      setIsParsing(false);
    }
  };

  // Step 2: Proceed to Review & Clean
  const handleProceedToReview = () => {
    if (!workbook) return;

    if (rememberMapping) {
      saveUserMapping(entity, mappings);
    }

    if (entity === 'staff') {
      const { cleanedRows, newSubjectSuggestions: suggestions } = cleanAndValidateStaffRows(
        workbook.rows,
        mappings,
        teachers,
        subjects
      );
      setCleanedStaff(cleanedRows);
      setNewSubjectSuggestions(suggestions);
    } else if (entity === 'subjects') {
      const { cleanedRows } = cleanAndValidateSubjectRows(
        workbook.rows,
        mappings,
        subjects
      );
      setCleanedSubjects(cleanedRows);
      setNewSubjectSuggestions([]);
    }

    setStep(3);
  };

  // Handle Toggle Subject Suggestion
  const toggleSubjectSuggestion = (tempId: string) => {
    setNewSubjectSuggestions((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, selected: !s.selected } : s))
    );
  };

  // Handle Select All / Deselect All Subject Suggestions
  const handleToggleAllSubjects = (selectAll: boolean) => {
    setNewSubjectSuggestions((prev) =>
      prev.map((s) => ({ ...s, selected: selectAll }))
    );
  };

  // Bulk Apply Duplicate Action
  const handleApplyDuplicateAll = (action: 'skip' | 'update' | 'new') => {
    setDuplicateApplyAll(action);
    if (entity === 'staff') {
      setCleanedStaff((prev) =>
        prev.map((r) => (r.isDuplicate ? { ...r, duplicateAction: action } : r))
      );
    } else {
      setCleanedSubjects((prev) =>
        prev.map((r) => (r.isDuplicate ? { ...r, duplicateAction: action } : r))
      );
    }
  };

  // Toggle Row Selection
  const toggleRowSelected = (rowIdx: number) => {
    if (entity === 'staff') {
      setCleanedStaff((prev) =>
        prev.map((r) => (r.rowIndex === rowIdx ? { ...r, selected: !r.selected } : r))
      );
    } else {
      setCleanedSubjects((prev) =>
        prev.map((r) => (r.rowIndex === rowIdx ? { ...r, selected: !r.selected } : r))
      );
    }
  };

  // Filtered rows for Step 3 preview
  const filteredReviewRows = useMemo(() => {
    if (statusFilter === 'all') return cleanedStaff;
    return cleanedStaff.filter((r) => r.status === statusFilter);
  }, [cleanedStaff, statusFilter]);

  const filteredSubjectRows = useMemo(() => {
    if (statusFilter === 'all') return cleanedSubjects;
    return cleanedSubjects.filter((r) => r.status === statusFilter);
  }, [cleanedSubjects, statusFilter]);

  // Counts for summary bar
  const metrics = useMemo(() => {
    const list = entity === 'staff' ? cleanedStaff : cleanedSubjects;
    const total = list.length;
    const ready = list.filter((r) => r.status === 'ready').length;
    const warnings = list.filter((r) => r.status === 'warning').length;
    const errors = list.filter((r) => r.status === 'error').length;
    const duplicates = list.filter((r) => r.isDuplicate).length;
    const selected = list.filter((r) => r.selected).length;
    return { total, ready, warnings, errors, duplicates, selected };
  }, [entity, cleanedStaff, cleanedSubjects]);

  // Step 3 -> Step 4: Atomic Commit to Store & IndexedDB
  const handleCommitImport = async () => {
    setIsCommitting(true);
    const createdTeacherIds: string[] = [];
    const createdSubjectIds: string[] = [];
    const createdClassIds: string[] = [];
    const reportRows: ImportExecutionResult['reportRows'] = [];

    try {
      if (entity === 'subjects') {
        let createdCount = 0;
        let skippedCount = 0;

        for (const row of cleanedSubjects) {
          if (!row.selected || (row.isDuplicate && row.duplicateAction === 'skip')) {
            skippedCount++;
            reportRows.push({
              rowNumber: row.rowIndex,
              name: row.name,
              status: 'Skipped',
              reason: row.isDuplicate ? `Duplicate skipped (${row.duplicateMatchReason})` : 'Deselected by user before import',
            });
            continue;
          }

          const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          const newSub: Subject = {
            id: subId,
            name: row.name,
            code: row.code,
            type: row.type,
            defaultPeriodsPerWeek: row.periodsPerWeek,
            periodsPerWeek: row.periodsPerWeek,
            maxPerDay: row.maxPerDay,
            doublePeriod: row.requiresDoublePeriod,
            requiresDoublePeriod: row.requiresDoublePeriod,
            preferMorning: row.isMorningPreferred,
            isMorningPreferred: row.isMorningPreferred,
            color: row.color,
          };

          addSubject(newSub);
          createdSubjectIds.push(subId);
          createdCount++;

          reportRows.push({
            rowNumber: row.rowIndex,
            name: row.name,
            status: 'Created',
            reason: `Successfully imported subject (${row.code})`,
          });
        }

        const result: ImportExecutionResult = {
          success: true,
          createdStaffCount: 0,
          updatedStaffCount: 0,
          skippedStaffCount: skippedCount,
          createdSubjectsCount: createdCount,
          createdClassesCount: 0,
          reportRows,
          rollbackData: {
            createdTeacherIds: [],
            createdSubjectIds,
            createdClassIds: [],
          },
        };

        setImportResult(result);
        onImportComplete?.(result);
        addToast(`Import complete: ${createdCount} subjects created!`, 'success');
        setStep(4);
        return;
      }

      // 1. Atomically Create Approved New Subjects First!
      const subjectNameToIdMap = new Map<string, string>();
      // Pre-seed with existing subjects
      subjects.forEach((s) => {
        subjectNameToIdMap.set(s.name.toLowerCase().trim(), s.id);
      });

      for (const subSugg of newSubjectSuggestions) {
        if (subSugg.selected) {
          const newSub: Subject = {
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: subSugg.name,
            code: subSugg.code,
            type: 'theory',
            defaultPeriodsPerWeek: 5,
            periodsPerWeek: 5,
            maxPerDay: 2,
            doublePeriod: false,
            requiresDoublePeriod: false,
            preferMorning: false,
            isMorningPreferred: false,
            color: subSugg.color,
          };
          addSubject(newSub);
          createdSubjectIds.push(newSub.id);
          subjectNameToIdMap.set(newSub.name.toLowerCase().trim(), newSub.id);
        }
      }

      // 2. Process Staff Rows
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const row of cleanedStaff) {
        if (!row.selected) {
          skippedCount++;
          reportRows.push({
            rowNumber: row.rowIndex,
            name: row.name,
            status: 'Skipped',
            reason: 'Deselected by user before import',
          });
          continue;
        }

        if (row.isDuplicate && row.duplicateAction === 'skip') {
          skippedCount++;
          reportRows.push({
            rowNumber: row.rowIndex,
            name: row.name,
            status: 'Skipped',
            reason: `Duplicate skipped (${row.duplicateMatchReason})`,
          });
          continue;
        }

        // Map subject names to IDs
        const finalSubjectIds: string[] = [];
        for (const subName of row.parsedSubjectNames) {
          const id = subjectNameToIdMap.get(subName.toLowerCase().trim());
          if (id) finalSubjectIds.push(id);
        }

        // If duplicate action is update:
        if (row.isDuplicate && row.duplicateAction === 'update') {
          const existing = teachers.find(
            (t) =>
              t.name.toLowerCase().trim() === row.name.toLowerCase().trim() ||
              (row.phone && t.phone === row.phone) ||
              (row.email && t.email?.toLowerCase() === row.email.toLowerCase())
          );

          if (existing) {
            // Merge subjects
            const mergedSubjectIds = Array.from(new Set([...existing.subjectIds, ...finalSubjectIds]));
            existing.phone = row.phone || existing.phone;
            existing.email = row.email || existing.email;
            existing.qualification = row.qualification || existing.qualification;
            existing.classTeacher = row.parsedClassGrade && row.parsedClassSection
              ? `${row.parsedClassGrade} - ${row.parsedClassSection}`
              : (row.rawClassTeacherText || existing.classTeacher);
            existing.subjectIds = mergedSubjectIds;
            updatedCount++;
            reportRows.push({
              rowNumber: row.rowIndex,
              name: row.name,
              status: 'Updated',
              reason: 'Updated existing record with imported qualifications and subjects',
            });
            continue;
          }
        }

        // Create new Teacher
        const teacherId = `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const newTeacher: Teacher = {
          id: teacherId,
          name: row.name,
          code: row.code,
          email: row.email,
          phone: row.phone,
          qualification: row.qualification,
          classTeacher: row.parsedClassGrade && row.parsedClassSection
            ? `${row.parsedClassGrade} - ${row.parsedClassSection}`
            : (row.rawClassTeacherText || undefined),
          maxPerDay: 6,
          maxPerWeek: 30,
          maxConsecutive: 3,
          subjectIds: finalSubjectIds,
          classIds: [],
          blocked: [],
        };

        addTeacher(newTeacher);
        createdTeacherIds.push(teacherId);
        createdCount++;

        reportRows.push({
          rowNumber: row.rowIndex,
          name: row.name,
          status: 'Created',
          reason: `Successfully imported with ${finalSubjectIds.length} subjects`,
        });
      }

      const result: ImportExecutionResult = {
        success: true,
        createdStaffCount: createdCount,
        updatedStaffCount: updatedCount,
        skippedStaffCount: skippedCount,
        createdSubjectsCount: createdSubjectIds.length,
        createdClassesCount: createdClassIds.length,
        reportRows,
        rollbackData: {
          createdTeacherIds,
          createdSubjectIds,
          createdClassIds,
        },
      };

      setImportResult(result);
      onImportComplete?.(result);
      addToast(`Import complete: ${createdCount} staff created, ${createdSubjectIds.length} subjects added!`, 'success');
      setStep(4);
    } catch (err: any) {
      console.error('Import execution error:', err);
      // Rollback newly created entities
      createdTeacherIds.forEach((id) => deleteTeacher(id));
      createdSubjectIds.forEach((id) => deleteSubject(id));
      createdClassIds.forEach((id) => deleteClass(id));
      addToast(`Import failed and was rolled back: ${err?.message || 'Database error'}`, 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  // Download Skip/Import Report CSV
  const handleDownloadReport = () => {
    if (!importResult) return;
    const header = 'Row Number,Name,Status,Reason\n';
    const body = importResult.reportRows
      .map((r) => `${r.rowNumber},"${r.name}","${r.status}","${r.reason}"`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChronoForge_Import_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Session Undo Import Action
  const handleUndoImport = () => {
    if (!importResult?.rollbackData) return;
    const { createdTeacherIds, createdSubjectIds } = importResult.rollbackData;
    createdTeacherIds.forEach((id) => deleteTeacher(id));
    createdSubjectIds.forEach((id) => deleteSubject(id));
    addToast(`Undo successful: removed ${createdTeacherIds.length} staff and ${createdSubjectIds.length} subjects.`, 'info');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={
        <div className="flex items-center gap-2">
          <span>Smart Excel &amp; CSV Import Wizard</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono-code font-bold uppercase border border-amber-500/30">
            {entity}
          </span>
        </div>
      }
      subtitle={`Step ${step} of 4: ${
        step === 1
          ? 'Upload & Workbook Inspection'
          : step === 2
          ? 'Intelligent Column Mapping'
          : step === 3
          ? 'Review, Clean & Subject Normalization'
          : 'Import Summary & Report'
      }`}
      icon={<FileSpreadsheet className="w-5 h-5 text-amber-400" />}
    >
      <div className="space-y-5">
        {/* Progress Stepper Bar */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs border-b border-white/10 pb-3 font-semibold">
          {[
            { num: 1, label: '1. Upload' },
            { num: 2, label: '2. Mapping' },
            { num: 3, label: '3. Review & Clean' },
            { num: 4, label: '4. Summary' },
          ].map((st) => (
            <div
              key={st.num}
              className={`py-1.5 px-2 rounded-xl transition-all ${
                step === st.num
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-ember-glow-sm'
                  : step > st.num
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-500'
              }`}
            >
              {st.label}
            </div>
          ))}
        </div>

        {/* ================================================================= */}
        {/* STEP 1: FILE UPLOAD & SHEET SELECTOR                              */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all text-center space-y-4 ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                  : 'border-white/15 bg-white/[0.02] hover:border-amber-500/40 hover:bg-white/[0.04]'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-ember-glow">
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Drag and drop your spreadsheet here
                </h3>
                <p className="text-xs text-slate-400">
                  Accepts standard Excel workbooks (<strong>.xlsx, .xls</strong>) and tabular data (<strong>.csv, .tsv</strong>)
                </p>
              </div>

              <div>
                <label className="cursor-pointer inline-block">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <span className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs inline-flex items-center gap-2 shadow-ember-glow transition-all">
                    <FileSpreadsheet className="w-4 h-4" /> Browse Computer
                  </span>
                </label>
              </div>

              {isParsing && (
                <div className="flex items-center justify-center gap-2 text-xs text-amber-300 font-mono-code pt-2">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <span>Inspecting workbook sheets &amp; byte encoding...</span>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Download Clean Templates */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Need a pre-formatted template with sample data?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (entity === 'staff' ? downloadStaffTemplate('xlsx') : downloadSubjectsTemplate('xlsx'))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" /> Download .xlsx
                </button>
                <button
                  type="button"
                  onClick={() => (entity === 'staff' ? downloadStaffTemplate('csv') : downloadSubjectsTemplate('csv'))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" /> Download .csv
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: INTELLIGENT COLUMN MAPPING                                */}
        {/* ================================================================= */}
        {step === 2 && workbook && (
          <div className="space-y-4 animate-fadeIn">
            {/* Sheet Selector Bar if Multiple Sheets */}
            {workbook.sheets.length > 1 && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 font-semibold">Active Sheet in Workbook:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#161224] border border-white/10 text-white text-xs font-mono-code focus:outline-none focus:border-amber-400"
                >
                  {workbook.sheets.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.rowCount} rows) {s.rowCount === 0 ? '- Empty' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Header Row Index Selector */}
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Header Row Detected at index: <strong>Row {headerRowIdx + 1}</strong></span>
              <span className="text-slate-500 font-mono-code">{workbook.rows.length} data rows detected</span>
            </div>

            {/* Column Mapping Table */}
            <div className="max-h-72 overflow-y-auto border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-black/40 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Spreadsheet Column</th>
                    <th className="py-2.5 px-3">Sample Value</th>
                    <th className="py-2.5 px-3">Mapped App Field</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mappings.map((item, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-medium text-white flex items-center gap-2">
                          {item.isSensitive && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          <span>{item.headerName}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-400 font-mono-code text-[11px] truncate max-w-[140px]">
                          {item.isSensitive ? (
                            <span className="text-amber-400/80 font-bold">••••••••</span>
                          ) : (
                            item.sampleValues[0] || '—'
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {item.isSensitive ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300 text-[11px]">
                              <Lock className="w-3 h-3" />
                              <span>Ignored (Sensitive Data Shield)</span>
                            </div>
                          ) : (
                            <select
                              value={item.mappedField}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMappings((prev) =>
                                  prev.map((m, i) => (i === idx ? { ...m, mappedField: val, confidence: 'manual' } : m))
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#161224] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 w-full max-w-[200px]"
                            >
                              <option value="ignore">Don&apos;t Import (Ignore)</option>
                              {entity === 'staff' && (
                                <>
                                  <option value="name">Staff Full Name *</option>
                                  <option value="gender">Gender</option>
                                  <option value="phone">Phone Number</option>
                                  <option value="email">Google / Mail ID</option>
                                  <option value="qualification">Qualification / Degree</option>
                                  <option value="subjects">Subjects Handled *</option>
                                  <option value="classTeacher">Class Teacher Allocation</option>
                                </>
                              )}
                              {entity === 'subjects' && (
                                <>
                                  <option value="name">Subject Name *</option>
                                  <option value="code">Short Code *</option>
                                  <option value="type">Type (Theory / Lab)</option>
                                  <option value="defaultPeriods">Default Periods/Wk</option>
                                  <option value="doublePeriod">Requires Double Period</option>
                                  <option value="morningPreference">Prefer Morning</option>
                                </>
                              )}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Remember Checkbox & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMapping}
                  onChange={(e) => setRememberMapping(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                />
                <span>Remember this column mapping for next time</span>
              </label>

              <div className="flex items-center gap-2 justify-end">
                <MoltenButton size="sm" variant="ghost" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </MoltenButton>
                <MoltenButton size="sm" variant="molten" onClick={handleProceedToReview} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Next: Review &amp; Clean ({workbook.rows.length} rows)
                </MoltenButton>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: REVIEW, CLEAN & AUTO-CREATE SUBJECTS                      */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            {/* New Subjects Auto-Creation Panel */}
            {newSubjectSuggestions.length > 0 && (
              <PlasmaGlass glow className="p-4 border-amber-500/30 bg-amber-950/15 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      New Subjects Found ({newSubjectSuggestions.length})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleAllSubjects(true)}
                      className="text-amber-300 hover:text-white underline text-[11px]"
                    >
                      Approve All
                    </button>
                    <span className="text-slate-500">•</span>
                    <button
                      type="button"
                      onClick={() => handleToggleAllSubjects(false)}
                      className="text-slate-400 hover:text-white underline text-[11px]"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300">
                  These subjects were mentioned in the imported staff curriculum. They will be auto-registered in your school catalog before staff import:
                </p>

                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pt-1">
                  {newSubjectSuggestions.map((sugg) => (
                    <label
                      key={sugg.tempId}
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs cursor-pointer transition-all ${
                        sugg.selected
                          ? 'bg-amber-500/20 border-amber-500/40 text-white font-semibold'
                          : 'bg-black/30 border-white/10 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sugg.selected}
                        onChange={() => toggleSubjectSuggestion(sugg.tempId)}
                        className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0 shrink-0"
                      />
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sugg.color }} />
                      <span>{sugg.name}</span>
                      <span className="text-[10px] text-amber-300 font-mono-code font-bold">({sugg.code})</span>
                    </label>
                  ))}
                </div>
              </PlasmaGlass>
            )}

            {/* Metrics & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-2 rounded-xl border border-white/10 text-xs">
              <div className="flex items-center gap-1 overflow-x-auto">
                {(['all', 'ready', 'warning', 'error', 'duplicate'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      statusFilter === filter
                        ? 'bg-amber-500 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter} (
                    {filter === 'all'
                      ? metrics.total
                      : filter === 'ready'
                      ? metrics.ready
                      : filter === 'warning'
                      ? metrics.warnings
                      : filter === 'error'
                      ? metrics.errors
                      : metrics.duplicates}
                    )
                  </button>
                ))}
              </div>

              {metrics.duplicates > 0 && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-slate-400 text-[11px]">Duplicates:</span>
                  <select
                    value={duplicateApplyAll}
                    onChange={(e) => handleApplyDuplicateAll(e.target.value as any)}
                    className="px-2 py-0.5 rounded bg-[#161224] border border-white/10 text-amber-300 text-xs font-mono-code focus:outline-none"
                  >
                    <option value="skip">Skip all duplicates</option>
                    <option value="update">Update existing staff</option>
                    <option value="new">Import as new records</option>
                  </select>
                </div>
              )}
            </div>

            {/* Editable Preview Data Table */}
            <div className="max-h-72 overflow-y-auto border border-white/10 rounded-xl overflow-hidden">
              {entity === 'staff' ? (
                <table className="w-full text-xs text-left">
                  <thead className="bg-black/40 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Staff Name</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">Subjects Handled</th>
                      <th className="py-2 px-3">Class Teacher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredReviewRows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={`hover:bg-white/[0.02] ${!row.selected ? 'opacity-40' : ''}`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRowSelected(row.rowIndex)}
                            className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                          />
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {row.status === 'ready' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-2.5 h-2.5" /> Ready
                            </span>
                          )}
                          {row.status === 'warning' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              title={row.warnings.join(' ')}
                            >
                              <AlertTriangle className="w-2.5 h-2.5" /> Warning
                            </span>
                          )}
                          {row.status === 'error' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30"
                              title={row.errors.join(' ')}
                            >
                              <XCircle className="w-2.5 h-2.5" /> Error
                            </span>
                          )}
                          {row.status === 'duplicate' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Duplicate
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-medium text-white truncate max-w-[130px]">
                          <div>{row.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono-code">{row.code}</div>
                        </td>
                        <td className="py-2 px-3 font-mono-code text-[11px] text-slate-300">
                          {row.phone || '—'}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {row.parsedSubjectNames.slice(0, 3).map((sub, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 text-[10px]"
                              >
                                {sub}
                              </span>
                            ))}
                            {row.parsedSubjectNames.length > 3 && (
                              <span className="text-[10px] text-amber-400 font-bold">
                                +{row.parsedSubjectNames.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-300">
                          {row.parsedClassGrade ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono-code border border-amber-500/20">
                              Class {row.parsedClassGrade}{row.parsedClassSection ? `-${row.parsedClassSection}` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-black/40 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Subject Name</th>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Periods/Wk</th>
                      <th className="py-2 px-3">Double Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSubjectRows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={`hover:bg-white/[0.02] ${!row.selected ? 'opacity-40' : ''}`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRowSelected(row.rowIndex)}
                            className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-0"
                          />
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {row.status === 'ready' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-2.5 h-2.5" /> Ready
                            </span>
                          )}
                          {row.status === 'warning' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              title={row.warnings.join(' ')}
                            >
                              <AlertTriangle className="w-2.5 h-2.5" /> Warning
                            </span>
                          )}
                          {row.status === 'duplicate' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              title={row.duplicateMatchReason}
                            >
                              Duplicate
                            </span>
                          )}
                          {row.status === 'error' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30"
                              title={row.errors.join(' ')}
                            >
                              <XCircle className="w-2.5 h-2.5" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                            <span>{row.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono-code text-amber-300 font-bold">
                          {row.code}
                        </td>
                        <td className="py-2 px-3 capitalize text-slate-300">
                          {row.type}
                        </td>
                        <td className="py-2 px-3 font-mono-code text-slate-200">
                          {row.periodsPerWeek}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {row.requiresDoublePeriod ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Step 3 Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <MoltenButton size="sm" variant="ghost" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Mapping
              </MoltenButton>
              <MoltenButton
                size="md"
                variant="molten"
                disabled={metrics.selected === 0 || isCommitting}
                onClick={handleCommitImport}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isCommitting ? 'Importing...' : `Commit Import (${metrics.selected} Records)`}
              </MoltenButton>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4: IMPORT RESULT & ACTIONS                                   */}
        {/* ================================================================= */}
        {step === 4 && importResult && (
          <div className="space-y-6 text-center py-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Import Successfully Completed</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All records were validated, multi-subject allocations resolved, and saved into your local database.
              </p>
            </div>

            {/* Metrics Result Cards */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-2xl font-mono-code font-bold text-emerald-400">
                  {importResult.createdStaffCount}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Staff Created</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-2xl font-mono-code font-bold text-amber-400">
                  {importResult.createdSubjectsCount}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Subjects Added</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-2xl font-mono-code font-bold text-slate-400">
                  {importResult.skippedStaffCount}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Skipped / Dups</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-white/10">
              <MoltenButton
                size="sm"
                variant="glass"
                onClick={handleDownloadReport}
                leftIcon={<Download className="w-4 h-4 text-amber-400" />}
              >
                Download Import Report (CSV)
              </MoltenButton>

              <MoltenButton
                size="sm"
                variant="ghost"
                onClick={handleUndoImport}
                leftIcon={<RotateCcw className="w-4 h-4 text-red-400" />}
                className="text-red-300 hover:text-white"
              >
                Undo Import
              </MoltenButton>

              <MoltenButton size="sm" variant="molten" onClick={onClose}>
                Done &amp; View Catalog
              </MoltenButton>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
