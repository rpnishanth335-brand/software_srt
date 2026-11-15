import React, { useState } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { MoltenButton } from '../components/MoltenButton';
import { ToastContainer } from '../components/ToastContainer';
import { AiAssistantModal } from '../components/AiAssistantModal';
import { 
  Flame, 
  LayoutDashboard, 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Users, 
  DoorOpen, 
  Grid3X3, 
  Sliders, 
  ShieldCheck, 
  CalendarDays, 
  Download, 
  Settings, 
  Sparkles, 
  RotateCcw, 
  Bot, 
  Undo2, 
  Redo2, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  Sun, 
  Moon,
  Menu,
  X
} from 'lucide-react';
import { AppRoute } from '../types';
import { QualityMode } from '../theme/tokens';

// Import All 13 Pages
import { DashboardPage } from '../pages/DashboardPage';
import { SchoolSettingsPage } from '../pages/SchoolSettingsPage';
import { ClassesPage } from '../pages/ClassesPage';
import { SubjectsPage } from '../pages/SubjectsPage';
import { StaffPage } from '../pages/StaffPage';
import { RoomsPage } from '../pages/RoomsPage';
import { AssignmentsPage } from '../pages/AssignmentsPage';
import { RulesPage } from '../pages/RulesPage';
import { FeasibilityPage } from '../pages/FeasibilityPage';
import { GeneratePage } from '../pages/GeneratePage';
import { ViewerPage } from '../pages/ViewerPage';
import { ExportPage } from '../pages/ExportPage';
import { SettingsPage } from '../pages/SettingsPage';

interface AppShellProps {
  isDaylight: boolean;
  onToggleDaylight: () => void;
  quality: QualityMode;
  onQualityChange: (q: QualityMode) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  isDaylight,
  onToggleDaylight,
  quality,
  onQualityChange,
}) => {
  const { 
    project, 
    currentRoute, 
    setCurrentRoute, 
    loadDemoSchool, 
    resetProject, 
    undo, 
    redo, 
    undoStack, 
    redoStack, 
    isDirty
  } = useTimetableStore();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const { school, classes, subjects, teachers, rooms, assignments, timetables } = project;
  const selectedClasses = classes.filter(c => c.selected);

  // Calculate Setup Completeness
  const hasSchool = Boolean(school.name.trim() && (school.days?.length > 0 || (school.workingDays && school.workingDays.length > 0)));
  const hasClasses = classes.length > 0 && selectedClasses.length > 0;
  const hasSubjects = subjects.length > 0;
  const hasStaff = teachers.length > 0;
  const hasRooms = rooms.length > 0;
  const hasAssignments = assignments.some(a => a.periodsPerWeek > 0);

  const completedMilestones = [hasSchool, hasClasses, hasSubjects, hasStaff, hasRooms, hasAssignments].filter(Boolean).length;
  const completenessPct = Math.round((completedMilestones / 6) * 100);

  // Nav Items Structure
  const navItems: Array<{
    group: string;
    items: Array<{
      route: AppRoute;
      label: string;
      icon: React.ReactNode;
      badge?: string | number;
      badgeColor?: string;
    }>;
  }> = [
    {
      group: 'Overview',
      items: [
        { route: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      group: 'Setup & Catalog',
      items: [
        { route: 'school', label: 'School Settings', icon: <Building2 className="w-4 h-4" />, badge: hasSchool ? '✓' : '!', badgeColor: hasSchool ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300' },
        { route: 'classes', label: 'Classes & Cohorts', icon: <GraduationCap className="w-4 h-4" />, badge: classes.length, badgeColor: 'bg-white/10 text-slate-300' },
        { route: 'subjects', label: 'Subjects Catalog', icon: <BookOpen className="w-4 h-4" />, badge: subjects.length, badgeColor: 'bg-white/10 text-slate-300' },
        { route: 'staff', label: 'Faculty & Staff', icon: <Users className="w-4 h-4" />, badge: teachers.length, badgeColor: 'bg-white/10 text-slate-300' },
        { route: 'rooms', label: 'Rooms & Labs', icon: <DoorOpen className="w-4 h-4" />, badge: rooms.length, badgeColor: 'bg-white/10 text-slate-300' },
        { route: 'assignments', label: 'Curriculum Matrix', icon: <Grid3X3 className="w-4 h-4" /> },
        { route: 'rules', label: 'Rules & Sliders', icon: <Sliders className="w-4 h-4" /> },
      ],
    },
    {
      group: 'Timetable Operations',
      items: [
        { route: 'feasibility', label: 'Feasibility Check', icon: <ShieldCheck className="w-4 h-4" /> },
        { route: 'generate', label: 'AI Generator', icon: <Flame className="w-4 h-4 text-ember-400" /> },
        { route: 'viewer', label: 'Timetable Viewer', icon: <CalendarDays className="w-4 h-4" />, badge: timetables.length > 0 ? `${timetables.length} ver` : undefined, badgeColor: 'bg-amber-500/20 text-amber-300' },
      ],
    },
    {
      group: 'Publish & Options',
      items: [
        { route: 'export', label: 'Export Center', icon: <Download className="w-4 h-4" /> },
        { route: 'settings', label: 'Settings & Data', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const handleNavClick = (route: AppRoute) => {
    setCurrentRoute(route);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActivePage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage />;
      case 'school':
        return <SchoolSettingsPage />;
      case 'classes':
        return <ClassesPage />;
      case 'subjects':
        return <SubjectsPage />;
      case 'staff':
        return <StaffPage />;
      case 'rooms':
        return <RoomsPage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'rules':
        return <RulesPage />;
      case 'feasibility':
        return <FeasibilityPage />;
      case 'generate':
        return <GeneratePage />;
      case 'viewer':
        return <ViewerPage />;
      case 'export':
        return <ExportPage />;
      case 'settings':
        return (
          <SettingsPage
            isDaylight={isDaylight}
            onToggleDaylight={onToggleDaylight}
            quality={quality}
            onQualityChange={onQualityChange}
          />
        );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#08070d] text-slate-100 relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#0c0a14] z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-ember-glow">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white tracking-wide">ChronoForge</span>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 shrink-0 bg-[#0d0b17]/95 border-r border-white/10 z-40 flex flex-col justify-between transition-transform duration-300 backdrop-blur-xl ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-ember-glow shrink-0">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
                <span>ChronoForge</span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  AI
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                {school.name || 'School Timetable ERP'}
              </div>
            </div>
          </div>

          {/* Setup Completeness Mini Progress */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Readiness:</span>
              <span className="font-mono-code font-bold text-amber-300">{completenessPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${completenessPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navItems.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.group}
              </div>
              {group.items.map((item) => {
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    data-nav={item.route}
                    onClick={() => handleNavClick(item.route)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-white border border-amber-500/40 shadow-ember-glow font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-amber-300' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-white/10 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Sidebar Status */}
        <div className="p-3 border-t border-white/10 space-y-2 bg-black/20">
          {/* IndexedDB Autosave Tracker */}
          <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>IndexedDB:</span>
            </span>
            {isDirty ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin" /> Saving
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Synced
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Desktop Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d0b17]/90 backdrop-blur-md">
          {/* Breadcrumb / Current View */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">ChronoForge</span>
            <span className="text-slate-600">/</span>
            <span className="font-bold text-amber-200 capitalize">
              {currentRoute.replace('-', ' ')}
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* Undo / Redo */}
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 gap-0.5">
              <button
                onClick={undo}
                disabled={undoStack.length === 0}
                className={`p-1 rounded-lg transition-colors ${
                  undoStack.length > 0 ? 'text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className={`p-1 rounded-lg transition-colors ${
                  redoStack.length > 0 ? 'text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <MoltenButton
              size="sm"
              variant="glass"
              onClick={loadDemoSchool}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              className="hidden lg:inline-flex"
            >
              Load Demo School
            </MoltenButton>

            <MoltenButton
              size="sm"
              variant="ghost"
              onClick={resetProject}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="hidden xl:inline-flex"
            >
              Reset
            </MoltenButton>

            <MoltenButton
              size="sm"
              variant="glass"
              onClick={() => setShowAiModal(true)}
              leftIcon={<Bot className="w-3.5 h-3.5 text-purple-400" />}
            >
              AI Assistant
            </MoltenButton>

            {/* Daylight Theme Toggle */}
            <button
              onClick={onToggleDaylight}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="Toggle Daylight/Dark theme"
            >
              {isDaylight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </header>

        {/* Page View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Floating Real-Time Notifications Container */}
      <ToastContainer />

      {/* AI Assistant Modal */}
      {showAiModal && (
        <AiAssistantModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
};
