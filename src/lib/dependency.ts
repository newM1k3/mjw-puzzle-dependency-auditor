// dependency.ts — Puzzle Dependency Auditor on the unified spine (Phase 3).
//
// An audit is a room-scoped drawer (tool_key=puzzle_dependency, scope=room). The room is a
// platform `experiences` record, resolved via the user's org membership; its venue is the
// parent `projects` record. On a brand-new audit the project setup is seeded from the room's
// Story (experiences.title/theme/format/difficulty/capacity) so it never starts blank.
// Replaces the retired per-user `dependency_projects` table.

import pb from './pocketbase';
import type { Project, ProjectSetup, RoomStructure, Difficulty } from '../types';

type Rec = Record<string, unknown>;

/** A room the signed-in user can audit, plus its raw Story fields for seeding. */
export interface RoomOption {
  id: string; // experiences record id
  title: string;
  experience: Rec;
}

/** The user's venue + its rooms, resolved from org membership. */
export interface RoomContext {
  orgId: string;
  venueId: string;
  rooms: RoomOption[];
}

const ROOM_STRUCTURES: RoomStructure[] = ['linear', 'semi-linear', 'open-world', 'multi-room'];
const okStructure = (v: unknown): RoomStructure =>
  ROOM_STRUCTURES.includes(v as RoomStructure) ? (v as RoomStructure) : 'semi-linear';

// Room difficulty (experiences.difficulty) → the tool's difficulty scale.
const DIFFICULTY_MAP: Record<string, Difficulty> = {
  easy: 'beginner', medium: 'intermediate', hard: 'expert', expert: 'extreme',
};

// Default starter stages — the tool expects at least a few stages to build against.
const DEFAULT_STAGES = (): Project['stages'] => [
  { id: 'stage_start', label: 'Starting Area', order: 1, description: '' },
  { id: 'stage_mid', label: 'Mid-Game Reveal', order: 2, description: '' },
  { id: 'stage_final', label: 'Final Sequence', order: 3, description: '' },
];

/**
 * Resolve the venue + rooms for the signed-in user: the first project under their first
 * active org membership, and that project's non-retired experiences. Mirrors the Corporate
 * Proposal Generator's resolveVenue, extended to return the rooms (room-scoped tools pick one).
 */
export async function resolveRoomContext(): Promise<RoomContext | null> {
  if (!pb.authStore.isValid) return null;
  const uid = pb.authStore.record?.id;
  if (!uid) return null;

  const memberships = await pb.collection('memberships').getFullList({
    filter: `user = '${uid}' && status = 'active'`,
    requestKey: null,
  });
  for (const m of memberships) {
    const orgId = m.organization as string;
    const projects = await pb.collection('projects').getFullList({
      filter: `organization = '${orgId}'`,
      requestKey: null,
    });
    const venue = projects[0];
    if (!venue) continue;

    const exps = await pb.collection('experiences').getFullList({
      filter: `project = '${venue.id}' && status != 'retired'`,
      requestKey: null,
    });
    const rooms: RoomOption[] = exps.map((e) => ({
      id: e.id as string,
      title: (e.title as string) || 'Untitled Room',
      experience: e as Rec,
    }));
    return { orgId, venueId: venue.id, rooms };
  }
  return null;
}

/** Seed a fresh audit's project setup from a room's Story so it never starts blank. */
export function seedFromRoom(e: Rec): Project {
  const setup: ProjectSetup = {
    title: (e.title as string) ?? '',
    theme: (e.theme as string) || (e.premise as string) || '',
    roomStructure: okStructure(e.format),
    targetDuration: (e.duration_minutes as number) || 60,
    difficulty: DIFFICULTY_MAP[e.difficulty as string] ?? 'intermediate',
    minPlayers: (e.capacity_min as number) || 2,
    maxPlayers: (e.capacity_max as number) || 6,
  };
  return { setup, stages: DEFAULT_STAGES(), nodes: [], auditResult: null };
}

/**
 * Load the room's audit drawer, or a Story-seeded blank if none exists yet.
 * One drawer per room (tool_key=puzzle_dependency, scope=room).
 */
export async function loadAudit(room: RoomOption): Promise<Project> {
  try {
    const rec = await pb.collection('drawers').getFirstListItem(
      `tool_key = 'puzzle_dependency' && room = '${room.id}'`,
      { requestKey: null },
    );
    return rec.data as Project;
  } catch {
    return seedFromRoom(room.experience);
  }
}

/** Upsert the room's audit drawer (one row per room). Returns the drawer record id. */
export async function saveAudit(ctx: RoomContext, roomId: string, project: Project): Promise<string> {
  if (!pb.authStore.isValid) throw new Error('Must be signed in to save');

  const body = {
    tool_key: 'puzzle_dependency',
    scope_type: 'room',
    organization: ctx.orgId,
    venue: ctx.venueId,
    room: roomId,
    title: project.setup.title || 'Untitled Audit',
    data: { ...project },
    status: 'active',
  };

  let existingId: string | null = null;
  try {
    const existing = await pb.collection('drawers').getFirstListItem(
      `tool_key = 'puzzle_dependency' && room = '${roomId}'`,
      { requestKey: null },
    );
    existingId = existing.id;
  } catch {
    existingId = null; // no drawer for this room yet
  }

  if (existingId) {
    await pb.collection('drawers').update(existingId, body, { requestKey: null });
    return existingId;
  }
  const created = await pb.collection('drawers').create({ ...body, version: 1 }, { requestKey: null });
  return created.id;
}
