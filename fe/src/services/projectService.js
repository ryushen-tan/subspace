import { pb } from './pocketbase';

/**
 * List projects for the current user (must be authenticated).
 */
export async function listProjects() {
  const userId = pb.authStore.model?.id;
  if (!userId) throw new Error('Not authenticated');
  const result = await pb.collection('projects').getList(1, 100, {
    filter: `user = "${userId}"`,
    sort: '-updated',
  });
  return result.items;
}

/**
 * Get a single project by id. Fails if not owner.
 */
export async function getProject(id) {
  return pb.collection('projects').getOne(id);
}

/**
 * Create a new project. user must be set to current auth user.
 */
export async function createProject({ user, name, description, snapshot }) {
  return pb.collection('projects').create({
    user,
    name: name || 'Untitled Project',
    description: description || '',
    snapshot,
  });
}

/**
 * Update an existing project. Only owner can update.
 */
export async function updateProject(id, { name, description, snapshot }) {
  return pb.collection('projects').update(id, {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(snapshot !== undefined && { snapshot }),
  });
}

/**
 * Delete a project. Only owner can delete.
 */
export async function deleteProject(id) {
  return pb.collection('projects').delete(id);
}
