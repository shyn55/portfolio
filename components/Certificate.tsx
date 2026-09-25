"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

// Single source of truth — used by BOTH the section preview and the lightbox.
// The ?v= query busts caches (Next image optimizer + browser) so replacing the
// file on disk always shows up; bump to v=3, v=4, … whenever the image changes.
const CERT_IMAGE = "/images/certificates/fullstack.png?v=2";
const CERT_ALT = "Full-Stack Web Development Certificate";

/**
 * Premium single-certificate showcase. The certificate image (drop the real
 * file at /public/images/certificates/fullstack.png) is the hero: framed,
 * elevated, subtly zooming on hover and opening full-size in a lightbox.
 */
export default function Certificate() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lightbox: close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <section id="certificate" className="bg-mist py-24 md:py-32">
      <div className="container-site">
        <SectionHeading kicker="Certificate" title="Full-Stack Web Development" />

        <Reveal delay={0.08}>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-body">
            Professional Full-Stack Web Development Certificate
          </p>
        </Reveal>

        <div className="relative mt-14 md:mt-16">
          {/* Subtle ambient background elements */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[min(720px,92%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(17,24,39,0.055),transparent)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 hidden h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/5 lg:block"
          />

          {/* Framed certificate */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 36, scale: reduce ? 1 : 0.975 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="group relative mx-auto max-w-4xl"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-label="Open certificate in full view"
              className="block w-full cursor-zoom-in rounded-lg border border-line bg-white p-3 text-left shadow-[0_30px_60px_-30px_rgba(17,24,39,0.35)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_50px_90px_-40px_rgba(17,24,39,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:p-4"
            >
              <span className="relative block aspect-[1.414/1] w-full overflow-hidden rounded-[4px] ring-1 ring-ink/5">
                <Image
                  src={CERT_IMAGE}
                  alt={CERT_ALT}
                  fill
                  sizes="(max-width: 896px) 92vw, 896px"
                  className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
                <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Maximize2 className="h-3 w-3" aria-hidden="true" />
                  View
                </span>
              </span>
            </button>
          </motion.div>

          <Reveal delay={0.15} className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
              View Certificate
            </button>
          </Reveal>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`${CERT_ALT} — full view`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm outline-none sm:p-8"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close certificate view"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-6 sm:top-6"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <motion.figure
              initial={{ opacity: 0, scale: reduce ? 1 : 0.92, y: reduce ? 0 : 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative aspect-[1.414/1] w-[min(92vw,calc((100vh-8rem)*1.414))]"
            >
              <Image
                src={CERT_IMAGE}
                alt={CERT_ALT}
                fill
                sizes="92vw"
                className="rounded-md object-contain shadow-2xl"
                priority
              />
            </motion.figure>

            <p className="absolute bottom-5 left-1/2 w-max max-w-[92vw] -translate-x-1/2 text-center text-xs text-white/50 sm:bottom-7">
              {CERT_ALT}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
