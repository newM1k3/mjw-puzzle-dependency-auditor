import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { AuditIssue, PuzzleNode } from '../types';

interface Props {
  issue: AuditIssue;
  nodes: PuzzleNode[];
}

const SEVERITY_STYLES = {
  critical: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    badge: 'bg-red-900/50 text-red-400 border-red-500/30',
    icon: AlertCircle,
    iconColor: 'text-red-400',
    label: 'Critical',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-900/50 text-amber-400 border-amber-500/30',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    label: 'Warning',
  },
  improvement: {
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/5',
    badge: 'bg-sky-900/50 text-sky-400 border-sky-500/30',
    icon: Info,
    iconColor: 'text-sky-400',
    label: 'Improvement',
  },
  clean: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    label: 'Clean',
  },
};

export default function IssueCard({ issue, nodes }: Props) {
  const style = SEVERITY_STYLES[issue.severity];
  const Icon = style.icon;
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${style.border} ${style.bg}`}>
      <div className="flex items-start gap-3">
        <Icon size={16} className={`flex-shrink-0 mt-0.5 ${style.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${style.badge}`}>
              {style.label}
            </span>
            <h4 className="text-sm font-semibold text-slate-200">{issue.title}</h4>
          </div>

          {issue.affectedNodeIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {issue.affectedNodeIds.map(id => {
                const node = nodeById.get(id);
                return (
                  <span key={id} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/8">
                    {node?.label ?? id}
                  </span>
                );
              })}
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">{issue.explanation}</p>
        </div>
      </div>

      <div className="ml-7 pl-3 border-l-2 border-white/10">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Suggested Fix</p>
        <p className="text-xs text-slate-300 leading-relaxed">{issue.suggestedFix}</p>
      </div>
    </div>
  );
}
