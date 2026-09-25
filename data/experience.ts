export type ExperienceItem = {
  role: string;
  company: string;
  period: string;
  description: string;
  tech: string[];
};

export const experience: ExperienceItem[] = [
  {
    role: "Senior Full-Stack Developer",
    company: "TechNova Solutions",
    period: "2027 — Present",
    description:
      "Leading development of scalable web platforms end-to-end — architecting REST APIs, building React frontends and mentoring junior developers.",
    tech: ["Next.js", "Node.js", "MongoDB", "Docker"],
  },
  {
    role: "Full-Stack Developer",
    company: "CodeCraft Studio",
    period: "2025 — 2027",
    description:
      "Delivered client projects from concept to deployment, including e-commerce stores, admin dashboards and booking systems with a focus on performance.",
    tech: ["React", "Express", "PostgreSQL", "Redis"],
  },
  {
    role: "Frontend Developer",
    company: "PixelForge Agency",
    period: "2023 — 2025",
    description:
      "Built responsive, accessible interfaces for marketing sites and web applications, working closely with designers and backend teams.",
    tech: ["JavaScript", "React", "SCSS", "Tailwind CSS"],
  },
  {
    role: "Freelance Web Developer",
    company: "Self-employed",
    period: "2022 — 2023",
    description:
      "Started my journey building websites and small web apps for local businesses, learning modern JavaScript and shipping real projects.",
    tech: ["HTML5", "CSS3", "JavaScript", "PHP"],
  },
];