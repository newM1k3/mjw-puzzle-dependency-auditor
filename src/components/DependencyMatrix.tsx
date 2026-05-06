import { useState } from 'react';
import { Info, ChevronRight, Tag } from 'lucide-react';
import { PuzzleNode, Stage } from '../types';

interface Props {
  nodes: PuzzleNode[];
  stages: Stage[];
  onChange: (nodes: PuzzleNode[]) => void;
  onNext: () => void;
}

const NODE_TYPE_BADGE: Record<string, string> = {
  puzzle: 'text-cyan-400 bg-cyan-500/10',
  clue: 'text-sky-400 bg-sky-500/10',
  lock: 'text-amber-400 bg-amber-500/10',
  prop: 'text-slate-400 bg-slate-500/10',
  item: 'text-emerald-400 bg-emerald-500/10',
  reveal: 'text-violet-400 bg-violet-500/10',
  gate: 'text-orange-400 bg-orange-500/10',
  finale: 'text-red-400 bg-red-500/10',
};

function InlineTagEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');

  const openEdit = () => {
    setRaw(value.join(', '));
    setEditing(true);
  };

  const commit = () => {
    const tags = raw.split(',').map(t => t.trim()).filter(Boolean);
    onChange(tags);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        className="w-full bg-slate-800 border border-cyan-500/40 rounded px-2 py-1 text-xs text-slate-200 outline-none"
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
      />
    );
  }

  return (
    <div
      onClick={openEdit}
      className="flex flex-wrap gap-1 min-h-6 cursor-text p-1 rounded hover:bg-white/3 transition-colors"
    >
      {value.length > 0
        ? value.map(t => (
          <span key={t} className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded bg-slate-700 text-slate-300">
            <Tag size={9} className="text-slate-500" />{t}
          </span>
        ))
        : <span className="text-xs text-slate-600 italic">click to add...</span>
      }
    </div>
  );
}

export default function DependencyMatrix({ nodes, stages, onChange, onNext }: Props) {
  const stageById = new Map(stages.map(s => [s.id, s]));

  const updateNode = (id: string, patch: Partial<PuzzleNode>) => {
    onChange(nodes.map(n => n.id === id ? { ...n, ...patch } : n));
  };

  const allRewards = new Set(nodes.flatMap(n => n.rewards));
  const allRequires = new Set(nodes.flatMap(n => n.requires));

  const missingTokens = [...allRequires].filter(r => !allRewards.has(r));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Dependency Matrix</h2>
        <p className="text-sm text-slate-400">
          Review and edit what each node requires and what it rewards. Click any tag cell to edit inline.
        </p>
      </div>

      <div className="flex gap-3 p-3 rounded-lg bg-sky-500/5 border border-sky-500/20 text-xs text-sky-300">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-medium">How to read this matrix:</span> A node's <em>Requirements</em> are
          items, clues, or codes that players must have <em>before</em> they can interact with it.
          A node's <em>Rewards</em> are what players gain <em>after</em> completing or accessing it.
          Token names must match exactly between requires and rewards fields to form a valid dependency edge.
        </div>
      </div>

      {missingTokens.length > 0 && (
        <div className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-300">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Missing sources detected:</span> These tokens appear as requirements
            but are not produced by any reward: {missingTokens.map(t => (
              <span key={t} className="inline-flex items-center gap-0.5 mx-0.5 px-1.5 py-0.5 rounded bg-red-900/40 text-red-300">
                <Tag size={9} />{t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-48">Node</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Type</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">Stage</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Requires</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rewards</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Start</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Format</th>
            </tr>
          </thead>
          <tbody>
            {stages.map(stage => {
              const stageNodes = nodes.filter(n => n.stageId === stage.id);
              if (stageNodes.length === 0) return null;
              return [
                <tr key={`header_${stage.id}`} className="border-b border-white/5">
                  <td colSpan={7} className="py-2 px-3">
                    <span className="text-xs font-semibold text-cyan-500/80">
                      Stage {stage.order}: {stage.label}
                    </span>
                  </td>
                </tr>,
                ...stageNodes.map(node => (
                  <tr key={node.id} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                    <td className="py-2 px-3">
                      <span className="text-slate-200 font-medium text-xs">{node.label}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${NODE_TYPE_BADGE[node.type] ?? 'text-slate-400'}`}>
                        {node.type}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-xs text-slate-500">{stageById.get(node.stageId)?.label}</span>
                    </td>
                    <td className="py-2 px-3">
                      <InlineTagEditor value={node.requires} onChange={v => updateNode(node.id, { requires: v })} />
                    </td>
                    <td className="py-2 px-3">
                      <InlineTagEditor value={node.rewards} onChange={v => updateNode(node.id, { rewards: v })} />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 accent-cyan-500"
                        checked={node.accessibleAtStart}
                        onChange={e => updateNode(node.id, { accessibleAtStart: e.target.checked })}
                      />
                    </td>
                    <td className="py-2 px-3">
                      {node.type === 'lock' ? (
                        <input
                          className="w-full bg-transparent text-xs text-slate-400 placeholder-slate-600 outline-none border-b border-transparent focus:border-cyan-500/40 transition-colors py-0.5"
                          placeholder="format..."
                          value={node.answerFormat ?? ''}
                          onChange={e => updateNode(node.id, { answerFormat: e.target.value })}
                        />
                      ) : (
                        <span className="text-xs text-slate-700">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ];
            })}
          </tbody>
        </table>
      </div>

      <button onClick={onNext} className="btn-primary flex items-center gap-2">
        Run Dependency Audit <ChevronRight size={16} />
      </button>
    </div>
  );
}
