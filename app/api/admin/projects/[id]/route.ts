import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import {
  DatabaseUnavailableError,
  deleteProject,
  getProjectById,
  makeUniqueSlug,
  updateProject,
} from "@/lib/projects-data";
import { parseProjectInput } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

function dbErrorResponse(error: unknown, action: string) {
  if (error instanceof DatabaseUnavailableError) {
    return NextResponse.json(
      { error: "Database is not configured.", code: "DATABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  console.error(`[api/admin/projects] ${action} failed:`, error);
  return NextResponse.json(
    { error: `Could not ${action} the project. Please try again.` },
    { status: 500 },
  );
}

export async function PATCH(request: Request, { params }: Params) {
  const email = await getSessionEmail();
  if (!email) return unauthorized();

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Small convenience: a PATCH of just { published } / { featured } is enough.
  const parsed = parseProjectInput(body, { partial: true });
  if (!parsed.ok) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  try {
    const current = await getProjectById(id);
    if (!current) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    type PatchInput = {
      title?: string;
      slug?: string;
      description?: string;
      image?: string;
      githubUrl?: string | null;
      liveUrl?: string | null;
      technologies?: string[];
      category?: string;
      featured?: boolean;
      order?: number;
      published?: boolean;
    };

    const data: PatchInput = { ...parsed.data };

    // Keep the slug in sync with the title (unique, auto-generated).
    if (data.title !== undefined && data.title.trim() !== current.title) {
      data.slug = await makeUniqueSlug(data.title);
    }

    const project = await updateProject(id, data);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error) {
    return dbErrorResponse(error, "update");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const email = await getSessionEmail();
  if (!email) return unauthorized();

  const { id } = await params;

  try {
    const existing = await getProjectById(id);
    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error, "delete");
  }
}
