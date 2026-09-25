import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import DbNotice from "@/components/admin/DbNotice";
import ProjectTable from "@/components/admin/ProjectTable";
import {
  DatabaseUnavailableError,
  listAllProjects,
} from "@/lib/projects-data";
import type { AdminProject } from "@/types/project";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

export default async function AdminProjectsPage() {
  let projects: AdminProject[] = [];
  let dbError: "unconfigured" | "error" | null = null;

  try {
    projects = await listAllProjects();
  } catch (error) {
    dbError = error instanceof DatabaseUnavailableError ? "unconfigured" : "error";
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Projects
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {dbError
              ? "Manage the projects shown in “My Works”."
              : `${projects.length} project${projects.length === 1 ? "" : "s"} in total.`}
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

      <div className="mt-8">
        {dbError ? (
          <DbNotice
            showSetupHint={dbError === "unconfigured"}
            title={dbError === "unconfigured" ? "Database not configured" : "Could not load projects"}
            message={
              dbError === "unconfigured"
                ? "Add a MongoDB Atlas connection string as MONGODB_URI, run the seed (see README), then reload this page."
                : "Something went wrong while reading the database. Please try again in a moment."
            }
          />
        ) : (
          <ProjectTable projects={projects} />
        )}
      </div>
    </div>
  );
}
