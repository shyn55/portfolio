"use client";

import { Mail } from "lucide-react";
import { socials } from "@/data/site";
import BrandIcon from "./BrandIcons";
import type { Social } from "@/data/site";

type SocialLinksProps = {
  /** "light" renders bordered circles for dark backgrounds, "dark" for light ones */
  tone?: "light" | "dark";
  className?: string;
};

export default function SocialLinks({
  tone = "light",
  className = "",
}: SocialLinksProps) {
  const base =
    tone === "light"
      ? "border-white/25 text-white hover:border-white hover:bg-white hover:text-ink"
      : "border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-white";

  return (
    <ul className={`flex items-center gap-4 ${className}`}>
      {socials.map((s: Social) => (
        <li key={s.label}>
          <a
            href={s.href}
            target={s.icon === "email" ? undefined : "_blank"}
            rel={s.icon === "email" ? undefined : "noopener noreferrer"}
            aria-label={s.label}
            title={s.label}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5 ${base}`}
          >
            {s.icon === "email" ? (
              <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <BrandIcon
                name={s.icon}
                className="h-[18px] w-[18px]"
              />
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}