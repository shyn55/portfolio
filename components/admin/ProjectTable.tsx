"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LoaderCircle,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { PROJECT_CATEGORIES } from "@/data/projects";
import { formatDate } from "@/lib/format";
import type { AdminProject } from "@/types/project";

type Props = {
  projects: AdminProject[];
};

type PatchResponse = { project?: AdminProject; error?: string };

async function patchProject(id: string, body: Record<string, unknown>): Promise<PatchResponse> {
  const res = await fetch(`/api/admin/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: data.error ?? "Request failed." };
  }
  const data = (await res.json()) as { project: AdminProject };
  return { project: data.project };
}

function ConfirmDeleteDialog({
  project,
  onCancel,
  onDeleted,
}: {
  project: AdminProject;
  onCancel: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not delete the project.");
        setDeleting(false);
        return;
      }
      onDeleted(project.id);
    } catch {
      setError("Could not delete the project. Check your connection and try again.");
      setDeleting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="delete-dialog-title" className="font-display text-lg font-semibold text-slate-900">
            Delete this project?
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-900">&ldquo;{project.title}&rdquo;</span>?
          This action cannot be undone and the project will disappear from your
          portfolio immediately.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectTable({ projects: initialProjects }: Props) {
  const [rows, setRows] = useState<AdminProject[]>(initialProjects);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminProject | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (status === "published" && !p.published) return false;
      if (status === "draft" && p.published) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [rows, query, category, status]);

  async function toggleField(id: string, field: "published" | "featured") {
    setPending(id);
    setActionError(null);
    const result = await patchProject(id, { [field]: !rows.find((r) => r.id === id)?.[field] });
    setPending(null);
    if (result.project) {
      setRows((prev) => prev.map((r) => (r.id === id ? result.project! : r)));
    } else {
      setActionError(result.error ?? "Could not update the project.");
    }
  }

  function handleDeleted(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setToDelete(null);
  }

  const hasRows = rows.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <input
            id="project-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, tech or description…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-slate-900"
            >
              <option value="all">All categories</option>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="sr-only">Filter by status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-slate-900"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
      </div>

      {actionError && (
        <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {!hasRows ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm text-slate-500">No projects yet.</p>
          <Link
            href="/admin/projects/new"
            className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Add your first project
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <p className="px-5 py-14 text-center text-sm text-slate-500">
          No projects match your filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th scope="col" className="px-5 py-3 font-semibold">
                  Project
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Category
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Technologies
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Created
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((project) => {
                const isPending = pending === project.id;
                return (
                  <tr key={project.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={project.image}
                          alt=""
                          width={72}
                          height={48}
                          className="h-12 w-[72px] shrink-0 rounded-md border border-slate-200 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {project.title}
                            {project.featured && (
                              <Star
                                className="ml-1.5 inline h-3.5 w-3.5 -translate-y-px fill-amber-400 text-amber-400"
                                aria-label="Featured"
                              />
                            )}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            /projects/{project.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {project.category}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-5 py-3">
                      <p className="truncate text-xs text-slate-500">
                        {project.technologies.join(" · ")}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={project.published}
                        disabled={isPending}
                        onClick={() => toggleField(project.id, "published")}
                        title={project.published ? "Unpublish (hide from portfolio)" : "Publish (show on portfolio)"}
                        className={`inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-60 ${
                          project.published ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            project.published ? "translate-x-[18px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-xs font-medium text-slate-600">
                        {project.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(project.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleField(project.id, "featured")}
                          disabled={isPending}
                          aria-pressed={project.featured}
                          title={project.featured ? "Remove featured" : "Mark featured"}
                          className={`rounded-md p-2 transition-colors disabled:opacity-60 ${
                            project.featured
                              ? "text-amber-500 hover:bg-amber-50"
                              : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
                          }`}
                        >
                          <Star
                            className={`h-4 w-4 ${project.featured ? "fill-amber-400 text-amber-400" : ""}`}
                            aria-hidden="true"
                          />
                          <span className="sr-only">
                            {project.featured ? "Unmark" : "Mark"} {project.title} as featured
                          </span>
                        </button>
                        <Link
                          href={`/admin/projects/${project.id}/edit`}
                          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Edit ${project.title}`}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setToDelete(project)}
                          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${project.title}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {toDelete && (
        <ConfirmDeleteDialog
          project={toDelete}
          onCancel={() => setToDelete(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
