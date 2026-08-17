import type { WPPPMAAuthor, WPTerm } from './types';
import { fetchAll } from './pagination';

/**
 * PublishPress Authors are exposed as a custom taxonomy (rest_base: ppma_author).
 * We fetch them so author archives + author metadata work even when
 * /wp-json/wp/v2/users is locked down against enumeration.
 */
export async function getAllPPMAAuthors(): Promise<WPPPMAAuthor[]> {
  try {
    return await fetchAll<WPPPMAAuthor>('/ppma_author', { orderby: 'name', order: 'asc' });
  } catch {
    return [];
  }
}

export function getAllCategories(): Promise<WPTerm[]> {
  return fetchAll<WPTerm>('/categories', { orderby: 'name', order: 'asc' });
}

export function getAllTags(): Promise<WPTerm[]> {
  return fetchAll<WPTerm>('/tags', { orderby: 'name', order: 'asc' });
}

export async function getCategoryBySlug(slug: string): Promise<WPTerm | null> {
  const all = await getAllCategories();
  return all.find((t) => t.slug === slug) ?? null;
}

export async function getTagBySlug(slug: string): Promise<WPTerm | null> {
  const all = await getAllTags();
  return all.find((t) => t.slug === slug) ?? null;
}
