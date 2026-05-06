import { Lock, Key, Box, Search, Puzzle, Eye, GitMerge, Flag, ArrowRight, Info, type LucideIcon } from 'lucide-react';
import { PuzzleNode, NodeType, Stage } from '../types';

interface Props {
  nodes: PuzzleNode[];
  stages: Stage[];
}

const TYPE_ICON: Record<NodeType, LucideIcon> = {
  puzzle: Puzzle,
  clue: Search,
  lock: Lock,
  prop: Box,
  item: Key,
  reveal: Eye,
  gate: GitMerge,
  finale: Flag,
};

const TYPE_COLOR: Record<NodeType, string> = {
  puzzle: 'border-cyan-500/40 bg-cyan-500/8 text-cyan-300',
  clue: 'border-sky-500/40 bg-sky-500/8 text-sky-300',
  lock: 'border-amber-500/40 bg-amber-500/8 text-amber-300',
  prop: 'border-slate-500/40 bg-slate-500/8 text-slate-300',
  item: 'border-emerald-500/40 bg-emerald-500/8 text-emerald-300',
  reveal: 'border-violet-500/40 bg-violet-500/8 text-violet-300',
  gate: 'border-orange-500/40 bg-orange-500/8 text-orange-300',
  finale: 'border-red-500/40 bg-red-500/8 text-red-300',
};

function NodeChip({ node }: { node: PuzzleNode }) {
  const Icon = TYPE_ICON[node.type];
  const color = TYPE_COLOR[node.type];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${color}`}>
      <Icon size={12} />
      <span className="truncate max-w-32">{node.label}</span>
      {node.accessibleAtStart && (
        <span className="ml-auto text-xs px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-normal">start</span>
      )}
    </div>
  );
}

export default function GraphPreview({ nodes, stages }: Props) {
  // Build edges: for each node, map each require token to the node(s) that reward it
  const rewardToNode = new Map<string, PuzzleNode[]>();
  for (const node of nodes) {
    for (const r of node.rewards) {
      const existing = rewardToNode.get(r) ?? [];
      existing.push(node);
      rewardToNode.set(r, existing);
    }
  }

  interface Edge { from: PuzzleNode; to: PuzzleNode; token: string }
  const edges: Edge[] = [];
  for (const node of nodes) {
    for (const req of node.requires) {
      const sources = rewardToNode.get(req) ?? [];
      for (const src of sources) {
        edges.push({ from: src, to: node, token: req });
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Graph Preview</h2>
        <p className="text-sm text-slate-400">
          Lightweight dependency overview grouped by stage. For interactive flowchart editing, export to Puzzle Flow Visualizer.
        </p>
      </div>

      <div className="panel bg-sky-500/5 border-sky-500/20 text-xs text-sky-300 flex gap-3">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <p>This is a structural preview, not a full diagram editor. For full flowchart editing with drag-and-drop nodes,
          export this graph to <span className="font-semibold text-cyan-300">Puzzle Flow Visualizer</span>.</p>
      </div>

      <div className="space-y-6">
        {stages.map(stage => {
          const stageNodes = nodes.filter(n => n.stageId === stage.id);
          if (stageNodes.length === 0) return null;
          return (
            <div key={stage.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-xs font-semibold text-cyan-500/70 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
                  Stage {stage.order}: {stage.label}
                </span>
                <div className="h-px flex-1 bg-white/8" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {stageNodes.map(node => <NodeChip key={node.id} node={node} />)}
              </div>
            </div>
          );
        })}
      </div>

      {edges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Dependency Edges ({edges.length})</h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {edges.map((edge, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-white/2 border border-white/5">
                <span className={`flex items-center gap-1 ${TYPE_COLOR[edge.from.type]}`}>
                  {(() => { const Icon = TYPE_ICON[edge.from.type]; return <Icon size={11} />; })()}
                  <span className="truncate max-w-28">{edge.from.label}</span>
                </span>
                <ArrowRight size={11} className="text-slate-600 flex-shrink-0" />
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono flex-shrink-0">
                  {edge.token}
                </span>
                <ArrowRight size={11} className="text-slate-600 flex-shrink-0" />
                <span className={`flex items-center gap-1 ${TYPE_COLOR[edge.to.type]}`}>
                  {(() => { const Icon = TYPE_ICON[edge.to.type]; return <Icon size={11} />; })()}
                  <span className="truncate max-w-28">{edge.to.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
