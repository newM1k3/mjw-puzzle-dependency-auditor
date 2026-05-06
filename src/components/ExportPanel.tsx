import { useState } from 'react';
import { Copy, Download, CheckCircle, FileJson, FileText, ExternalLink } from 'lucide-react';
import { Project } from '../types';
import { exportToJson, exportToMarkdown } from '../services/exporters';

interface Props {
  project: Project;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy} className={`btn-ghost flex items-center gap-2 text-sm transition-colors duration-200 ${copied ? 'text-emerald-400' : ''}`}>
      {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPanel({ project }: Props) {
  const [activeTab, setActiveTab] = useState<'json' | 'markdown'>('json');
  const jsonContent = exportToJson(project);
  const markdownContent = exportToMarkdown(project);
  const slug = project.setup.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'audit-export';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-100 mb-1">Export & Handoff</h2>
        <p className="text-sm text-slate-400">
          Export the project graph and audit results for integration with LockMap Studio or Puzzle Flow Visualizer.
        </p>
      </div>

      {!project.auditResult && (
        <div className="panel border-amber-500/20 bg-amber-500/5 text-amber-300 text-sm flex gap-3">
          <span className="flex-shrink-0 mt-0.5">⚠</span>
          <p>No audit has been run yet. The export will include graph data but no audit results. Run the audit first for a complete export.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <IntegrationCard
          title="Puzzle Flow Visualizer"
          description="Import the JSON export to render an interactive node-based flowchart of the dependency graph."
          action="Export JSON for Flow Visualizer"
          hint="Use the nodes and edges arrays with @xyflow/react"
        />
        <IntegrationCard
          title="LockMap Studio"
          description="Review lock nodes with ambiguous answer formats for proper mapping treatment."
          action="Export for LockMap Studio"
          hint={
            project.auditResult?.issues.some(i => i.title.startsWith('Ambiguous'))
              ? 'Ambiguous format issues detected — recommended handoff'
              : 'No ambiguous format issues in current audit'
          }
          highlight={project.auditResult?.issues.some(i => i.title.startsWith('Ambiguous'))}
        />
      </div>

      <div className="panel space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 p-1 rounded-lg bg-white/5">
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'json' ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileJson size={14} /> JSON
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'markdown' ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={14} /> Markdown
            </button>
          </div>
          <div className="flex gap-2">
            <CopyButton
              text={activeTab === 'json' ? jsonContent : markdownContent}
              label={`Copy ${activeTab === 'json' ? 'JSON' : 'Markdown'}`}
            />
            <button
              onClick={() => downloadFile(
                activeTab === 'json' ? jsonContent : markdownContent,
                `${slug}-audit.${activeTab === 'json' ? 'json' : 'md'}`,
                activeTab === 'json' ? 'application/json' : 'text/markdown'
              )}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </div>

        <pre className="text-xs text-slate-300 bg-slate-950/50 rounded-lg p-4 overflow-auto max-h-96 font-mono leading-relaxed border border-white/5">
          {activeTab === 'json' ? jsonContent : markdownContent}
        </pre>
      </div>
    </div>
  );
}

function IntegrationCard({ title, description, action, hint, highlight = false }: {
  title: string;
  description: string;
  action: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div className={`panel space-y-3 ${highlight ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
      <div>
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          {title}
          <ExternalLink size={12} className="text-slate-500" />
        </h4>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <p className="text-xs text-slate-600 italic">{hint}</p>
      <button className="btn-ghost text-xs flex items-center gap-2 opacity-60 cursor-default" disabled>
        <ExternalLink size={12} /> {action}
        <span className="ml-auto text-slate-600">— Future Integration</span>
      </button>
    </div>
  );
}
