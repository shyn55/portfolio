/** Vercel Blob availability check for the admin UI (no token value leaks). */
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
