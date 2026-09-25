import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { getSessionEmail } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const email = await getSessionEmail();
  if (email) redirect("/admin/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-slate-300"
        >
          ← Back to portfolio
        </Link>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40">
          <div className="border-b border-slate-800 px-7 pb-6 pt-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-display text-base font-bold tracking-tight text-slate-900">
              S
            </span>
            <h1 className="mt-4 font-display text-xl font-semibold tracking-tight text-white">
              Admin Login
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your portfolio projects.
            </p>
          </div>
          <div className="px-7 py-7">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
          Protected area — access is restricted to the site owner.
        </p>
      </div>
    </div>
  );
}
