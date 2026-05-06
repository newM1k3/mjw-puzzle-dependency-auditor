import { ChevronRight } from 'lucide-react';
import { ProjectSetup, RoomStructure, Difficulty } from '../types';

interface Props {
  setup: ProjectSetup;
  onChange: (setup: ProjectSetup) => void;
  onNext: () => void;
}

const roomStructures: { value: RoomStructure; label: string; desc: string }[] = [
  { value: 'linear', label: 'Linear', desc: 'One path, puzzles must be solved in order' },
  { value: 'semi-linear', label: 'Semi-Linear', desc: 'Some parallel paths that converge' },
  { value: 'open-world', label: 'Open World', desc: 'Players choose their own order freely' },
  { value: 'multi-room', label: 'Multi-Room', desc: 'Multiple spaces unlocked progressively' },
];

const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
  { value: 'extreme', label: 'Extreme' },
];

export default function ProjectSetupForm({ setup, onChange, onNext }: Props) {
  const update = (patch: Partial<ProjectSetup>) => onChange({ ...setup, ...patch });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Project Setup</h2>
        <p className="text-sm text-slate-400">Define the room's core identity. This context anchors the entire dependency audit.</p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="field-label">Room Title</label>
            <input
              className="field-input"
              placeholder="e.g. The Clockmaker's Last Hour"
              value={setup.title}
              onChange={e => update({ title: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="field-label">Theme / Premise</label>
            <input
              className="field-input"
              placeholder="e.g. Victorian clockmaker mystery — solve the final puzzle before midnight"
              value={setup.theme}
              onChange={e => update({ theme: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="field-label mb-2">Room Structure</label>
          <div className="grid grid-cols-2 gap-2">
            {roomStructures.map(rs => (
              <button
                key={rs.value}
                onClick={() => update({ roomStructure: rs.value })}
                className={`text-left p-3 rounded-lg border transition-all duration-150 ${
                  setup.roomStructure === rs.value
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                    : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{rs.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{rs.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="field-label">Duration (min)</label>
            <input
              className="field-input"
              type="number"
              min={10}
              max={180}
              value={setup.targetDuration}
              onChange={e => update({ targetDuration: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="field-label">Min Players</label>
            <input
              className="field-input"
              type="number"
              min={1}
              max={20}
              value={setup.minPlayers}
              onChange={e => update({ minPlayers: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="field-label">Max Players</label>
            <input
              className="field-input"
              type="number"
              min={1}
              max={20}
              value={setup.maxPlayers}
              onChange={e => update({ maxPlayers: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="field-label mb-2">Difficulty</label>
          <div className="flex gap-2">
            {difficulties.map(d => (
              <button
                key={d.value}
                onClick={() => update({ difficulty: d.value })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                  setup.difficulty === d.value
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                    : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!setup.title.trim()}
        className="btn-primary flex items-center gap-2"
      >
        Continue to Stages <ChevronRight size={16} />
      </button>
    </div>
  );
}
