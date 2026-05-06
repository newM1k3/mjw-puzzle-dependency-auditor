import { CheckCircle, Settings, Layers, Box, GitBranch, Search, Download, type LucideIcon } from 'lucide-react';
import { Step } from '../types';

interface Props {
  currentStep: Step;
  onStep: (step: Step) => void;
  completedSteps: Set<Step>;
}

const steps: { id: Step; label: string; icon: LucideIcon }[] = [
  { id: 'setup', label: 'Project Setup', icon: Settings },
  { id: 'stages', label: 'Stages', icon: Layers },
  { id: 'nodes', label: 'Nodes', icon: Box },
  { id: 'dependencies', label: 'Dependencies', icon: GitBranch },
  { id: 'audit', label: 'Audit', icon: Search },
  { id: 'export', label: 'Export', icon: Download },
];

export default function ProgressRail({ currentStep, onStep, completedSteps }: Props) {
  return (
    <nav className="w-52 flex-shrink-0 flex flex-col gap-1 pt-2">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isDone = completedSteps.has(step.id);
        const Icon = step.icon;
        return (
          <button
            key={step.id}
            onClick={() => onStep(step.id)}
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}
            `}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-full" />
            )}
            <span className={`flex-shrink-0 ${isActive ? 'text-cyan-400' : isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isDone && !isActive
                ? <CheckCircle size={16} />
                : <Icon size={16} />
              }
            </span>
            <span>{step.label}</span>
            <span className={`ml-auto text-xs w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 font-mono
              ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-500'}`}>
              {idx + 1}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
