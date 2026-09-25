"use client";

import Reveal from "./Reveal";

type SectionHeadingProps = {
  kicker: string;
  title: string;
  align?: "center" | "left";
  className?: string;
};

export default function SectionHeading({
  kicker,
  title,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <Reveal
      className={`${centered ? "text-center" : "text-left"} ${className}`}
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.32em] text-faint">
        {kicker}
      </p>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
        {title}
        <span className="text-ink/25">.</span>
      </h2>
      {centered && (
        <div
          aria-hidden="true"
          className="mx-auto mt-5 h-px w-14 bg-ink/15"
        />
      )}
    </Reveal>
  );
}