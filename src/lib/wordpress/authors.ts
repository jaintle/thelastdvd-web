import { apiUrl, fetchWp } from './client';
import { fetchAll } from './pagination';
import type { WPUser } from './types';

// Persist across module re-evaluations in Astro dev by hanging state off globalThis.
type UsersState = { promise: Promise<WPUser[]> | null; warned: boolean };
const g = globalThis as unknown as { __tldUsers?: UsersState };
const state: UsersState = (g.__tldUsers ??= { promise: null, warned: false });

async function loadUsers(): Promise<WPUser[]> {
  try {
    return await fetchAll<WPUser>('/users');
  } catch (err) {
    if (!state.warned) {
      state.warned = true;
      // eslint-disable-next-line no-console
      console.warn(
        `[wp] /users unavailable (${(err as Error).message}); falling back to embedded author data.`,
      );
    }
    return [];
  }
}

export async function getAllUsers(): Promise<WPUser[]> {
  state.promise ??= loadUsers();
  return state.promise;
}

export async function getUserById(id: number): Promise<WPUser | null> {
  if (!id) return null;
  const all = await getAllUsers();
  const hit = all.find((u) => u.id === id);
  if (hit) return hit;
  try {
    const res = await fetchWp<WPUser>(apiUrl(`/users/${id}`));
    return res.body;
  } catch {
    return null;
  }
}

export async function getUserBySlug(slug: string): Promise<WPUser | null> {
  const all = await getAllUsers();
  return all.find((u) => u.slug === slug) ?? null;
}
