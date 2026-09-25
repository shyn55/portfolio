import "server-only";

import { getMongoDb, PROJECTS_COLLECTION } from "@/lib/mongodb";
import { slugify } from "@/lib/slug";
import type { AdminProject, ProjectStats, PublicProject } from "@/types/project";

/**
 * MongoDB-backed project data layer. The API routes, admin panel, and public
 * Works section consume this module only — swapping databases happens here.
 */

/** Thrown when MONGODB_URI is not configured. UI shows a friendly banner. */
export class DatabaseUnavailableError extends Error {
  constructor() {
    super("MONGODB_URI is not configured.");
    this.name = "DatabaseUnavailableError";
  }
}

type ProjectDoc = {
  _id: unknown;
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  githubUrl: string | null;
  liveUrl: string | null;
  technologies: string[];
  category: string;
  featured: boolean;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

async function requireDb() {
  const db = getMongoDb();
  if (!db) throw new DatabaseUnavailableError();
  return db.collection<ProjectDoc>(PROJECTS_COLLECTION);
}

function toAdmin(doc: ProjectDoc): AdminProject {
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    image: doc.image,
    github: doc.githubUrl,
    live: doc.liveUrl,
    technologies: doc.technologies,
    category: doc.category,
    featured: doc.featured,
    order: doc.order,
    published: doc.published,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function sortStage() {
  return { order: 1 as const, createdAt: 1 as const };
}

/** Published projects for the public Works section, ordered by display order. */
export async function listPublishedProjects(): Promise<PublicProject[]> {
  const col = await requireDb();
  const docs = await col
    .find({ published: true })
    .sort(sortStage())
    .toArray();
  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    image: doc.image,
    github: doc.githubUrl,
    live: doc.liveUrl,
    technologies: doc.technologies,
    category: doc.category,
    featured: doc.featured,
    order: doc.order,
  }));
}

/** All projects (drafts included) for the admin panel. */
export async function listAllProjects(): Promise<AdminProject[]> {
  const col = await requireDb();
  const docs = await col.find({}).sort(sortStage()).toArray();
  return docs.map(toAdmin);
}

export async function getProjectById(id: string): Promise<AdminProject | null> {
  const col = await requireDb();
  const doc = await col.findOne({ id });
  return doc ? toAdmin(doc) : null;
}

export async function getProjectStats(): Promise<ProjectStats> {
  const col = await requireDb();
  const [total, published, featured] = await Promise.all([
    col.countDocuments({}),
    col.countDocuments({ published: true }),
    col.countDocuments({ featured: true }),
  ]);
  return { total, published, drafts: total - published, featured };
}

/** Suggests the next display order (max order + 1) for new projects. */
export async function getNextOrder(): Promise<number> {
  const col = await requireDb();
  const top = await col
    .find({}, { projection: { order: 1, _id: 0 } })
    .sort({ order: -1 })
    .limit(1)
    .toArray();
  return (top[0]?.order ?? 0) + 1;
}

export async function slugExists(slug: string): Promise<boolean> {
  const col = await requireDb();
  const found = await col.findOne({ slug }, { projection: { _id: 1 } });
  return found !== null;
}

/** Resolves a unique slug for a title, appending -2, -3 … when needed. */
export async function makeUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  if (!(await slugExists(base))) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!(await slugExists(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Guarantees a stable application-level id for a project (cuid-like). */
function makeId(): string {
  // 24 hex chars, same shape as the ids the frontend already stores.
  return [...Array(24)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

export async function createProject(data: {
  title: string;
  slug: string;
  description: string;
  image: string;
  githubUrl: string | null;
  liveUrl: string | null;
  technologies: string[];
  category: string;
  featured: boolean;
  order: number;
  published: boolean;
}): Promise<AdminProject> {
  const col = await requireDb();
  const now = new Date();
  const doc: Omit<ProjectDoc, "_id"> = {
    id: makeId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc as ProjectDoc);
  return toAdmin({ ...doc, _id: result.insertedId });
}

export async function updateProject(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    description: string;
    image: string;
    githubUrl: string | null;
    liveUrl: string | null;
    technologies: string[];
    category: string;
    featured: boolean;
    order: number;
    published: boolean;
  }>,
): Promise<AdminProject | null> {
  const col = await requireDb();
  const doc = await col.findOneAndUpdate(
    { id },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? toAdmin(doc) : null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const col = await requireDb();
  const result = await col.deleteOne({ id });
  return result.deletedCount > 0;
}
