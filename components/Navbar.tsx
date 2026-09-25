"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { nav, site } from "@/data/site";
import { useActiveSection } from "@/lib/useActiveSection";

const SECTION_IDS = [
  "home",
  "about",
  "certificate",
  "skills",
  "works",
  "experience",
  "contact",
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <>
      <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-line bg-white/90 shadow-[0_1px_20px_rgba(17,24,39,0.06)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="container-site flex h-16 items-center justify-between md:h-20"
      >
        {/* Brand */}
               {/* Brand */}
        <a
          href="#home"
          className={`font-display text-lg font-bold tracking-[0.28em] transition-colors ${
            solid ? "text-ink" : "text-white"
          }`}
        >
          {/* اگر اسکرول کرده باشیم (solid=true) لوگوی مشکی، وگرنه لوگوی سفید */}
          <img
            src={solid ? "/images/logo1.png" : "/images/logo2.png"}
            alt={site.name}
            className="h-14 w-auto object-contain transition-opacity duration-300"
          />
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => {
            const isActive = active === item.href.slice(1);
            return (
              <li key={item.href} className="relative">
                <a
                  href={item.href}
                  className={`text-[13px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 ${
                    solid
                      ? isActive
                        ? "text-ink"
                        : "text-ink/55 hover:text-ink"
                      : isActive
                        ? "text-white"
                        : "text-white/65 hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1.5 left-0 h-[2px] w-full bg-ink"
                    style={!solid ? { backgroundColor: "#ffffff" } : undefined}
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden ${
            solid ? "text-ink hover:bg-ink/5" : "text-white hover:bg-white/10"
          }`}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      </header>

      {/* Mobile overlay menu (sibling of <header> so position:fixed covers the viewport) */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-16 z-40 flex flex-col bg-ink md:top-20 lg:hidden"
          >
            <nav
              aria-label="Mobile navigation"
              className="container-site flex flex-1 flex-col justify-center gap-1 py-8"
            >
              {nav.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{
                    delay: 0.06 * i,
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`border-b border-white/8 py-4 font-display text-2xl font-semibold tracking-tight transition-colors ${
                    active === item.href.slice(1)
                      ? "text-white"
                      : "text-white/45 hover:text-white"
                  }`}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4 }}
              className="container-site pb-10 text-sm text-white/35"
            >
              {site.role}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

