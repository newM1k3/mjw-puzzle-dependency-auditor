export type NodeType = 'puzzle' | 'clue' | 'lock' | 'prop' | 'item' | 'reveal' | 'gate' | 'finale';
export type Severity = 'critical' | 'warning' | 'improvement' | 'clean';
export type RoomStructure = 'linear' | 'semi-linear' | 'open-world' | 'multi-room';
export type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'extreme';

export interface Stage {
  id: string;
  label: string;
  order: number;
  description?: string;
}

export interface PuzzleNode {
  id: string;
  type: NodeType;
  label: string;
  stageId: string;
  accessibleAtStart: boolean;
  requires: string[];
  rewards: string[];
  answerFormat?: string;
  notes?: string;
}

export interface AuditIssue {
  id: string;
  severity: Severity;
  title: string;
  affectedNodeIds: string[];
  explanation: string;
  suggestedFix: string;
}

export interface AuditResult {
  score: number;
  label: string;
  criticalCount: number;
  warningCount: number;
  improvementCount: number;
  issues: AuditIssue[];
  cleanChecks: string[];
}

export interface ProjectSetup {
  title: string;
  theme: string;
  roomStructure: RoomStructure;
  targetDuration: number;
  difficulty: Difficulty;
  minPlayers: number;
  maxPlayers: number;
}

export interface Project {
  setup: ProjectSetup;
  stages: Stage[];
  nodes: PuzzleNode[];
  auditResult: AuditResult | null;
}

export type Step = 'setup' | 'stages' | 'nodes' | 'dependencies' | 'audit' | 'export';
