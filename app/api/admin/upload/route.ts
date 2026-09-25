import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";

import { getSessionEmail } from "@/lib/auth";

export const runtime = "nodejs";

/** 5 MB cap keeps uploads fast on serverless and mobile connections. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);

/** Turns any filename into a URL-safe ASCII slug (handles Persian/unicode names). */
function slugifyFilename(name: string): string {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const base = name.replace(/\.[^.]+$/, "");
  const ascii = base
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `${ascii || "project-image"}${ext ? "." + ext : ""}`;
}

function extensionOf(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

function unauthenticated() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

/**
 * POST /api/admin/upload — multipart/form-data with a `file` field.
 * Stores the image in Vercel Blob when BLOB_READ_WRITE_TOKEN is configured;
 * otherwise falls back to public/uploads (dev only, gitignored).
 * Only the returned URL is ever stored in the database.
 */
export async function POST(request: Request) {
  const email = await getSessionEmail();
  if (!email) return unauthenticated();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart form upload." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file was provided." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Image is larger than 5 MB. Please choose a smaller file." },
      { status: 413 },
    );
  }

  const type = (file.type || "").toLowerCase();
  const ext = extensionOf(file.name);
  if (!ALLOWED_MIME_TYPES.has(type) || !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, WebP, AVIF or GIF." },
      { status: 415 },
    );
  }

  const safeName = slugifyFilename(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`projects/${randomUUID()}-${safeName}`, buffer, {
        access: "public",
        contentType: type,
      });
      return NextResponse.json({ url: blob.url, storage: "blob" }, { status: 201 });
    } catch (error) {
      console.error("[api/admin/upload] Blob upload failed:", error);
      return NextResponse.json(
        { error: "Upload to blob storage failed. Please try again." },
        { status: 502 },
      );
    }
  }

  // Dev fallback (no BLOB_READ_WRITE_TOKEN): store under public/uploads.
  // In production on Vercel the filesystem is read-only, which is why the
  // blob path above is the real storage strategy.
  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}-${safeName}`;
    await writeFile(path.join(dir, filename), buffer);
    return NextResponse.json(
      {
        url: `/uploads/${filename}`,
        storage: "local",
        warning:
          "Stored locally (development only). Set BLOB_READ_WRITE_TOKEN in production so uploads persist on Vercel.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/admin/upload] Local upload failed:", error);
    return NextResponse.json(
      { error: "Could not save the file. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/upload?file=<previous image URL> — best-effort cleanup of a
 * replaced upload. Only our own dynamic-upload URLs are honored.
 */
export async function DELETE(request: Request) {
  const email = await getSessionEmail();
  if (!email) return unauthenticated();

  const file = new URL(request.url).searchParams.get("file");
  if (!file) {
    return NextResponse.json({ error: "Missing file parameter." }, { status: 400 });
  }

  try {
    if (file.startsWith("/uploads/")) {
      // Local fallback file — path.basename constrains it to public/uploads.
      const name = path.basename(file);
      await unlink(path.join(process.cwd(), "public", "uploads", name));
    } else if (
      process.env.BLOB_READ_WRITE_TOKEN &&
      /^https:\/\/.+/.test(file)
    ) {
      await del(file);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/upload] DELETE failed (ignored):", error);
    return NextResponse.json({ ok: true });
  }
}
