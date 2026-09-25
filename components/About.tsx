"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useInView } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { site } from "@/data/site";

function CountUp({
  to,
  suffix = "",
  className = "",
}: {
  to: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1200;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}

const stats = [
  { value: 3, suffix: "+", label: "Years Experience" },
  { value: 20, suffix: "+", label: "Projects Completed" },
  { value: 10, suffix: "+", label: "Technologies" },
];

export default function About() {
  return (
    <section id="about" className="bg-white py-24 md:py-32">
      <div className="container-site">
        <div className="grid items-center gap-14 lg:grid-cols-[5fr_6fr] lg:gap-20">
          {/* Image */}
          <Reveal>
            <div className="group relative mx-auto max-w-md lg:max-w-none">
              <div
                aria-hidden="true"
                className="absolute -bottom-4 -right-4 h-full w-full rounded-lg border-2 border-ink/10 transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1"
              />
              <div className="relative overflow-hidden rounded-lg shadow-[0_20px_60px_-25px_rgba(17,24,39,0.35)]">
                <Image
                  src="/images/profile.jpg"
                  alt="Portrait of Shayan, Full-Stack Web Developer"
                  width={900}
                  height={1100}
                  sizes="(min-width: 1024px) 42vw, 90vw"
                  className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </Reveal>

          {/* Text */}
          <div>
            <Reveal>
              <SectionHeading kicker="Get to Know Me" title="About Me" align="left" />
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-4 font-display text-lg font-medium text-ink-soft">
                {site.role}
              </p>
              <p className="mt-5 leading-relaxed text-body">
                I&apos;m a passionate Full-Stack Web Developer focused on
                building modern, scalable and high-performance web
                applications. I enjoy working across the whole stack — from
                crafting clean, responsive interfaces to designing solid
                backend architectures.
              </p>
              <p className="mt-4 leading-relaxed text-body">
                Clean code, modern UI/UX and performance are at the core of
                everything I ship. I&apos;m always learning new technologies
                and applying them to real problems, turning ideas into
                products people love to use.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={site.cv}
                  download
                  className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-dark hover:shadow-[0_14px_30px_-12px_rgba(17,24,39,0.5)]"
                >
                  <Download
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5"
                    aria-hidden="true"
                  />
                  Download CV
                </a>
                <a
                  href="#contact"
                  className="group inline-flex items-center gap-2 rounded-full border border-ink/15 px-7 py-3.5 text-sm font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white"
                >
                  Let&apos;s Talk
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                      <CountUp to={stat.value} suffix={stat.suffix} />
                    </dd>
                    <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.14em] text-faint sm:text-[13px]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}