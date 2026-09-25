import type { Metadata } from "next";
import ProjectForm from "@/components/admin/ProjectForm";

export const metadata: Metadata = {
  title: "Add Project",
  robots: { index: false, follow: false },
};

export default function NewProjectPage() {
  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Add New Project
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the project details. Save it as a draft and publish it later,
          or publish right away — it will appear in “My Works” immediately.
        </p>
      </header>

      <div className="mt-8">
        <ProjectForm mode="create" />
      </div>
    </div>
  );
}
