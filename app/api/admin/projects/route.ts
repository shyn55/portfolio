import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import {
  DatabaseUnavailableError,
  createProject,
  getNextOrder,
  listAllProjects,
  makeUniqueSlug,
} from "@/lib/projects-data";
import { parseProjectInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const projects = await listAllProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: "Database is not configured.", code: "DATABASE_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    console.error("[api/admin/projects] GET failed:", error);
    return NextResponse.json({ error: "Unable to load projects." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseProjectInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  // Full validation guarantees these fields are present on parsed.data.
  const d = parsed.data;
  const order = d.order ?? 0;

  try {
    const finalOrder = order === 0 ? await getNextOrder() : order;
    const slug = await makeUniqueSlug(d.title as string);
    const project = await createProject({
      title: d.title as string,
      slug,
      description: d.description as string,
      image: d.image as string,
      githubUrl: d.githubUrl ?? null,
      liveUrl: d.liveUrl ?? null,
      technologies: d.technologies as string[],
      category: d.category as string,
      featured: d.featured ?? false,
      published: d.published ?? false,
      order: finalOrder,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: "Database is not configured.", code: "DATABASE_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    console.error("[api/admin/projects] POST failed:", error);
    return NextResponse.json(
      { error: "Could not create the project. Please try again." },
      { status: 500 },
    );
  }
}
