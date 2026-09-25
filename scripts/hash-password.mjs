#!/usr/bin/env node
/**
 * Generates a secure scrypt password hash for the admin login.
 *
 * Usage:
 *   node scripts/hash-password.mjs "your-password"
 *
 * Paste the output into ADMIN_PASSWORD_HASH in your .env file.
 * The matching algorithm is implemented in lib/auth.ts (verifyPassword).
 */
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs \"your-password\"");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters long.");
  process.exit(1);
}

// scrypt parameters (N=2^16, r=8, p=1) — stored with the hash so they can be
// raised later without invalidating existing hashes.
const N = 65536;
const r = 8;
const p = 1;
const keyLen = 64;
const salt = randomBytes(16);

const derived = scryptSync(password, salt, keyLen, { N, r, p, maxmem: 128 * 1024 * 1024 });

// Separator is ":" (not "$") because ".env" files treat "$" as a variable
// expansion marker and would corrupt the value.
const hash = [
  "scrypt",
  [N, r, p].join("_"),
  salt.toString("base64"),
  derived.toString("base64"),
].join(":");

console.log(hash);
