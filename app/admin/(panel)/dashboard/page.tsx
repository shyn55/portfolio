import Link from "next/link";
import type { Metadata } from "next";
import { FileText, FolderKanban, Globe, Pencil, Plus, Star, type LucideIcon } from "lucide-react";
import DbNotice from "@/components/admin/DbNotice";
import {
  DatabaseUnavailableError,
  getProjectStats,
  listAllProjects,
} from "@/lib/projects-data";
import { formatDate } from "@/lib/format";
import type { AdminProject, ProjectStats } from "@/types/project";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

type StatProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  tint: string;
};

function StatCard({ label, value, icon: Icon, tint }: StatProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${tint}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  let stats: ProjectStats | null = null;
  let recent: AdminProject[] = [];
  let dbError: "unconfigured" | "error" | null = null;

  try {
    stats = await getProjectStats();
    const all = await listAllProjects();
    recent = all.slice(0, 5);
  } catch (error) {
    dbError = error instanceof DatabaseUnavailableError ? "unconfigured" : "error";
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your portfolio projects.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add New Project
        </Link>
      </header>

      {dbError ? (
        <div className="mt-8">
          <DbNotice
            showSetupHint={dbError === "unconfigured"}
            title={dbError === "unconfigured" ? "Database not configured" : "Could not load data"}
            message={
              dbError === "unconfigured"
                ? "Add a MongoDB Atlas connection string as MONGODB_URI, run the seed (see README), then reload this page."
                : "Something went wrong while reading the database. Please try again in a moment."
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Projects"
              value={stats!.total}
              icon={FolderKanban}
              tint="bg-slate-100 text-slate-700"
            />
            <StatCard
              label="Published"
              value={stats!.published}
              icon={Globe}
              tint="bg-emerald-100 text-emerald-700"
            />
            <StatCard
              label="Drafts"
              value={stats!.drafts}
              icon={FileText}
              tint="bg-amber-100 text-amber-700"
            />
            <StatCard
              label="Featured"
              value={stats!.featured}
              icon={Star}
              tint="bg-violet-100 text-violet-700"
            />
          </div>

          <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">
                Recent Projects
              </h2>
              <Link
                href="/admin/projects"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                View all →
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="text-sm text-slate-500">No projects yet.</p>
                <Link
                  href="/admin/projects/new"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Title
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Category
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Updated
                      </th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.map((project) => (
                      <tr key={project.id} className="transition-colors hover:bg-slate-50">
                        <td className="max-w-[240px] truncate px-5 py-3.5 font-medium text-slate-900">
                          {project.title}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{project.category}</td>
                        <td className="px-5 py-3.5">
                          {project.published ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {formatDate(project.updatedAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/admin/projects/${project.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
