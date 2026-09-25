import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getAdminEmail,
  isAuthConfigured,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        error: "Admin authentication is not configured on this deployment.",
        code: "AUTH_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const configuredEmail = (getAdminEmail() ?? "").toLowerCase();

  if (!trimmedEmail || trimmedEmail.length > 254 || password.length === 0 || password.length > 200) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const passwordMatches =
    trimmedEmail === configuredEmail &&
    verifyPassword(password, process.env.ADMIN_PASSWORD_HASH as string);

  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    createSessionToken(configuredEmail),
    sessionCookieOptions(),
  );

  return NextResponse.json({ ok: true, email: configuredEmail });
}
