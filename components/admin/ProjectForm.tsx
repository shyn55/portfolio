"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LoaderCircle, Paperclip, Save, Trash2, X } from "lucide-react";
import { PROJECT_CATEGORIES } from "@/data/projects";
import { PROJECT_IMAGE_PRESETS } from "@/data/image-presets";
import type { AdminProject } from "@/types/project";

const TECH_SUGGESTIONS = [
  "Next.js",
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "Prisma",
  "Tailwind CSS",
  "HTML5",
  "CSS3",
  "Docker",
  "Git",
  "GitHub",
];

const UPLOAD_ENDPOINT = "/api/admin/upload";

type FieldErrors = Partial<Record<"title" | "description" | "image" | "githubUrl" | "liveUrl" | "category" | "technologies" | "order", string>>;

function errorMessage(data: { error?: string; errors?: Record<string, string> }) {
  return data.error ?? null;
}

export default function ProjectForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: AdminProject;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [githubUrl, setGithubUrl] = useState(initial?.github ?? "");
  const [liveUrl, setLiveUrl] = useState(initial?.live ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [techInput, setTechInput] = useState("");
  const [technologies, setTechnologies] = useState<string[]>(initial?.technologies ?? []);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [published, setPublished] = useState(initial?.published ?? false);
  const [order, setOrder] = useState<string>(
    initial ? String(initial.order) : "0",
  );

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Image upload (attach) state ---
  const [uploading, setUploading] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  /** True when the current image came from an attach/upload (safe to delete on replace). */
  const isUploadedImage = image.startsWith("/uploads/") || /^https:\/\/.+\/projects\//.test(image);

  function clearImage() {
    setImage("");
    setUploadWarning(null);
  }

  async function uploadFile(file: File) {
    setBannerError(null);
    setUploadWarning(null);
    if (!file.type.startsWith("image/")) {
      setUploadWarning("That file is not an image. Use JPG, PNG, WebP, AVIF or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadWarning("Image is larger than 5 MB. Please choose a smaller file.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        warning?: string;
        error?: string;
      };
      if (res.ok && data.url) {
        setImage(data.url);
        setFieldErrors((prev) => ({ ...prev, image: undefined }));
        setUploadWarning(data.warning ?? null);
      } else {
        setUploadWarning(data.error ?? "Upload failed. Please try again.");
      }
    } catch {
      setUploadWarning("Could not reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-choosing the same file later
    if (file) void uploadFile(file);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!title.trim()) errors.title = "Title is required.";
    else if (title.trim().length > 120) errors.title = "Title must be 120 characters or fewer.";
    if (!description.trim()) errors.description = "Description is required.";
    else if (description.trim().length > 3000)
      errors.description = "Description must be 3000 characters or fewer.";
    if (!image.trim()) errors.image = "Choose an image or paste an image URL.";
    if (!category) errors.category = "Choose a category.";
    if (technologies.length === 0) errors.technologies = "Add at least one technology.";
    if (order.trim() !== "") {
      const n = Number(order);
      if (!Number.isInteger(n) || n < 0 || n > 100000)
        errors.order = "Display order must be a whole number (0–100000).";
    }
    for (const [key, value] of [
      ["githubUrl", githubUrl],
      ["liveUrl", liveUrl],
    ] as const) {
      const v = value.trim();
      if (v && !/^https?:\/\/.+/.test(v)) errors[key] = "Must start with http:// or https://";
    }
    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBannerError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      githubUrl: githubUrl.trim() || null,
      liveUrl: liveUrl.trim() || null,
      category,
      technologies,
      featured,
      published,
      order: order.trim() === "" ? 0 : Number(order),
    };

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/admin/projects/${initial!.id}` : "/api/admin/projects";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/projects");
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
        code?: string;
      };
      if (data.errors) {
        const fieldKeys: (keyof FieldErrors)[] = [
          "title",
          "description",
          "image",
          "githubUrl",
          "liveUrl",
          "category",
          "technologies",
          "order",
        ];
        const mapped: FieldErrors = {};
        for (const [k, v] of Object.entries(data.errors)) {
          const key = k as keyof FieldErrors;
          if (fieldKeys.includes(key)) mapped[key] = v;
        }
        setFieldErrors((prev) => ({ ...prev, ...mapped }));
      }
      setBannerError(
        errorMessage(data) ??
          (data.code === "DATABASE_NOT_CONFIGURED"              ? "The database is not configured yet. Set MONGODB_URI (see .env.example) before saving projects."
            : data.code === "AUTH_NOT_CONFIGURED"
              ? "Admin authentication is not configured on this deployment."
              : res.status === 404
                ? "This project no longer exists. It may have been deleted."
                : "Something went wrong. Please try again."),
      );
    } catch {
      setBannerError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function addTech(value: string) {
    const t = value.trim();
    if (!t) return;
    setTechnologies((prev) =>
      prev.some((x) => x.toLowerCase() === t.toLowerCase()) ? prev : [...prev, t],
    );
    setTechInput("");
  }

  function removeTech(value: string) {
    setTechnologies((prev) => prev.filter((t) => t !== value));
  }

  const inputClass = (invalid?: string) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${
      invalid
        ? "border-red-400 focus:border-red-400"
        : "border-slate-300 focus:border-slate-900"
    }`;

  const fieldError = (key: keyof FieldErrors) =>
    fieldErrors[key] ? (
      <p id={`error-${key}`} className="mt-1.5 text-xs text-red-600" role="alert">
        {fieldErrors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {bannerError && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {bannerError}
        </p>
      )}

      <div className="space-y-6">
        {/* Details */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">
            Details
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="pf-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                Project title *
              </label>
              <input
                id="pf-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={fieldErrors.title ? "error-title" : undefined}
                placeholder="CourseSite"
                className={inputClass(fieldErrors.title)}
              />
              {fieldError("title")}
            </div>

            <div>
              <label
                htmlFor="pf-description"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Description *
              </label>
              <textarea
                id="pf-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? "error-description" : undefined}
                placeholder="A modern educational platform built with Next.js."
                className={`${inputClass(fieldErrors.description)} resize-y`}
              />
              {fieldError("description")}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="pf-category"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Category *
                </label>
                <select
                  id="pf-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.category)}
                  aria-describedby={fieldErrors.category ? "error-category" : undefined}
                  className={inputClass(fieldErrors.category)}
                >
                  <option value="">Select a category…</option>
                  {PROJECT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {fieldError("category")}
              </div>

              <div>
                <label
                  htmlFor="pf-order"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Display order
                </label>
                <input
                  id="pf-order"
                  type="number"
                  min={0}
                  max={100000}
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.order)}
                  aria-describedby={
                    fieldErrors.order ? "error-order" : "pf-order-hint"
                  }
                  className={inputClass(fieldErrors.order)}
                />
                <p id="pf-order-hint" className="mt-1.5 text-xs text-slate-400">
                  0 = appear at the end. Lower numbers appear first in “My Works”.
                </p>
                {fieldError("order")}
              </div>
            </div>
          </div>
        </section>

        {/* Image */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">
            Project image *
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Attach an image from your device, pick a bundled placeholder, or paste
            any image URL. Only the URL is stored — never the file itself.
          </p>

          {/* Attach zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`mt-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragActive
                ? "border-slate-900 bg-slate-50"
                : "border-slate-300 bg-slate-50/50"
            }`}
          >
            <input
              ref={uploadInputRef}
              id="pf-image-file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              onChange={onPickFile}
              className="sr-only"
              disabled={uploading}
            />
            <Paperclip
              className="mx-auto h-6 w-6 text-slate-400"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm text-slate-600">
              {uploading ? (
                <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Uploading…
                </span>
              ) : (
                <>
                  Drag &amp; drop an image here, or{" "}
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    disabled={uploading}
                    className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500 disabled:opacity-50"
                  >
                    attach a file
                  </button>{" "}
                  from your computer or phone.
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              JPG, PNG, WebP, AVIF or GIF · up to 5 MB
            </p>
          </div>
          <div aria-live="polite">
            {uploadWarning && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700"
              >
                {uploadWarning}
              </p>
            )}
          </div>

          {/* Bundled placeholder quick-picks */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Or choose a placeholder
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {PROJECT_IMAGE_PRESETS.map((src) => {
              const selected = image === src;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImage(src)}
                  aria-pressed={selected}
                  aria-label={`Use placeholder image ${src}`}
                  className={`relative h-20 w-28 overflow-hidden rounded-lg border-2 transition ${
                    selected
                      ? "border-slate-900 ring-2 ring-slate-900/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="112px" className="object-cover" />
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected image + manual URL */}
          <div className="mt-6">
            <label htmlFor="pf-image" className="mb-1.5 block text-sm font-medium text-slate-700">
              Image path or URL *
            </label>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <input
                  id="pf-image"
                  type="text"
                  value={image}
                  onChange={(e) => {
                    setImage(e.target.value);
                    setUploadWarning(null);
                  }}
                  aria-invalid={Boolean(fieldErrors.image)}
                  aria-describedby={fieldErrors.image ? "error-image" : undefined}
                  placeholder="/images/projects/project-1.png, /uploads/… or https://…"
                  className={inputClass(fieldErrors.image)}
                />
                {fieldError("image")}
                {image && isUploadedImage && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove selected image
                  </button>
                )}
              </div>
              {image && (
                <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 sm:block">
                  <Image
                    src={image}
                    alt="Current project image preview"
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized={!image.startsWith("/")}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">
            Links
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Optional. Buttons are hidden on the public site when a link is empty.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-github" className="mb-1.5 block text-sm font-medium text-slate-700">
                GitHub URL
              </label>
              <input
                id="pf-github"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                aria-invalid={Boolean(fieldErrors.githubUrl)}
                aria-describedby={fieldErrors.githubUrl ? "error-githubUrl" : undefined}
                placeholder="https://github.com/shayan/coursesite"
                className={inputClass(fieldErrors.githubUrl)}
              />
              {fieldError("githubUrl")}
            </div>
            <div>
              <label htmlFor="pf-live" className="mb-1.5 block text-sm font-medium text-slate-700">
                Live demo URL
              </label>
              <input
                id="pf-live"
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                aria-invalid={Boolean(fieldErrors.liveUrl)}
                aria-describedby={fieldErrors.liveUrl ? "error-liveUrl" : undefined}
                placeholder="https://coursesite-demo.vercel.app"
                className={inputClass(fieldErrors.liveUrl)}
              />
              {fieldError("liveUrl")}
            </div>
          </div>
        </section>

        {/* Technologies */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">
            Technologies *
          </h2>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Added technologies">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-medium text-slate-700"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => removeTech(tech)}
                  aria-label={`Remove ${tech}`}
                  className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-4 max-w-md">
            <label htmlFor="pf-tech" className="mb-1.5 block text-sm font-medium text-slate-700">
              Add technology
            </label>
            <div className="flex gap-2">
              <input
                id="pf-tech"
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTech(techInput);
                  }
                }}
                placeholder="e.g. PostgreSQL"
                className={inputClass(fieldErrors.technologies)}
              />
              <button
                type="button"
                onClick={() => addTech(techInput)}
                className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Add
              </button>
            </div>
            {fieldError("technologies")}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {TECH_SUGGESTIONS.filter((s) => !technologies.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTech(s)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
              >
                + {s}
              </button>
            ))}
          </div>
        </section>

        {/* Publish */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-base font-semibold tracking-tight text-slate-900">
            Publishing
          </h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-6 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Published</p>
                <p className="text-xs text-slate-500">
                  Only published projects appear in “My Works”. Save as a draft to
                  prepare it in advance.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={published}
                onClick={() => setPublished((v) => !v)}
                className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  published ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    published ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between gap-6 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Featured</p>
                <p className="text-xs text-slate-500">
                  Marks the project for future spotlight sections.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={featured}
                onClick={() => setFeatured((v) => !v)}
                className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  featured ? "bg-violet-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    featured ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Link
          href="/admin/projects"
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Create project"}
        </button>
      </div>
    </form>
  );
}
