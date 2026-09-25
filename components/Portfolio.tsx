"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, FolderOpen } from "lucide-react";
import BrandIcon from "./BrandIcons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { filters } from "@/data/projects";
import type { PublicProject } from "@/types/project";

type Filter = (typeof filters)[number];

/** Card display shape (kept small so cards stay fast & pure). */
type CardProject = {
  id: string;
  title: string;
  category: string;
  description: string;
  tech: string[];
  image: string;
  github: string | null;
  live: string | null;
};

const SKELETON_COUNT = 6;

function toCardProject(p: PublicProject): CardProject {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    description: p.description,
    tech: p.technologies,
    image: p.image,
    github: p.github,
    live: p.live,
  };
}

function ProjectCard({ project }: { project: CardProject }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow duration-300 hover:shadow-[0_28px_55px_-28px_rgba(17,24,39,0.3)]"
    >
      {/* Image + hover overlay */}
      <div className="relative aspect-[3/2] overflow-hidden bg-mist">
        <Image
          src={project.image}
          alt={`${project.title} project preview`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent opacity-0 transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-100"
        />
        {/* Info revealed on hover (hover-capable devices) */}
        <div className="absolute inset-x-0 bottom-0 translate-y-4 p-6 opacity-0 transition-all duration-500 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">
            {project.category}
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-white">
            {project.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/75">
            {project.description}
          </p>
          {(project.github || project.live) && (
            <div className="mt-4 flex items-center gap-3">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${project.title} on GitHub`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white hover:text-ink"
                >
                  <BrandIcon name="github" className="h-[18px] w-[18px]" />
                </a>
              )}
              {project.live && (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${project.title} live demo`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-white/85"
                >
                  Live Demo
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Always-visible card body (also the accessible fallback on touch) */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
            {project.title}
          </h3>
          <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/60">
            {project.category}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-body">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-ink-soft"
            >
              {tech}
            </span>
          ))}
        </div>
        {(project.github || project.live) && (
          <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-ink/60"
              >
                <BrandIcon name="github" className="h-4 w-4" />
                GitHub
              </a>
            )}
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-ink/60"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Live Demo
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

/** Placeholder card shown while projects load — same footprint as a real card. */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="aspect-[3/2] animate-pulse bg-mist" />
      <div className="p-6">
        <div className="h-5 w-2/3 animate-pulse rounded bg-mist" />
        <div className="mt-4 h-3 w-full animate-pulse rounded bg-mist" />
        <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-mist" />
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="h-6 w-16 animate-pulse rounded-md bg-mist" />
          <div className="h-6 w-20 animate-pulse rounded-md bg-mist" />
          <div className="h-6 w-14 animate-pulse rounded-md bg-mist" />
        </div>
      </div>
    </div>
  );
}

function WorksEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mt-12 max-w-md rounded-xl border border-line bg-white px-8 py-16 text-center"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mist">
        <FolderOpen className="h-6 w-6 text-ink/40" aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-ink">
        No projects available yet
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-body">
        New work is on the way. Check back soon.
      </p>
    </motion.div>
  );
}

export default function Portfolio() {
  const [filter, setFilter] = useState<Filter>("All");
  const [projects, setProjects] = useState<CardProject[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    (async () => {
      try {
        const res = await fetch("/api/projects", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data = (await res.json()) as { projects: PublicProject[] };
        setProjects((data.projects ?? []).map(toCardProject));
        setStatus("ready");
      } catch {
        // Timeouts (AbortError) and network errors both surface as the error state.
        setStatus("error");
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [reloadKey]);

  function retry() {
    setStatus("loading");
    setReloadKey((k) => k + 1);
  }

  const visible =
    filter === "All"
      ? projects
      : projects.filter((p) => p.category === filter);

  return (
    <section id="works" className="bg-mist py-24 md:py-32">
      <div className="container-site">
        <SectionHeading kicker="Portfolio" title="My Works" />

        {/* Filters */}
        <Reveal delay={0.1}>
          <div
            role="tablist"
            aria-label="Filter projects by category"
            className="mt-12 flex flex-wrap justify-center gap-2.5"
          >
            {filters.map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  disabled={status === "loading"}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-ink text-white shadow-[0_10px_24px_-10px_rgba(17,24,39,0.6)]"
                      : "border border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink disabled:opacity-60"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Live region for assistive tech */}
        <p aria-live="polite" className="sr-only">
          {status === "loading"
            ? "Loading projects."
            : status === "error"
              ? "Projects could not be loaded."
              : `${visible.length} project${visible.length === 1 ? "" : "s"} shown.`}
        </p>

        {/* Loading skeleton */}
        {status === "loading" && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 rounded-xl border border-line bg-white px-8 py-14 text-center"
          >
            <p className="text-sm text-body">
              We couldn&apos;t load the projects right now.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/85"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Ready + empty */}
        {status === "ready" && projects.length === 0 && <WorksEmptyState />}

        {/* Grid */}
        {status === "ready" && projects.length > 0 && (
          <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Ready, but the selected filter has no matches */}
        {status === "ready" && projects.length > 0 && visible.length === 0 && (
          <p className="mt-12 text-center text-sm text-body">
            No projects in this category yet.
          </p>
        )}
      </div>
    </section>
  );
}
