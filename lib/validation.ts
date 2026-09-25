import "server-only";

import { PROJECT_CATEGORIES, type ProjectCategory } from "@/data/projects";

export type ProjectInput = {
  title: string;
  description: string;
  image: string;
  githubUrl: string | null;
  liveUrl: string | null;
  technologies: string[];
  category: ProjectCategory;
  featured: boolean;
  published: boolean;
  order: number;
};

export type ValidationResult =
  | { ok: true; data: Partial<ProjectInput> }
  | { ok: false; errors: Record<string, string> };

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function trimTo(value: unknown, max: number, errors: Record<string, string>, field: string): string {
  if (!isString(value)) {
    errors[field] = "Must be text.";
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length > max) errors[field] = `Must be ${max} characters or fewer.`;
  return trimmed;
}

function optionalUrl(value: unknown, field: string, errors: Record<string, string>): string | null {
  if (value === null) return null;
  if (value === undefined || value === "") return ""; // caller decides what "" means
  if (!isString(value) || value.length > 1000) {
    errors[field] = "Must be a valid URL (max 1000 characters).";
    return null;
  }
  const trimmed = value.trim();
  if (!/^https?:\/\/.+/.test(trimmed)) {
    errors[field] = "Must start with http:// or https://";
    return null;
  }
  return trimmed;
}

function imagePath(value: unknown, errors: Record<string, string>): string {
  if (!isString(value) || value.trim() === "") {
    errors.image = "An image path or URL is required.";
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length > 1000) {
    errors.image = "Image value is too long (max 1000 characters).";
    return "";
  }
  const isLocal = trimmed.startsWith("/");
  const isRemote = /^https?:\/\//.test(trimmed);
  if (!isLocal && !isRemote) {
    errors.image = "Image must be a local path (e.g. /images/...) or an http(s) URL.";
    return "";
  }
  return trimmed;
}

function parseTechnologies(value: unknown, errors: Record<string, string>): string[] {
  let raw: unknown[] = [];
  if (Array.isArray(value)) raw = value;
  else if (typeof value === "string" && value.trim() !== "") raw = value.split(",");

  const seen = new Set<string>();
  const tech: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (!t || t.length > 60) continue;
    if (!seen.has(t)) {
      seen.add(t);
      tech.push(t);
    }
    if (tech.length >= 40) break;
  }
  if (tech.length === 0) {
    errors.technologies = "Add at least one technology.";
  }
  return tech;
}

function parseBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === "on") return true;
  if (value === "false" || value === "0" || value === "off") return false;
  return fallback;
}

function parseOrder(value: unknown, errors: Record<string, string>): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 100000) {
    errors.order = "Display order must be a whole number (0–100000).";
    return 0;
  }
  return n;
}

/**
 * Validates and sanitizes a project payload from the admin API.
 *
 * - Full validation (`partial: false`, used by POST) requires every field.
 * - Partial validation (used by PATCH) only touches fields that are actually
 *   present in the payload, so toggles like `{ published: true }` never
 *   overwrite other columns.
 */
export function parseProjectInput(raw: unknown, options: { partial?: boolean } = {}): ValidationResult {
  const errors: Record<string, string> = {};
  const data: Partial<ProjectInput> = {};
  const partial = options.partial === true;
  const body = isRecord(raw) ? raw : {};

  const has = (key: string) => body[key] !== undefined;
  const missing = (key: string) => !partial && !has(key);

  // --- title / description --------------------------------------------------
  if (has("title")) data.title = trimTo(body.title, 120, errors, "title") || undefined;
  else if (missing("title")) errors.title = "Title is required.";
  if (has("description"))
    data.description = trimTo(body.description, 3000, errors, "description") || undefined;
  else if (missing("description")) errors.description = "Description is required.";

  // --- image ----------------------------------------------------------------
  if (has("image")) {
    const img = imagePath(body.image, errors);
    if (img) data.image = img;
  } else if (missing("image")) {
    errors.image = "An image path or URL is required.";
  }

  // --- category -------------------------------------------------------------
  if (has("category")) {
    const c = isString(body.category) ? body.category.trim() : "";
    if ((PROJECT_CATEGORIES as readonly string[]).includes(c)) {
      data.category = c as ProjectCategory;
    } else {
      errors.category = `Category must be one of: ${PROJECT_CATEGORIES.join(", ")}.`;
    }
  } else if (missing("category")) {
    errors.category = "Category is required.";
  }

  // --- technologies ---------------------------------------------------------
  if (has("technologies")) {
    const tech = parseTechnologies(body.technologies, errors);
    if (tech.length > 0) data.technologies = tech;
  } else if (missing("technologies")) {
    errors.technologies = "Add at least one technology.";
  }

  // --- booleans / order -----------------------------------------------------
  if (has("featured")) data.featured = parseBool(body.featured, false);
  if (has("published")) data.published = parseBool(body.published, false);
  if (has("order")) data.order = parseOrder(body.order, errors);

  // --- optional URLs (empty string → null so the column can be cleared) -----
  if (has("githubUrl")) {
    const url = optionalUrl(body.githubUrl, "githubUrl", errors);
    data.githubUrl = url === "" ? null : url;
  }
  if (has("liveUrl")) {
    const url = optionalUrl(body.liveUrl, "liveUrl", errors);
    data.liveUrl = url === "" ? null : url;
  }

  // --- full-create requirements ---------------------------------------------
  if (!partial) {
    if (data.title === undefined) errors.title = "Title is required.";
    if (data.description === undefined) errors.description = "Description is required.";
    if (data.image === undefined) errors.image = "An image path or URL is required.";
    if (data.category === undefined) errors.category = "Category is required.";
    if (data.technologies === undefined) errors.technologies = "Add at least one technology.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // Full-create fills sensible defaults for anything still missing.
  if (!partial) {
    data.featured ??= false;
    data.published ??= false;
    data.order ??= 0;
    data.githubUrl ??= null;
    data.liveUrl ??= null;
  }

  return { ok: true, data };
}
