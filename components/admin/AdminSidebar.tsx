"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  FolderKanban,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/projects/new", label: "Add Project", icon: Plus },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/admin/dashboard" && pathname.startsWith(`${href}/`));

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Even if the request failed, still return to the login screen.
    }
    setLoggingOut(false);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-800 bg-slate-950 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 px-5 py-4">
        <Link
          href="/admin/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-display text-sm font-bold tracking-tight text-slate-900"
          aria-label="Admin home"
        >
          S
        </Link>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold tracking-tight text-white">
            Shayan&apos;s Portfolio
          </p>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Admin Panel</p>
        </div>
      </div>

      {/* Desktop heading */}
      <p className="hidden px-5 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 lg:block">
        Manage
      </p>

      <nav
        aria-label="Admin navigation"
        className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:shrink ${
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-slate-800 p-4 lg:block">
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200"
            aria-hidden="true"
          >
            {email.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-200">{email}</p>
            <p className="text-[11px] text-slate-500">Administrator</p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            View portfolio
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
          >
            {loggingOut ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            Log out
          </button>
        </div>
      </div>

      {/* Mobile bottom actions */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-800 px-4 py-3 lg:hidden">
        <p className="min-w-0 truncate text-xs text-slate-400">{email}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/"
            aria-label="View portfolio"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Log out"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
          >
            {loggingOut ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
