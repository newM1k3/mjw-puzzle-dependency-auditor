import PocketBase from 'pocketbase';
import type { Project } from '../types';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://immersive-kit.pockethost.io');

export interface SavedProjectMeta {
  id: string;          // PocketBase record ID
  externalId: string;  // stable project UUID
  title: string;
  savedAt: string;     // ISO string
  project: Project;
}

// Each project is keyed by a stable external_id (generated at new-project time).
// Upsert pattern: update if external_id exists for this user, create otherwise.
export async function saveProject(externalId: string, project: Project): Promise<void> {
  if (!pb.authStore.isValid) return;

  const userId = pb.authStore.record?.id ?? '';

  try {
    const existing = await pb.collection('dependency_projects').getFirstListItem(
      `external_id = "${externalId}" && user_id = "${userId}"`,
      { requestKey: null }
    );
    await pb.collection('dependency_projects').update(existing.id, { payload: project });
  } catch {
    await pb.collection('dependency_projects').create({
      external_id: externalId,
      user_id: userId,
      payload: project,
      archived: false,
    });
  }
}

export async function loadProjects(): Promise<SavedProjectMeta[]> {
  if (!pb.authStore.isValid) return [];

  const userId = pb.authStore.record?.id ?? '';

  try {
    const records = await pb.collection('dependency_projects').getList(1, 20, {
      filter: `user_id = "${userId}" && (archived = false || archived = null)`,
      sort: '-updated',
      requestKey: null,
    });

    return records.items.map((r) => ({
      id: r.id,
      externalId: r['external_id'] as string,
      title: (r['payload'] as Project)?.setup?.title ?? 'Untitled Project',
      savedAt: r['updated'] as string,
      project: r['payload'] as Project,
    }));
  } catch {
    return [];
  }
}
