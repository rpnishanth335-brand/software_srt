import React, { useState } from 'react';
import { useTimetableStore } from '../store/useTimetableStore';
import { MoltenButton } from '../components/MoltenButton';
import { ToastContainer } from '../components/ToastContainer';
import { AiAssistantModal } from '../components/AiAssistantModal';
import { ChronoForgeLogo } from '../components/ChronoForgeLogo';
import { UserAvatarMenu } from '../components/UserAvatarMenu';
import { 
  Flame, 
  LayoutDashboard, 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  CalendarDays, 
  Download, 
  Settings, 
  Sparkles, 
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
    undo, 
    redo, 
    undoStack, 
    redoStack, 
    isDirty
  } = useTimetableStore();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const { school, classes, subjects, teachers, assignments, timetables } = project;
  const selectedClasses = classes.filter(c => c.selected);

  // Calculate Setup Completeness
  const hasSchool = Boolean(school.name.trim() && (school.days?.length > 0 || (school.workingDays && school.workingDays.length > 0)));
  const hasSubjects = subjects.length > 0;
  const hasStaff = teachers.length > 0;
  const hasClasses = classes.length > 0 && selectedClasses.length > 0;
  const hasCompleteClass = classes.some(c => c.selected && (c.status === 'complete' || assignments.some(a => a.classId === c.id && a.periodsPerWeek > 0)));
  const readyToGenerate = hasSubjects && hasStaff && hasClasses && hasCompleteClass;

  const completedSteps = [hasSubjects, hasStaff, hasClasses, readyToGenerate].filter(Boolean).length;
  const completenessPct = Math.round((completedSteps / 4) * 100);

  // Nav Items Structure - Strictly Enforcing Required Order:
  // 1. Subjects -> 2. Staff -> 3. Classes -> 4. Generate
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
      group: 'Setup Flow (1 → 2 → 3)',
      items: [
        { 
          route: 'subjects', 
          label: '1. Subjects Catalog', 
          icon: <BookOpen className="w-4 h-4" />, 
          badge: subjects.length, 
          badgeColor: hasSubjects ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400' 
        },
        { 
          route: 'staff', 
          label: '2. Faculty & Staff', 
          icon: <Users className="w-4 h-4" />, 
          badge: teachers.length, 
          badgeColor: hasStaff ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400' 
        },
        { 
          route: 'classes', 
          label: '3. Classes & Wizard', 
          icon: <GraduationCap className="w-4 h-4" />, 
          badge: classes.length, 
          badgeColor: hasClasses ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400' 
        },
        { 
          route: 'school', 
          label: 'School Timings', 
          icon: <Building2 className="w-4 h-4" />, 
          badge: hasSchool ? '✓' : '!', 
          badgeColor: hasSchool ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300' 
        },
      ],
    },
    {
      group: 'Timetable Operations',
      items: [
        { 
          route: 'generate', 
          label: '4. AI Generator', 
          icon: <Flame className="w-4 h-4 text-amber-400" />,
          badge: readyToGenerate ? 'Ready' : 'Setup',
          badgeColor: readyToGenerate ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
        },
        { route: 'feasibility', label: 'Feasibility & Pre-Flight', icon: <ShieldCheck className="w-4 h-4" /> },
        { route: 'viewer', label: 'Timetable Viewer', icon: <CalendarDays className="w-4 h-4" />, badge: timetables.length > 0 ? `${timetables.length} ver` : undefined, badgeColor: 'bg-amber-500/20 text-amber-300' },
      ],
    },
    {
      group: 'Publish & Options',
      items: [
        { route: 'export', label: 'Export Center', icon: <Download className="w-4 h-4" /> },
        { route: 'settings', label: 'Settings & AI Key', icon: <Settings className="w-4 h-4" /> },
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
      case 'school-settings':
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
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-[#08070d] text-slate-100 relative overflow-x-hidden">
      {/* ========================================================= */}
      {/* 1. MOBILE TOP APP BAR (phones only, < 768px)               */}
      {/* ========================================================= */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-[#0c0a14]/95 backdrop-blur-md z-30 sticky top-0 safe-area-pt">
        <ChronoForgeLogo size="sm" subtitle="" />
        
        <div className="flex items-center gap-2">
          {/* User Profile Avatar */}
          <UserAvatarMenu compact />

          {/* Menu Drawer Toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 focus:outline-none"
            aria-label="Open navigation menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. ADAPTIVE SIDEBAR (Desktop 260px / Tablet 64px Icon Rail) */}
      {/* ========================================================= */}
      <aside className="hidden md:flex flex-col shrink-0 md:w-16 lg:w-64 border-r border-white/10 bg-[#0a0814]/95 backdrop-blur-xl z-20 transition-all duration-300 select-none">
        {/* Brand Area */}
        <div className="p-3.5 lg:p-4 border-b border-white/10 flex flex-col items-center lg:items-stretch gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="hidden lg:block">
              <ChronoForgeLogo size="md" />
            </div>
            <div className="lg:hidden mx-auto">
              <ChronoForgeLogo size="sm" showText={false} />
            </div>
          </div>

          {/* Setup Completeness Stepper Checklist (Desktop Only) */}
          <div className="hidden lg:block p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Guided Setup</span>
              <span className="font-mono-code font-bold text-amber-300">{completenessPct}%</span>
            </div>
            
            <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono-code font-bold">
              <button 
                onClick={() => handleNavClick('subjects')}
                className={`py-1 rounded-md transition-all ${hasSubjects ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                title="1. Subjects"
              >
                1. Sub ({subjects.length})
              </button>
              <button 
                onClick={() => handleNavClick('staff')}
                className={`py-1 rounded-md transition-all ${hasStaff ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                title="2. Staff"
              >
                2. Stf ({teachers.length})
              </button>
              <button 
                onClick={() => handleNavClick('classes')}
                className={`py-1 rounded-md transition-all ${hasClasses ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                title="3. Classes"
              >
                3. Cls ({classes.length})
              </button>
              <button 
                onClick={() => handleNavClick('generate')}
                className={`py-1 rounded-md transition-all ${readyToGenerate ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                title="4. Generator"
              >
                4. {readyToGenerate ? 'Ready' : 'Gen'}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 lg:px-3 py-3 space-y-4">
          {navItems.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="hidden lg:block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.group}
              </div>
              {group.items.map((item) => {
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    data-nav={item.route}
                    onClick={() => handleNavClick(item.route)}
                    title={item.label}
                    className={`w-full flex items-center justify-center lg:justify-between px-2.5 lg:px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-white border border-amber-500/40 shadow-ember-glow font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-amber-300' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span className="hidden lg:inline">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className={`hidden lg:inline text-[10px] font-mono-code px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-white/10 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Status / Tablet User */}
        <div className="p-2 lg:p-3 border-t border-white/10 space-y-2 bg-black/20">
          <div className="hidden lg:flex items-center justify-between text-[11px] font-mono-code text-slate-400 px-1">
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

          {/* Tablet Avatar Menu */}
          <div className="lg:hidden flex justify-center">
            <UserAvatarMenu compact />
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 3. OFF-CANVAS MOBILE DRAWER (< 768px)                      */}
      {/* ========================================================= */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-4/5 max-w-xs bg-[#0e0c18] border-r border-white/15 h-full flex flex-col p-4 shadow-2xl overflow-y-auto safe-area-pb">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <ChronoForgeLogo size="sm" />
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile User Profile */}
            <div className="py-3 border-b border-white/10">
              <UserAvatarMenu />
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 py-3 space-y-4">
              {navItems.map((group) => (
                <div key={group.group} className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {group.group}
                  </div>
                  {group.items.map((item) => {
                    const isActive = currentRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        data-nav={item.route}
                        onClick={() => handleNavClick(item.route)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-amber-500/20 text-white border border-amber-500/40 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
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

            {/* Theme Toggle & Demo Button */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <MoltenButton
                size="sm"
                variant="ghost"
                onClick={onToggleDaylight}
                className="w-full justify-center"
                leftIcon={isDaylight ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              >
                {isDaylight ? 'Switch to Dark Mode' : 'Switch to Daylight Mode'}
              </MoltenButton>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MAIN CONTENT AREA & TOP DESKTOP HEADER                  */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Desktop Header (HIDDEN ON MOBILE to prevent 320px overflow) */}
        <header className="hidden md:flex sticky top-0 z-30 items-center justify-between px-4 lg:px-6 py-2.5 border-b border-white/10 bg-[#0d0b17]/90 backdrop-blur-md">
          {/* Breadcrumb / Current Route */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">ChronoForge</span>
            <span className="text-slate-600">/</span>
            <span className="font-bold text-amber-200 capitalize">
              {currentRoute.replace('-', ' ')}
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Undo / Redo */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 gap-0.5">
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

            {/* AI Assistant Trigger */}
            <MoltenButton
              size="sm"
              variant="ghost"
              onClick={() => setShowAiModal(true)}
              leftIcon={<Bot className="w-3.5 h-3.5 text-amber-300" />}
              className="text-xs"
            >
              <span className="hidden xl:inline">AI Assistant</span>
            </MoltenButton>

            {/* Theme Toggle */}
            <button
              onClick={onToggleDaylight}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title={isDaylight ? 'Switch to Dark Mode' : 'Switch to Daylight Mode'}
            >
              {isDaylight ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Load Demo */}
            <button
              onClick={loadDemoSchool}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Load pre-configured demo school"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load Demo</span>
            </button>

            {/* User Profile Avatar Dropdown */}
            <UserAvatarMenu />
          </div>
        </header>

        {/* Page View Container */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {renderActivePage()}
        </main>
      </div>

      {/* ========================================================= */}
      {/* 5. MOBILE BOTTOM TAB NAVIGATION (< 768px)                  */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c0a15]/95 border-t border-white/10 backdrop-blur-lg flex items-center justify-around py-1.5 px-2 safe-area-pb select-none">
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            currentRoute === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => handleNavClick('classes')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            currentRoute === 'classes' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Classes</span>
        </button>

        <button
          onClick={() => handleNavClick('generate')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            currentRoute === 'generate' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-ember-glow -mt-3 border-2 border-[#0c0a15]">
            <Flame className="w-4 h-4" />
          </div>
          <span>Forge</span>
        </button>

        <button
          onClick={() => handleNavClick('viewer')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            currentRoute === 'viewer' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Viewer</span>
        </button>

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Global Real-Time Toasts */}
      <ToastContainer />

      {/* Natural Language AI Assistant Modal */}
      {showAiModal && <AiAssistantModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />}
    </div>
  );
};
