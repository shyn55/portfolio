"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Send,
} from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import BrandIcon from "./BrandIcons";
import { site } from "@/data/site";

type Status = "idle" | "sending" | "success" | "error";
type Errors = Partial<Record<"name" | "subject" | "message", string>>;

const contactItems = [
  {
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
    icon: <Mail className="h-5 w-5" aria-hidden="true" />,
  },
  {
    label: "Location",
    value: site.location,
    href: undefined,
    icon: <MapPin className="h-5 w-5" aria-hidden="true" />,
  },
  {
    label: "GitHub",
    value: "github.com/shyn55",
    href: site.github,
    icon: <BrandIcon name="github" className="h-5 w-5" />,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/shayan",
    href: site.linkedin,
    icon: <BrandIcon name="linkedin" className="h-5 w-5" />,
  },
  {
    label: "Telegram",
    value: "@shayan_mir",
    href: site.telegram,
    icon: <BrandIcon name="telegram" className="h-5 w-5" />,
  },
];

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-4 py-3 text-sm text-ink placeholder:text-faint outline-none transition-all duration-200 focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-400/15"
      : "border-line focus:border-ink focus:ring-ink/10"
  }`;

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  const validate = (form: FormData): Errors => {
    const next: Errors = {};
    const name = String(form.get("name") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    if (!name) next.name = "Please enter your name.";
    if (!subject) next.subject = "Please enter a subject.";
    if (!message) next.message = "Please write a short message.";
    return next;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validate(new FormData(form));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("sending");
    try {
      // Simulated request — wire this to your API route or email service.
      await new Promise((resolve) => setTimeout(resolve, 1400));
      setStatus("success");
      form.reset();
      window.setTimeout(() => setStatus("idle"), 6000);
    } catch {
      setStatus("error");
    }
  };

  const clearError = (field: keyof Errors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <section id="contact" className="bg-mist py-24 md:py-32">
      <div className="container-site">
        <SectionHeading kicker="Contact" title="Get In Touch" />

        <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Left: centered intro + contact tiles */}
          <Reveal>
            <div className="text-center lg:pr-4">
              <p className="font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.7rem]">
                Have a project in mind or want to work together?
              </p>
              <p className="mx-auto mt-4 max-w-md leading-relaxed text-body">
                I&apos;m always open to new opportunities, collaborations and
                interesting ideas. Feel free to reach out — I usually reply
                within a day.
              </p>

              <ul className="mx-auto mt-12 flex max-w-full flex-wrap justify-center gap-x-5 gap-y-10 px-1 sm:gap-x-7">
                {contactItems.map((item) => {
                  const inner = (
                    <>
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-white text-ink shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-ink/30 group-hover:shadow-md">
                        {item.icon}
                      </span>
                      <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
                        {item.label}
                      </span>
                      <span className="mt-1 break-all px-1 text-xs font-medium text-ink transition-colors duration-300 group-hover:text-ink-soft">
                        {item.value}
                      </span>
                    </>
                  );
                  return (
                    <li key={item.label} className="w-36 sm:w-40">
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="group flex flex-col items-center rounded-3xl text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/40"
                        >
                          {inner}
                        </a>
                      ) : (
                        <div className="group flex flex-col items-center text-center">
                          {inner}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>

          {/* Right: form — sits directly on the section background, no card */}
          <Reveal delay={0.12}>
            <form
              onSubmit={onSubmit}
              noValidate
              className="lg:border-l lg:border-ink/10 lg:pl-12"
            >
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Name <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  aria-required="true"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  onChange={() => clearError("name")}
                  className={inputClass(Boolean(errors.name))}
                />
                {errors.name && (
                  <p id="contact-name-error" role="alert" className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="contact-subject"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Subject <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  placeholder="What is this about?"
                  aria-required="true"
                  aria-invalid={errors.subject ? true : undefined}
                  aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                  onChange={() => clearError("subject")}
                  className={inputClass(Boolean(errors.subject))}
                />
                {errors.subject && (
                  <p id="contact-subject-error" role="alert" className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.subject}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="contact-message"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Message <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  placeholder="Tell me about your project…"
                  aria-required="true"
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? "contact-message-error" : undefined}
                  onChange={() => clearError("message")}
                  className={`${inputClass(Boolean(errors.message))} resize-y`}
                />
                {errors.message && (
                  <p id="contact-message-error" role="alert" className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="group mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-10 py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-dark hover:shadow-[0_16px_34px_-14px_rgba(17,24,39,0.55)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send Message
                    <Send
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>

              {/* Status feedback */}
              <div role="status" aria-live="polite" className="mt-4 min-h-6">
                {status === "success" && (
                  <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Thanks for reaching out! I&apos;ll get back to you soon.
                  </p>
                )}
                {status === "error" && (
                  <p className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Something went wrong. Please try again or email me directly.
                  </p>
                )}
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
