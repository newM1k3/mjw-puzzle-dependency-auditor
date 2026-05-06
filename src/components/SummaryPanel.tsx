import { Network, AlertTriangle, CheckCircle, TrendingUp, Box, GitBranch } from 'lucide-react';
import { Project } from '../types';

interface Props {
  project: Project;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 90 ? '#22d3ee' : score >= 70 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <span className="absolute text-xl font-bold text-slate-100" style={{ color }}>{score}</span>
    </div>
  );
}

export default function SummaryPanel({ project }: Props) {
  const audit = project.auditResult;
  const nodeCount = project.nodes.length;
  const depCount = project.nodes.reduce((acc, n) => acc + n.requires.length, 0);
  const stageCount = project.stages.length;

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col gap-4">
      <div className="panel">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Network size={12} /> Project Stats
        </h3>
        <div className="space-y-2">
          <StatRow icon={<Box size={13} className="text-cyan-400" />} label="Nodes" value={nodeCount} />
          <StatRow icon={<GitBranch size={13} className="text-cyan-400" />} label="Dependencies" value={depCount} />
          <StatRow icon={<TrendingUp size={13} className="text-cyan-400" />} label="Stages" value={stageCount} />
        </div>
      </div>

      {audit ? (
        <div className="panel">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle size={12} /> Last Audit
          </h3>
          <div className="flex flex-col items-center gap-3">
            <ScoreRing score={audit.score} />
            <div className="text-center">
              <p className={`text-sm font-semibold ${
                audit.score >= 90 ? 'text-cyan-400' :
                audit.score >= 70 ? 'text-amber-400' :
                audit.score >= 40 ? 'text-orange-400' : 'text-red-400'
              }`}>{audit.label}</p>
            </div>
            <div className="w-full space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Critical
                </span>
                <span className="font-mono text-red-400">{audit.criticalCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Warnings
                </span>
                <span className="font-mono text-amber-400">{audit.warningCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" /> Improvements
                </span>
                <span className="font-mono text-sky-400">{audit.improvementCount}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="panel border-dashed">
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <AlertTriangle size={20} className="text-slate-600" />
            <p className="text-xs text-slate-500">Run the audit to see solvability score</p>
          </div>
        </div>
      )}

      <div className="panel">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-300 font-medium">Puzzle Dependency Auditor</span> checks that every
          clue, item, lock, and puzzle can be reached and solved in a valid order. For lock-to-answer
          mapping, use <span className="text-cyan-400">LockMap Studio</span>.
        </p>
      </div>
    </aside>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-xs text-slate-400">{icon}{label}</span>
      <span className="font-mono text-sm text-slate-200">{value}</span>
    </div>
  );
}
