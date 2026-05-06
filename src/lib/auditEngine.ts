import { Stage, PuzzleNode, AuditResult, AuditIssue } from '../types';

function scoreLabel(score: number): string {
  if (score >= 90) return 'Clean Build Candidate';
  if (score >= 70) return 'Playable With Revisions';
  if (score >= 40) return 'High Risk';
  return 'Not Ready to Build';
}


export function runDependencyAudit(stages: Stage[], nodes: PuzzleNode[]): AuditResult {
  const issues: AuditIssue[] = [];
  const cleanChecks: string[] = [];
  let issueCounter = 0;

  const issueId = () => `issue_${++issueCounter}`;

  // Build indexes
  const allRewards = new Set<string>();
  const allRequires = new Set<string>();
  const rewardToNodes = new Map<string, string[]>(); // reward token -> nodeIds that produce it
  const nodeById = new Map<string, PuzzleNode>();
  const stageOrderById = new Map<string, number>();

  for (const stage of stages) {
    stageOrderById.set(stage.id, stage.order);
  }

  for (const node of nodes) {
    nodeById.set(node.id, node);
    for (const r of node.rewards) {
      allRewards.add(r);
      const existing = rewardToNodes.get(r) ?? [];
      existing.push(node.id);
      rewardToNodes.set(r, existing);
    }
    for (const req of node.requires) {
      allRequires.add(req);
    }
  }

  // Compute reachable set via BFS
  const reachable = new Set<string>();
  const earnedRewards = new Set<string>();
  const queue: PuzzleNode[] = nodes.filter(n => n.accessibleAtStart);
  for (const n of queue) reachable.add(n.id);

  let changed = true;
  while (changed) {
    changed = false;
    // Add rewards of reachable solved nodes
    for (const id of reachable) {
      const node = nodeById.get(id)!;
      for (const r of node.rewards) {
        if (!earnedRewards.has(r)) {
          earnedRewards.add(r);
          changed = true;
        }
      }
    }
    // Unlock nodes whose requirements are all met
    for (const node of nodes) {
      if (reachable.has(node.id)) continue;
      if (node.requires.length === 0) continue;
      if (node.requires.every(r => earnedRewards.has(r))) {
        reachable.add(node.id);
        changed = true;
      }
    }
  }

  // CHECK 1: Locked start
  const startNodes = nodes.filter(n => n.accessibleAtStart);
  if (startNodes.length === 0) {
    issues.push({
      id: issueId(),
      severity: 'critical',
      title: 'Locked Start: No accessible nodes at start',
      affectedNodeIds: [],
      explanation: 'Players have no puzzles, clues, or items they can interact with when the game begins. The room is immediately softlocked.',
      suggestedFix: 'Mark at least one node (typically a starting clue, prop, or puzzle) as "Accessible at Start".',
    });
  } else {
    cleanChecks.push('At least one node is accessible at game start.');
  }

  // CHECK 2: Missing source
  const missingSource: { node: PuzzleNode; req: string }[] = [];
  for (const node of nodes) {
    for (const req of node.requires) {
      const producers = rewardToNodes.get(req);
      const isStartItem = nodes.some(n => n.accessibleAtStart && n.rewards.includes(req));
      if ((!producers || producers.length === 0) && !isStartItem) {
        missingSource.push({ node, req });
      }
    }
  }
  if (missingSource.length > 0) {
    const grouped = new Map<string, string[]>();
    for (const { node, req } of missingSource) {
      const existing = grouped.get(req) ?? [];
      existing.push(node.id);
      grouped.set(req, existing);
    }
    for (const [req, affectedIds] of grouped) {
      issues.push({
        id: issueId(),
        severity: 'critical',
        title: `Missing Source: "${req}" is never produced`,
        affectedNodeIds: affectedIds,
        explanation: `The item or clue "${req}" is required by one or more nodes but no node produces it as a reward, and no node accessible at start provides it. Players will be permanently blocked.`,
        suggestedFix: `Add a node that rewards "${req}", or verify the spelling matches a reward on an existing node. Check that the producing node is accessible.`,
      });
    }
  } else {
    cleanChecks.push('All required items and clues have identifiable sources.');
  }

  // CHECK 3: Unreachable nodes
  const unreachable = nodes.filter(n => !reachable.has(n.id));
  if (unreachable.length > 0) {
    issues.push({
      id: issueId(),
      severity: 'critical',
      title: `Unreachable Nodes: ${unreachable.length} node(s) cannot be reached`,
      affectedNodeIds: unreachable.map(n => n.id),
      explanation: `These nodes cannot become available through any chain of rewards starting from the accessible starting nodes: ${unreachable.map(n => n.label).join(', ')}. Players will never encounter them.`,
      suggestedFix: 'Trace the reward chain backward from these nodes. Ensure each required item or clue is produced by a reachable node and that no missing sources block the chain.',
    });
  } else {
    cleanChecks.push('All nodes are reachable from the starting state.');
  }

  // CHECK 4: Circular dependencies
  // Build requires-graph for cycle detection using DFS
  const requiresGraph = new Map<string, string[]>(); // nodeId -> nodeIds it depends on
  for (const node of nodes) {
    const deps: string[] = [];
    for (const req of node.requires) {
      const producers = rewardToNodes.get(req) ?? [];
      deps.push(...producers);
    }
    requiresGraph.set(node.id, deps);
  }

  const cycleVisited = new Set<string>();
  const inStack = new Set<string>();
  const cycleNodes = new Set<string>();

  function dfs(id: string): boolean {
    if (inStack.has(id)) { cycleNodes.add(id); return true; }
    if (cycleVisited.has(id)) return false;
    cycleVisited.add(id);
    inStack.add(id);
    for (const dep of (requiresGraph.get(id) ?? [])) {
      if (dfs(dep)) cycleNodes.add(id);
    }
    inStack.delete(id);
    return false;
  }

  for (const node of nodes) {
    if (!cycleVisited.has(node.id)) dfs(node.id);
  }

  if (cycleNodes.size > 0) {
    issues.push({
      id: issueId(),
      severity: 'critical',
      title: `Circular Dependency: ${cycleNodes.size} node(s) form a dependency loop`,
      affectedNodeIds: [...cycleNodes],
      explanation: `These nodes form a circular dependency chain — each requires something that ultimately depends on itself. This makes the game impossible to complete without external intervention: ${[...cycleNodes].map(id => nodeById.get(id)?.label ?? id).join(', ')}.`,
      suggestedFix: 'Break the cycle by introducing an independent clue or item that provides one of the locked requirements without depending on the circular chain.',
    });
  } else {
    cleanChecks.push('No circular dependencies detected.');
  }

  // CHECK 5: Unused rewards
  const usedAsRequirement = new Set<string>(nodes.flatMap(n => n.requires));
  const unusedRewards: { node: PuzzleNode; reward: string }[] = [];
  for (const node of nodes) {
    if (node.type === 'finale') continue;
    for (const reward of node.rewards) {
      if (!usedAsRequirement.has(reward)) {
        unusedRewards.push({ node, reward });
      }
    }
  }
  if (unusedRewards.length > 0) {
    const grouped = new Map<string, string[]>();
    for (const { node, reward } of unusedRewards) {
      const existing = grouped.get(reward) ?? [];
      existing.push(node.id);
      grouped.set(reward, existing);
    }
    for (const [reward, affectedIds] of grouped) {
      issues.push({
        id: issueId(),
        severity: 'warning',
        title: `Unused Reward: "${reward}" is never required`,
        affectedNodeIds: affectedIds,
        explanation: `The reward "${reward}" is produced by a node but never required by any other node. Players will earn it but it opens or unlocks nothing, creating confusion.`,
        suggestedFix: `Either add a node that requires "${reward}" (a lock, gate, or puzzle that needs it), or remove it from the reward list if it was added by mistake. Consider if it should be a narrative/finale reward.`,
      });
    }
  } else {
    cleanChecks.push('All produced rewards are consumed by at least one node.');
  }

  // CHECK 6: Orphaned nodes
  const orphaned = nodes.filter(n =>
    n.type !== 'finale' &&
    !n.accessibleAtStart &&
    n.requires.length === 0 &&
    n.rewards.length === 0
  );
  if (orphaned.length > 0) {
    issues.push({
      id: issueId(),
      severity: 'warning',
      title: `Orphaned Nodes: ${orphaned.length} node(s) have no connections`,
      affectedNodeIds: orphaned.map(n => n.id),
      explanation: `These nodes have no requirements, no rewards, and are not accessible at start: ${orphaned.map(n => n.label).join(', ')}. They exist in isolation and have no defined role in the dependency graph.`,
      suggestedFix: 'Connect these nodes to the graph by adding requirements or rewards, mark them accessible at start if they are introductory props, or remove them if they are not needed.',
    });
  } else {
    cleanChecks.push('No orphaned nodes detected — all nodes have defined roles.');
  }

  // CHECK 7: Premature finale access
  const finaleNodes = nodes.filter(n => n.type === 'finale');
  for (const finale of finaleNodes) {
    if (finale.accessibleAtStart) {
      issues.push({
        id: issueId(),
        severity: 'critical',
        title: `Premature Finale: "${finale.label}" is accessible at start`,
        affectedNodeIds: [finale.id],
        explanation: `The finale node "${finale.label}" is marked as accessible at the start of the game. Players could immediately access or bypass the room's conclusion without solving any puzzles.`,
        suggestedFix: 'Remove the "Accessible at Start" flag from this finale node and ensure it requires completing meaningful prerequisites from earlier stages.',
      });
    } else if (finale.requires.length === 0) {
      issues.push({
        id: issueId(),
        severity: 'critical',
        title: `Premature Finale: "${finale.label}" has no requirements`,
        affectedNodeIds: [finale.id],
        explanation: `The finale node "${finale.label}" has no requirements defined. Players can access the finale without completing any puzzles or earning any items, making the room trivially solvable.`,
        suggestedFix: 'Add requirements to the finale node — typically the final key item, code, or combination that proves the player has completed the main puzzle chain.',
      });
    }
  }
  if (finaleNodes.length === 0) {
    issues.push({
      id: issueId(),
      severity: 'improvement',
      title: 'No Finale Node Defined',
      affectedNodeIds: [],
      explanation: 'The project has no node of type "finale". Without a defined finale, the audit cannot verify that the room has a clear, gate-checked ending.',
      suggestedFix: 'Add at least one node of type "finale" representing the final lock, mechanism, or exit that players must open to complete the room.',
    });
  } else {
    cleanChecks.push('A finale node exists with defined access requirements.');
  }

  // CHECK 8: Stage mismatch
  for (const node of nodes) {
    const nodeStageOrder = stageOrderById.get(node.stageId) ?? 0;
    for (const req of node.requires) {
      const producers = rewardToNodes.get(req) ?? [];
      for (const producerId of producers) {
        const producer = nodeById.get(producerId);
        if (!producer) continue;
        const producerStageOrder = stageOrderById.get(producer.stageId) ?? 0;
        if (producerStageOrder > nodeStageOrder) {
          issues.push({
            id: issueId(),
            severity: 'critical',
            title: `Stage Mismatch: "${node.label}" requires something from a later stage`,
            affectedNodeIds: [node.id, producerId],
            explanation: `"${node.label}" (Stage ${nodeStageOrder}) requires "${req}", but "${producer.label}" (Stage ${producerStageOrder}) produces that reward in a later stage. Players in stage ${nodeStageOrder} will not have access to this item yet.`,
            suggestedFix: `Move "${producer.label}" to an earlier stage, or move "${node.label}" to a later stage. Alternatively, create an earlier source for "${req}".`,
          });
        }
      }
    }
  }

  const stageMismatchIds = new Set(issues.filter(i => i.title.startsWith('Stage Mismatch')).flatMap(i => i.affectedNodeIds));
  if (stageMismatchIds.size === 0) {
    cleanChecks.push('All node requirements respect stage order boundaries.');
  }

  // CHECK 9: Ambiguous same-format inputs
  const locksByStage = new Map<string, PuzzleNode[]>();
  for (const node of nodes) {
    if (node.type !== 'lock') continue;
    if (!node.answerFormat) continue;
    const existing = locksByStage.get(node.stageId) ?? [];
    existing.push(node);
    locksByStage.set(node.stageId, existing);
  }

  for (const [stageId, locks] of locksByStage) {
    const formatGroups = new Map<string, PuzzleNode[]>();
    for (const lock of locks) {
      const fmt = (lock.answerFormat ?? '').toLowerCase().trim();
      const existing = formatGroups.get(fmt) ?? [];
      existing.push(lock);
      formatGroups.set(fmt, existing);
    }
    for (const [fmt, sameFmtLocks] of formatGroups) {
      if (sameFmtLocks.length > 1) {
        const stage = stages.find(s => s.id === stageId);
        issues.push({
          id: issueId(),
          severity: 'warning',
          title: `Ambiguous Input Format: Multiple "${fmt}" locks in "${stage?.label ?? stageId}"`,
          affectedNodeIds: sameFmtLocks.map(n => n.id),
          explanation: `${sameFmtLocks.length} lock nodes in the same stage share the answer format "${fmt}": ${sameFmtLocks.map(n => n.label).join(', ')}. Players who solve a puzzle might not know which lock to try the answer on, causing frustration and extra wear on the mechanisms.`,
          suggestedFix: 'Differentiate lock formats in the same stage, or add strong visual/thematic cues that link each answer to its specific lock. Consider reviewing this in LockMap Studio for mapping treatment.',
        });
      }
    }
  }

  // Score calculation
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const improvementCount = issues.filter(i => i.severity === 'improvement').length;

  const rawScore = 100 - (criticalCount * 20) - (warningCount * 7) - (improvementCount * 3);
  const score = Math.max(0, rawScore);

  return {
    score,
    label: scoreLabel(score),
    criticalCount,
    warningCount,
    improvementCount,
    issues,
    cleanChecks,
  };
}
