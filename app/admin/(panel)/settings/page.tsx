import type { Metadata } from "next";
import {
  CheckCircle2,
  Database,
  ImageUp,
  KeyRound,
  Mail,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { getAdminEmail, isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { isBlobConfigured } from "@/lib/blob";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

function StatusRow({
  icon: Icon,
  label,
  ok,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            ok ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{detail}</p>
        </div>
      </div>
      {ok ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Configured" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0 text-amber-500" aria-label="Not configured" />
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const authConfigured = isAuthConfigured();
  const email = getAdminEmail();
  const dbConfigured = isDatabaseConfigured();
  const blobConfigured = isBlobConfigured();

  return (
    <div className="max-w-3xl">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configuration status for this deployment. No secrets are shown here.
        </p>
      </header>

      <div className="mt-8 space-y-4">
        <StatusRow
          icon={Mail}
          label="Admin email"
          ok={Boolean(authConfigured && email)}
          detail={
            authConfigured && email
              ? `Logins use ${email} (configured via ADMIN_EMAIL).`
              : "ADMIN_EMAIL is not set — logins are disabled."
          }
        />
        <StatusRow
          icon={KeyRound}
          label="Admin authentication"
          ok={authConfigured}
          detail={
            authConfigured
              ? "AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD_HASH are configured. Sessions are signed server-side."
              : "Set AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD_HASH in your environment (see .env.example)."
          }
        />
        <StatusRow
          icon={Database}
          label="Database (MongoDB Atlas)"
          ok={dbConfigured}
          detail={
            dbConfigured
              ? "MONGODB_URI is set. Projects are read from and written to MongoDB Atlas."
              : "MONGODB_URI is not set. Until it is, “My Works” shows its empty state and project actions are unavailable."
          }
        />
        <StatusRow
          icon={ImageUp}
          label="Image uploads (Vercel Blob)"
          ok={blobConfigured}
          detail={
            blobConfigured
              ? "BLOB_READ_WRITE_TOKEN is set — attached images upload to Vercel Blob and persist in production."
              : "BLOB_READ_WRITE_TOKEN is not set — attached images are stored locally for development only. Set the token on Vercel for production uploads."
          }
        />      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-slate-900">
          <ShieldCheck className="h-5 w-5 text-slate-400" aria-hidden="true" />
          How to finish the setup
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-600">
          <li>
            Create a free database cluster at{" "}
            <a
              href="https://www.mongodb.com/cloud/atlas"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500"
            >
              mongodb.com/cloud/atlas
            </a>{" "}
            and copy its connection string into <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">MONGODB_URI</code>{" "}
            in your <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code> file.
          </li>
          <li>
            Run <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run db:seed</code> to import the
            default portfolio projects.
          </li>
          <li>
            Change the admin password with{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run hash:password -- &quot;your-password&quot;</code>{" "}
            and put the output in <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">ADMIN_PASSWORD_HASH</code>.
          </li>
          <li>
            For production (Vercel), set the same variables in the project’s
            Environment Variables and redeploy.
          </li>
        </ol>
      </section>
    </div>
  );
}
