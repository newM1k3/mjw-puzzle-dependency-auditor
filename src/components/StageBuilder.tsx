import { Plus, Trash2, GripVertical, ChevronRight } from 'lucide-react';
import { Stage } from '../types';
import { nanoid } from '../lib/nanoid';

interface Props {
  stages: Stage[];
  onChange: (stages: Stage[]) => void;
  onNext: () => void;
}

export default function StageBuilder({ stages, onChange, onNext }: Props) {
  const addStage = () => {
    const next: Stage = {
      id: `stage_${nanoid()}`,
      label: '',
      order: stages.length + 1,
      description: '',
    };
    onChange([...stages, next]);
  };

  const updateStage = (id: string, patch: Partial<Stage>) => {
    onChange(stages.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const removeStage = (id: string) => {
    const filtered = stages.filter(s => s.id !== id);
    onChange(filtered.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...stages];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr.map((s, i) => ({ ...s, order: i + 1 })));
  };


  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Stage Builder</h2>
        <p className="text-sm text-slate-400">
          Define the timeline of access. Stages represent zones, rooms, or phases that become available as players progress.
          Stage order determines dependency mismatch detection.
        </p>
      </div>

      <div className="space-y-3">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="panel flex gap-3 items-start">
            <div className="flex flex-col gap-1 pt-1">
              <button onClick={() => moveUp(idx)} disabled={idx === 0}
                className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors p-0.5">
                <GripVertical size={14} />
              </button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Stage Label</label>
                <input
                  className="field-input"
                  placeholder="e.g. Starting Workshop"
                  value={stage.label}
                  onChange={e => updateStage(stage.id, { label: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="field-label">Description <span className="text-slate-600">(optional)</span></label>
                <input
                  className="field-input"
                  placeholder="Brief description of this stage's content or access condition"
                  value={stage.description ?? ''}
                  onChange={e => updateStage(stage.id, { description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-mono text-slate-600 w-5 text-center">#{stage.order}</span>
              <button onClick={() => removeStage(stage.id)}
                className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addStage}
          className="w-full py-3 border border-dashed border-white/10 rounded-lg text-sm text-slate-500
            hover:border-cyan-500/30 hover:text-cyan-400 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Add Stage
        </button>
      </div>

      <button
        onClick={onNext}
        disabled={stages.length === 0 || stages.some(s => !s.label.trim())}
        className="btn-primary flex items-center gap-2"
      >
        Continue to Nodes <ChevronRight size={16} />
      </button>
    </div>
  );
}
