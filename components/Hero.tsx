"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ParticleBackground from "./ParticleBackground";
import SocialLinks from "./SocialLinks";

const TITLES = [
  "Full-Stack Developer",
  "JavaScript Developer",
  "React Developer",
  "Next.js Developer",
];

/**
 * Cycles through the given words with a type / pause / delete rhythm.
 * Returns a static word when reduced motion is preferred.
 */
function useTypewriter(words: string[]) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [sub, setSub] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) return;

    const word = words[index];
    let delay = deleting ? 38 : 80;
    if (!deleting && sub === word.length) delay = 1800;
    if (deleting && sub === 0) delay = 350;

    const timer = setTimeout(() => {
      if (!deleting && sub === word.length) {
        setDeleting(true);
      } else if (deleting && sub === 0) {
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      } else {
        setSub((s) => s + (deleting ? -1 : 1));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [sub, deleting, index, words, reduce]);

  if (reduce) return words[0];
  return words[index].slice(0, sub);
}

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Hero() {
  const typed = useTypewriter(TITLES);

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c0f15]"
    >
      {/* Background image + overlays */}
      <Image
        src="/images/Hero2.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/55" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/60"
      />
      <ParticleBackground className="absolute inset-0 h-full w-full" />

      {/* Content */}
      <div className="container-site relative z-10 flex flex-col items-center text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.25}
          className="mb-6 text-sm font-medium uppercase tracking-[0.5em] text-white/60 sm:text-base"
        >
          Hello
        </motion.p>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.45}
          className="font-display text-[2rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.4rem]"
        >
          <span className="block sm:inline">I Am a&nbsp;</span>
          <span className="whitespace-nowrap">{typed}</span>
          <span
            aria-hidden="true"
            className="animate-caret ml-1.5 inline-block h-[0.92em] w-[3px] translate-y-[0.12em] rounded-full bg-white align-baseline"
          />
        </motion.h1>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.7}
          className="mt-10"
        >
          <SocialLinks tone="light" />
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.a
        href="#about"
        aria-label="Scroll to About section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-white/50 transition-colors hover:text-white"
      >
        <motion.span
          className="block"
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }}
        >
          <ChevronDown className="h-6 w-6" aria-hidden="true" />
        </motion.span>
      </motion.a>
    </section>
  );
}