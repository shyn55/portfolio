"use client";

import { motion } from "framer-motion";
import { Code, Database, Server, Wrench } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import TechIcon from "./TechIcon";
import { skillCategories } from "@/data/skills";
import type { SkillCategory } from "@/data/skills";

const categoryIcons: Record<SkillCategory["icon"], typeof Code> = {
  code: Code,
  server: Server,
  database: Database,
  wrench: Wrench,
};

function SkillBar({ name, icon, level, index }: { name: string; icon: string; level: number; index: number }) {
  return (
    <div className="py-3.5 first:pt-1">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink-soft">
          <TechIcon name={icon} className="h-4 w-4 shrink-0 text-ink/45" />
          {name}
        </span>
        <span className="text-xs font-semibold tabular-nums text-faint">
          {level}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={level}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name} proficiency`}
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]"
      >
        <motion.div
          className="h-full rounded-full bg-ink"
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="bg-white py-24 md:py-32">
      <div className="container-site">
        <SectionHeading kicker="Expertise" title="My Skills" />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {skillCategories.map((category, ci) => {
            const CategoryIcon = categoryIcons[category.icon];
            return (
              <Reveal key={category.title} delay={ci * 0.08}>
                <div className="h-full rounded-xl border border-line bg-white p-7 sm:p-8">
                  <div className="flex items-center gap-3 border-b border-line pb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
                      <CategoryIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                      {category.title}
                    </h3>
                  </div>
                  <div className="mt-2 divide-y divide-line/70">
                    {category.skills.map((skill, si) => (
                      <SkillBar
                        key={skill.name}
                        name={skill.name}
                        icon={skill.icon}
                        level={skill.level}
                        index={si}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}