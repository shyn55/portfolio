/** Converts a title into a URL-friendly slug, e.g. "Empire Gym" → "empire-gym". */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "project"
  );
}
