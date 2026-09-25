import { NextResponse } from "next/server";
import {
  DatabaseUnavailableError,
  listPublishedProjects,
} from "@/lib/projects-data";

// Always read fresh from the database so newly published projects appear
// without a redeploy. (Cache Components are not enabled in this project.)
export const dynamic = "force-dynamic";

/**
 * GET /api/projects
 * Public, read-only. Returns only published projects, ordered by `order`.
 * Never exposes draft projects or internal fields.
 */
export async function GET() {
  try {
    const projects = await listPublishedProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: "Projects are not available yet.", code: "DATABASE_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    console.error("[api/projects] Failed to load projects:", error);
    return NextResponse.json(
      { error: "Unable to load projects right now. Please try again later." },
      { status: 500 },
    );
  }
}
