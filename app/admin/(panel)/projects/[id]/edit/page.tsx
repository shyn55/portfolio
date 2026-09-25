import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DbNotice from "@/components/admin/DbNotice";
import ProjectForm from "@/components/admin/ProjectForm";
import {
  DatabaseUnavailableError,
  getProjectById,
} from "@/lib/projects-data";

export const metadata: Metadata = {
  title: "Edit Project",
  robots: { index: false, follow: false },
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project;
  let dbError: "unconfigured" | "error" | null = null;
  try {
    project = await getProjectById(id);
  } catch (error) {
    dbError = error instanceof DatabaseUnavailableError ? "unconfigured" : "error";
  }

  if (dbError) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Edit Project
        </h1>
        <div className="mt-8">
          <DbNotice
            showSetupHint={dbError === "unconfigured"}
            title={dbError === "unconfigured" ? "Database not configured" : "Could not load this project"}
            message={
              dbError === "unconfigured"
                ? "Add a MongoDB Atlas connection string as MONGODB_URI, run the seed (see README), then reload this page."
                : "Something went wrong while reading the database. Please try again in a moment."
            }
          />
        </div>
      </div>
    );
  }

  if (!project) notFound();

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Edit Project
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Changes are saved to the database and appear on the public portfolio
          immediately (when published).
        </p>
      </header>

      <div className="mt-8">
        <ProjectForm mode="edit" initial={project} />
      </div>
    </div>
  );
}
