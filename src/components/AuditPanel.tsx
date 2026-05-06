import { Play, CheckCircle, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { AuditResult, PuzzleNode } from '../types';
import IssueCard from './IssueCard';

interface Props {
  auditResult: AuditResult | null;
  nodes: PuzzleNode[];
  onRunAudit: () => void;
  onNext: () => void;
}

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  const color = score >= 90 ? '#22d3ee' : score >= 70 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="136" height="136" className="-rotate-90">
          <circle cx="68" cy="68" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-100" style={{ color }}>{score}</span>
          <span className="text-xs text-slate-500 mt-1">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold" style={{ color }}>{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">Solvability Score</p>
      </div>
    </div>
  );
}

export default function AuditPanel({ auditResult, nodes, onRunAudit, onNext }: Props) {
  const criticals = auditResult?.issues.filter(i => i.severity === 'critical') ?? [];
  const warnings = auditResult?.issues.filter(i => i.severity === 'warning') ?? [];
  const improvements = auditResult?.issues.filter(i => i.severity === 'improvement') ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Dependency Audit</h2>
        <p className="text-sm text-slate-400">
          The audit engine runs deterministic checks against your dependency graph. All issues are rule-based —
          no AI or external calls required.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRunAudit}
          className="btn-primary flex items-center gap-2"
        >
          <Play size={15} /> Run Dependency Audit
        </button>
        {auditResult && (
          <button onClick={onNext} className="btn-ghost flex items-center gap-2">
            Export Results <ExternalLink size={14} />
          </button>
        )}
      </div>

      {!auditResult && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/3 flex items-center justify-center mb-4">
            <Play size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">Audit not yet run</p>
          <p className="text-slate-600 text-sm mt-1">Click "Run Dependency Audit" to analyze your graph</p>
        </div>
      )}

      {auditResult && (
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 panel flex items-center justify-center py-6">
              <ScoreDisplay score={auditResult.score} label={auditResult.label} />
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-3">
              <StatCard
                icon={<AlertCircle size={18} />}
                value={auditResult.criticalCount}
                label="Critical"
                color="text-red-400"
                bg="bg-red-500/5 border-red-500/20"
              />
              <StatCard
                icon={<AlertTriangle size={18} />}
                value={auditResult.warningCount}
                label="Warnings"
                color="text-amber-400"
                bg="bg-amber-500/5 border-amber-500/20"
              />
              <StatCard
                icon={<Info size={18} />}
                value={auditResult.improvementCount}
                label="Improvements"
                color="text-sky-400"
                bg="bg-sky-500/5 border-sky-500/20"
              />
              {auditResult.cleanChecks.length > 0 && (
                <div className="col-span-3 panel bg-emerald-500/5 border-emerald-500/20">
                  <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle size={13} /> {auditResult.cleanChecks.length} Passed Check{auditResult.cleanChecks.length !== 1 ? 's' : ''}
                  </p>
                  <ul className="space-y-1">
                    {auditResult.cleanChecks.map((check, i) => (
                      <li key={i} className="text-xs text-emerald-300/80 flex items-start gap-1.5">
                        <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-emerald-500" />
                        {check}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="panel bg-sky-500/5 border-sky-500/20 text-xs text-sky-300 flex gap-3">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <p>
              This audit checks <strong>dependency logic</strong> — whether each node can be reached and solved in a valid order.
              For answer-to-lock ambiguity and mapping issues, export the relevant nodes to{' '}
              <span className="font-semibold text-cyan-300">LockMap Studio</span>.
              For visual flowchart editing, export to{' '}
              <span className="font-semibold text-cyan-300">Puzzle Flow Visualizer</span>.
            </p>
          </div>

          {criticals.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle size={14} /> Critical Issues ({criticals.length})
              </h3>
              <div className="space-y-3">
                {criticals.map(issue => <IssueCard key={issue.id} issue={issue} nodes={nodes} />)}
              </div>
            </section>
          )}

          {warnings.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> Warnings ({warnings.length})
              </h3>
              <div className="space-y-3">
                {warnings.map(issue => <IssueCard key={issue.id} issue={issue} nodes={nodes} />)}
              </div>
            </section>
          )}

          {improvements.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info size={14} /> Improvements ({improvements.length})
              </h3>
              <div className="space-y-3">
                {improvements.map(issue => <IssueCard key={issue.id} issue={issue} nodes={nodes} />)}
              </div>
            </section>
          )}

          {auditResult.issues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle size={32} className="text-emerald-400 mb-3" />
              <p className="text-emerald-300 font-semibold">No issues detected</p>
              <p className="text-slate-500 text-sm mt-1">Your dependency graph passed all checks</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, color, bg }: {
  icon: React.ReactNode; value: number; label: string; color: string; bg: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col items-center gap-2 ${bg}`}>
      <span className={color}>{icon}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
