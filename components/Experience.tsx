"use client";

import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { experience } from "@/data/experience";

export default function Experience() {
  return (
    <section id="experience" className="bg-white py-24 md:py-32">
      <div className="container-site">
        <SectionHeading kicker="Career Path" title="Experience" />

        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Vertical line */}
          <div
            aria-hidden="true"
            className="absolute bottom-2 left-[7px] top-2 w-px bg-line md:left-[9px]"
          />

          <ol className="space-y-12">
            {experience.map((item, i) => (
              <li key={item.role} className="relative pl-10 md:pl-14">
                {/* Dot */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border-2 border-ink bg-white md:h-[19px] md:w-[19px]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-ink md:h-2 md:w-2" />
                </span>

                <Reveal delay={i * 0.06}>
                  <article className="rounded-xl border border-line bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_20px_45px_-25px_rgba(17,24,39,0.25)] sm:p-7">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
                        {item.role}
                      </h3>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                        {item.period}
                      </p>
                    </div>
                    <p className="mt-1 text-sm font-medium text-ink-soft">
                      {item.company}
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      {item.description}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {item.tech.map((tech) => (
                        <li
                          key={tech}
                          className="rounded-md bg-mist px-2.5 py-1 text-[11px] font-medium text-ink-soft"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}