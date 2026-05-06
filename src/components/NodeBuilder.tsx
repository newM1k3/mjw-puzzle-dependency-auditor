import { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, Lock, Key, Box, Search, Puzzle, Eye, GitMerge, Flag, Tag, type LucideIcon } from 'lucide-react';
import { PuzzleNode, NodeType, Stage } from '../types';
import { nanoid } from '../lib/nanoid';

interface Props {
  nodes: PuzzleNode[];
  stages: Stage[];
  onChange: (nodes: PuzzleNode[]) => void;
  onNext: () => void;
}

const NODE_TYPES: { value: NodeType; label: string; icon: LucideIcon }[] = [
  { value: 'puzzle', label: 'Puzzle', icon: Puzzle },
  { value: 'clue', label: 'Clue', icon: Search },
  { value: 'lock', label: 'Lock', icon: Lock },
  { value: 'prop', label: 'Prop', icon: Box },
  { value: 'item', label: 'Item', icon: Key },
  { value: 'reveal', label: 'Reveal', icon: Eye },
  { value: 'gate', label: 'Gate', icon: GitMerge },
  { value: 'finale', label: 'Finale', icon: Flag },
];

const NODE_TYPE_COLORS: Record<NodeType, string> = {
  puzzle: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  clue: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  lock: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  prop: 'text-slate-300 bg-slate-500/10 border-slate-500/30',
  item: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  reveal: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  gate: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  finale: 'text-red-400 bg-red-500/10 border-red-500/30',
};

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');

  const commit = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-white/3 border border-white/8 min-h-9 focus-within:border-cyan-500/40 transition-colors">
      {value.map(tag => (
        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-200">
          <Tag size={10} className="text-slate-400" />{tag}
          <button onClick={() => onChange(value.filter(v => v !== tag))} className="text-slate-500 hover:text-slate-200 ml-0.5">×</button>
        </span>
      ))}
      <input
        className="flex-1 min-w-24 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none"
        placeholder={value.length === 0 ? placeholder : 'add more...'}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
          if (e.key === 'Backspace' && !input && value.length > 0) onChange(value.slice(0, -1));
        }}
        onBlur={commit}
      />
    </div>
  );
}

function NodeCard({ node, stages, onUpdate, onRemove }: {
  node: PuzzleNode;
  stages: Stage[];
  onUpdate: (patch: Partial<PuzzleNode>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const TypeDef = NODE_TYPES.find(t => t.value === node.type)!;
  const TypeIcon = TypeDef.icon;
  const colorClass = NODE_TYPE_COLORS[node.type];

  return (
    <div className="panel transition-all duration-200">
      <div className="flex items-center gap-3">
        <span className={`flex items-center justify-center w-7 h-7 rounded-md border text-xs flex-shrink-0 ${colorClass}`}>
          <TypeIcon size={13} />
        </span>
        <input
          className="flex-1 bg-transparent text-sm font-medium text-slate-100 placeholder-slate-600 outline-none"
          placeholder="Node label..."
          value={node.label}
          onChange={e => onUpdate({ label: e.target.value })}
        />
        <button onClick={() => setExpanded(x => !x)} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
          <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={onRemove} className="text-slate-600 hover:text-red-400 transition-colors p-1">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <select
          className="field-select text-xs py-1"
          value={node.type}
          onChange={e => onUpdate({ type: e.target.value as NodeType })}
        >
          {NODE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select
          className="field-select text-xs py-1 flex-1"
          value={node.stageId}
          onChange={e => onUpdate({ stageId: e.target.value })}
        >
          {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3 h-3 rounded accent-cyan-500"
            checked={node.accessibleAtStart}
            onChange={e => onUpdate({ accessibleAtStart: e.target.checked })}
          />
          Start
        </label>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 pt-3 border-t border-white/5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Requires <span className="text-slate-600 font-normal">(press Enter to add)</span></label>
              <TagInput
                value={node.requires}
                onChange={v => onUpdate({ requires: v })}
                placeholder="e.g. brass_key, invoice_date"
              />
            </div>
            <div>
              <label className="field-label">Rewards <span className="text-slate-600 font-normal">(press Enter to add)</span></label>
              <TagInput
                value={node.rewards}
                onChange={v => onUpdate({ rewards: v })}
                placeholder="e.g. vault_code, blue_keycard"
              />
            </div>
          </div>
          {node.type === 'lock' && (
            <div>
              <label className="field-label">Answer Format</label>
              <input
                className="field-input text-xs"
                placeholder="e.g. 4-digit number, 5-letter word, keyed lock"
                value={node.answerFormat ?? ''}
                onChange={e => onUpdate({ answerFormat: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="field-label">Notes <span className="text-slate-600 font-normal">(optional)</span></label>
            <textarea
              className="field-input text-xs resize-none"
              rows={2}
              placeholder="Designer notes, hints, or implementation reminders..."
              value={node.notes ?? ''}
              onChange={e => onUpdate({ notes: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function NodeBuilder({ nodes, stages, onChange, onNext }: Props) {
  const addNode = () => {
    const newNode: PuzzleNode = {
      id: `node_${nanoid()}`,
      type: 'puzzle',
      label: '',
      stageId: stages[0]?.id ?? '',
      accessibleAtStart: false,
      requires: [],
      rewards: [],
    };
    onChange([...nodes, newNode]);
  };

  const updateNode = (id: string, patch: Partial<PuzzleNode>) => {
    onChange(nodes.map(n => n.id === id ? { ...n, ...patch } : n));
  };

  const removeNode = (id: string) => onChange(nodes.filter(n => n.id !== id));

  const byStage = stages.map(stage => ({
    stage,
    nodes: nodes.filter(n => n.stageId === stage.id),
  }));

  const unassigned = nodes.filter(n => !stages.find(s => s.id === n.stageId));

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Node Builder</h2>
        <p className="text-sm text-slate-400">
          Add every puzzle, clue, lock, prop, item, reveal, gate, and finale. Requirements and rewards define the dependency edges.
        </p>
      </div>

      <div className="space-y-6">
        {byStage.map(({ stage, nodes: stageNodes }) => (
          <div key={stage.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Stage {stage.order}
              </span>
              <h3 className="text-sm font-semibold text-slate-300">{stage.label}</h3>
              <span className="text-xs text-slate-600">— {stageNodes.length} node{stageNodes.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2 ml-2">
              {stageNodes.map(node => (
                <NodeCard key={node.id} node={node} stages={stages}
                  onUpdate={patch => updateNode(node.id, patch)}
                  onRemove={() => removeNode(node.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {unassigned.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-amber-400 mb-2">Unassigned Nodes</h3>
            <div className="space-y-2">
              {unassigned.map(node => (
                <NodeCard key={node.id} node={node} stages={stages}
                  onUpdate={patch => updateNode(node.id, patch)}
                  onRemove={() => removeNode(node.id)}
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={addNode}
          className="w-full py-3 border border-dashed border-white/10 rounded-lg text-sm text-slate-500
            hover:border-cyan-500/30 hover:text-cyan-400 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add Node
        </button>
      </div>

      <button
        onClick={onNext}
        disabled={nodes.length === 0}
        className="btn-primary flex items-center gap-2"
      >
        Continue to Dependencies <ChevronRight size={16} />
      </button>
    </div>
  );
}
