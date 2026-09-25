import type { CSSProperties } from "react";

const techs = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "Git",
  "GitHub",
];

function Row({ hidden = false }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {techs.map((tech) => (
        <span key={tech} className="flex items-center">
          <span className="whitespace-nowrap px-8 font-display text-2xl font-semibold tracking-wide text-white/30 transition-colors duration-300 hover:text-white/70 sm:text-3xl">
            {tech}
          </span>
          <span aria-hidden="true" className="text-sm text-white/15">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

export default function TechMarquee() {
  return (
    <section
      aria-label="Technologies I work with"
      className="overflow-hidden border-y border-white/10 bg-ink py-12 md:py-14"
    >
      <div
        className="animate-marquee flex w-max hover:[animation-play-state:paused]"
        style={{ "--marquee-duration": "38s" } as CSSProperties}
      >
        <Row />
        <Row hidden />
      </div>
    </section>
  );
}