import "server-only";

import { createHmac, scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Minimal, dependency-free admin authentication.
 *
 * Credentials are configured through environment variables (see .env.example):
 *   - ADMIN_EMAIL              the login email
 *   - ADMIN_PASSWORD_HASH      scrypt hash produced by scripts/hash-password.mjs
 *   - AUTH_SECRET              secret used to sign the session cookie
 *
 * After a successful login an HttpOnly, signed session cookie is set. Every
 * admin page/API re-validates the signature server-side — nothing is trusted
 * from the client.
 */

export const SESSION_COOKIE_NAME = "portfolio_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const KEY_LEN = 64;

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD_HASH,
  );
}

export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim() || null;
}

/** Verifies a plain-text password against a stored `scrypt:...` hash string. */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    // ":" separator (not "$") so the value survives .env parsing unchanged.
    const [scheme, params, saltB64, hashB64] = storedHash.split(":");
    if (scheme !== "scrypt" || !params || !saltB64 || !hashB64) return false;

    const [N, r, p] = params.split("_").map(Number);
    if (!N || !r || !p || ![N, r, p].every(Number.isInteger)) return false;

    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const derived = scryptSync(password, salt, KEY_LEN, {
      N,
      r,
      p,
      // OpenSSL needs headroom above the ~128*N*r bytes scrypt uses.
      maxmem: Math.max(256 * 1024 * 1024, 128 * N * r * 2),
    });

    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// --- Session token ----------------------------------------------------------

type SessionPayload = { email: string; exp: number };

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET as string)
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function readSessionToken(token: string): string | null {
  const secret = process.env.AUTH_SECRET;
  const adminEmail = getAdminEmail();
  if (!secret || !adminEmail) return null;

  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = sign(encoded);
  const provided = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (provided.length !== expectedBuf.length || !timingSafeEqual(provided, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as SessionPayload;
    if (typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    // Session is bound to the configured admin email, so rotating credentials
    // invalidates existing sessions.
    if (payload.email !== adminEmail) return null;
    return payload.email;
  } catch {
    return null;
  }
}

// --- Guards -----------------------------------------------------------------

/** Reads the signed session cookie and returns the admin email, or null. */
export async function getSessionEmail(): Promise<string | null> {
  if (!isAuthConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

/**
 * Server-component guard for admin pages/layouts. Redirects to the login page
 * when there is no valid session. Usage: `const email = await requireAdmin();`
 */
export async function requireAdmin(): Promise<string> {
  const email = await getSessionEmail();
  if (!email) redirect("/admin/login");
  return email;
}

/** Returns cookie options used when creating the session. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** For testing/utility: creates a fresh random secret. */
export function generateSecret(): string {
  return randomBytes(32).toString("hex");
}
