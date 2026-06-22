import { useState, useEffect, useCallback } from 'react';
import { Network, FlaskConical, RotateCcw, DoorOpen, ChevronDown, Loader2 } from 'lucide-react';
import { Project, Step } from './types';
import { runDependencyAudit } from './lib/auditEngine';
import { clockmakerProject } from './data/sampleProject';
import { pb } from './lib/pocketbase';
import {
  resolveRoomContext,
  loadAudit,
  saveAudit,
  type RoomContext,
  type RoomOption,
} from './lib/dependency';
import ProgressRail from './components/ProgressRail';
import SummaryPanel from './components/SummaryPanel';
import ProjectSetupForm from './components/ProjectSetupForm';
import StageBuilder from './components/StageBuilder';
import NodeBuilder from './components/NodeBuilder';
import DependencyMatrix from './components/DependencyMatrix';
import AuditPanel from './components/AuditPanel';
import ExportPanel from './components/ExportPanel';
import GraphPreview from './components/GraphPreview';

const EMPTY_PROJECT: Project = {
  setup: {
    title: '',
    theme: '',
    roomStructure: 'semi-linear',
    targetDuration: 60,
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 6,
  },
  stages: [
    { id: 'stage_start', label: 'Starting Area', order: 1, description: '' },
    { id: 'stage_mid', label: 'Mid-Game Reveal', order: 2, description: '' },
    { id: 'stage_final', label: 'Final Sequence', order: 3, description: '' },
  ],
  nodes: [],
  auditResult: null,
};

const STEPS: Step[] = ['setup', 'stages', 'nodes', 'dependencies', 'audit', 'export'];

type SubView = 'form' | 'graph';

export default function App() {
  const [project, setProject] = useState<Project>(EMPTY_PROJECT);
  const [currentStep, setCurrentStep] = useState<Step>('setup');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  const [subView, setSubView] = useState<SubView>('form');
  const [ctx, setCtx] = useState<RoomContext | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showResumeMenu, setShowResumeMenu] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);

  // SSO token handoff + resolve the venue's rooms, then load the active room's audit.
  useEffect(() => {
    async function initApp() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        try {
          pb.authStore.save(token, null);
          await pb.collection('users').authRefresh();
        } catch {
          pb.authStore.clear();
        }
      }
      // Optional ?room= deep-link (forward-compatible with the dash launcher).
      const roomParam = params.get('room');
      window.history.replaceState({}, '', window.location.pathname);

      const resolved = await resolveRoomContext();
      if (!resolved) return; // not signed in / no venue → stays on the blank/sample flow
      setCtx(resolved);

      const room = resolved.rooms.find((r) => r.id === roomParam) ?? resolved.rooms[0] ?? null;
      if (room) {
        setActiveRoomId(room.id);
        setProject(await loadAudit(room));
      }
    }
    void initApp();
  }, []);

  const persistProject = useCallback(async (p: Project) => {
    if (!pb.authStore.isValid || !ctx || !activeRoomId) return;
    try {
      await saveAudit(ctx, activeRoomId, p);
    } catch (err) {
      console.warn('Puzzle Dependency Auditor: save failed', err);
    }
  }, [ctx, activeRoomId]);

  // Switch the active room: load (or Story-seed) its audit.
  const selectRoom = useCallback(async (room: RoomOption) => {
    setActiveRoomId(room.id); // move the highlight immediately for instant feedback
    setShowResumeMenu(false);
    setLoadingRoom(true);
    try {
      const loaded = await loadAudit(room);
      setProject(loaded);
      setCurrentStep('setup');
      setCompletedSteps(new Set());
      setSubView('form');
    } finally {
      setLoadingRoom(false);
    }
  }, []);

  const markComplete = (step: Step) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
    setSubView('form');
  };

  const nextStep = (current: Step) => {
    markComplete(current);
    const idx = STEPS.indexOf(current);
    const next = STEPS[idx + 1];
    if (next) {
      goToStep(next);
      // Auto-save when entering export
      if (next === 'export') void persistProject(project);
    }
  };

  const runAudit = () => {
    const result = runDependencyAudit(project.stages, project.nodes);
    setProject(p => ({ ...p, auditResult: result }));
    markComplete('audit');
  };

  const loadSample = () => {
    setProject({ ...clockmakerProject, auditResult: null });
    setCurrentStep('setup');
    setCompletedSteps(new Set());
    setSubView('form');
  };

  const resetProject = () => {
    setProject(EMPTY_PROJECT);
    setCurrentStep('setup');
    setCompletedSteps(new Set());
    setSubView('form');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/6 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
            <Network size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-tight">Puzzle Dependency Auditor</h1>
            <p className="text-xs text-slate-500">Escape Room Design QA — Solvability & Dependency Checker</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Design QA Tool
          </span>

          {ctx && ctx.rooms.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowResumeMenu((v) => !v)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors"
              >
                {loadingRoom ? <Loader2 size={13} className="animate-spin" /> : <DoorOpen size={13} />} Rooms <ChevronDown size={11} />
              </button>
              {showResumeMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowResumeMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-30 w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
                    {ctx.rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => selectRoom(room)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-slate-800 last:border-0 ${
                          room.id === activeRoomId ? 'bg-cyan-500/10' : 'hover:bg-slate-800'
                        }`}
                      >
                        <span className={`text-sm truncate ${room.id === activeRoomId ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {room.title}
                        </span>
                        {room.id === activeRoomId && (
                          <span className="text-xs text-cyan-400 shrink-0 ml-2">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={loadSample}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
          >
            <FlaskConical size={13} /> Load Sample
          </button>
          <button
            onClick={resetProject}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/8 hover:bg-white/8 transition-colors"
          >
            <RotateCcw size={12} /> New Project
          </button>
          {project.setup.title && (
            <span className="text-xs text-slate-500 max-w-40 truncate" title={project.setup.title}>
              {project.setup.title}
            </span>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="relative z-10 flex flex-1 gap-0 overflow-hidden">
        {/* Left rail */}
        <div className="w-52 flex-shrink-0 border-r border-white/6 p-4 bg-slate-950/50">
          <ProgressRail
            currentStep={currentStep}
            onStep={goToStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Main workspace — keyed on the active room so switching rooms remounts the
            step views with the freshly loaded audit (forces a clean refresh). */}
        <main key={activeRoomId ?? 'no-room'} className="flex-1 overflow-y-auto p-8">
          {currentStep === 'setup' && (
            <ProjectSetupForm
              setup={project.setup}
              onChange={setup => setProject(p => ({ ...p, setup }))}
              onNext={() => nextStep('setup')}
            />
          )}

          {currentStep === 'stages' && (
            <StageBuilder
              stages={project.stages}
              onChange={stages => setProject(p => ({ ...p, stages }))}
              onNext={() => nextStep('stages')}
            />
          )}

          {currentStep === 'nodes' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex gap-2">
                <button
                  onClick={() => setSubView('form')}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                    subView === 'form'
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      : 'bg-white/3 text-slate-400 border-white/8 hover:border-white/15'
                  }`}
                >
                  Node Editor
                </button>
                <button
                  onClick={() => setSubView('graph')}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                    subView === 'graph'
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      : 'bg-white/3 text-slate-400 border-white/8 hover:border-white/15'
                  }`}
                >
                  Graph Preview
                </button>
              </div>
              {subView === 'form' ? (
                <NodeBuilder
                  nodes={project.nodes}
                  stages={project.stages}
                  onChange={nodes => setProject(p => ({ ...p, nodes }))}
                  onNext={() => nextStep('nodes')}
                />
              ) : (
                <GraphPreview nodes={project.nodes} stages={project.stages} />
              )}
            </div>
          )}

          {currentStep === 'dependencies' && (
            <DependencyMatrix
              nodes={project.nodes}
              stages={project.stages}
              onChange={nodes => setProject(p => ({ ...p, nodes }))}
              onNext={() => nextStep('dependencies')}
            />
          )}

          {currentStep === 'audit' && (
            <AuditPanel
              auditResult={project.auditResult}
              nodes={project.nodes}
              onRunAudit={runAudit}
              onNext={() => nextStep('audit')}
            />
          )}

          {currentStep === 'export' && (
            <ExportPanel project={project} />
          )}
        </main>

        {/* Right summary */}
        <div className="w-64 flex-shrink-0 border-l border-white/6 p-4 bg-slate-950/50 overflow-y-auto">
          <SummaryPanel project={project} />
        </div>
      </div>
    </div>
  );
}
