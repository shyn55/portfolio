/**
 * Shared, serializable project shapes. Public (client) code imports only this
 * file — never the database driver or server modules.
 */

/** Shape returned by GET /api/projects (published projects only). */
export type PublicProject = {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  github: string | null;
  live: string | null;
  technologies: string[];
  category: string;
  featured: boolean;
  order: number;
};

/** Full row used by the admin panel (dates serialized to ISO strings). */
export type AdminProject = PublicProject & {
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStats = {
  total: number;
  published: number;
  drafts: number;
  featured: number;
};
