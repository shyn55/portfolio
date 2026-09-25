"use client";

import { ArrowUp } from "lucide-react";
import Image from "next/image";
import SocialLinks from "./SocialLinks";
import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="bg-ink pb-8 pt-16 text-center">
      <div className="container-site">
        <a
          href="#home"
          className="inline-block"
          aria-label="Shayan — back to top"
        >
          <Image
            src="/images/logo2.png"
            alt="Shayan logo"
            width={48}
            height={48}
            className="h-12 w-12"
          />
        </a>
        <p className="mt-3 text-sm font-medium text-white/50">
          {site.role}
        </p>

        <SocialLinks tone="light" className="mt-7 justify-center" />

        <div className="mx-auto mt-10 h-px max-w-xs bg-white/10" />

        <div className="mt-7 flex flex-col items-center justify-between gap-4 text-xs text-white/40 sm:flex-row">
          <p>© 2026 {site.name}. All rights reserved.</p>
          <a
            href="#home"
            className="group inline-flex items-center gap-1.5 font-medium text-white/50 transition-colors hover:text-white"
          >
            Back to top
            <ArrowUp
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}