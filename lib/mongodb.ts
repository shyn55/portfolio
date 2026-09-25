import "server-only";

import { MongoClient, type Db } from "mongodb";

/**
 * MongoDB (Atlas) connection.
 *
 * - Reads `MONGODB_URI` from the environment — server-side only, never exposed
 *   to the client (no NEXT_PUBLIC_ prefix).
 * - The client is created lazily and cached on `globalThis` so hot reloading in
 *   development and warm serverless invocations on Vercel reuse one client and
 *   do not exhaust the connection pool.
 * - Returns `null` when MONGODB_URI is not configured. Callers must handle
 *   `null` gracefully (the UI shows a friendly "database not configured" state
 *   instead of crashing).
 */

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
};

function createClient(uri: string) {
  return new MongoClient(uri, {
    // Keep serverless-friendly defaults; the driver already handles TLS for
    // Atlas (sslmode is implied by the mongodb+srv:// scheme).
    maxPoolSize: 10,
  });
}

/** Returns the cached Mongo client and its Db, or `null` when not configured. */
export function getMongoDb(): Db | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = createClient(uri);
  }
  return globalForMongo.mongoClient.db();
}

/** The projects collection name used across the data layer. */
export const PROJECTS_COLLECTION = "projects";

/** True when a MONGODB_URI is configured. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}
