/**
 * Seed source for the database (see scripts/seed-mongodb.ts) and the canonical
 * list of project categories. Once MongoDB Atlas is seeded, the public Works
 * section is served from the database — editing this file is not needed to
 * add or change portfolio projects (use the admin panel instead).
 */

export const PROJECT_CATEGORIES = ["Web Apps", "Frontend", "Full Stack", "UI/UX"] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type Project = {
  title: string;
  category: ProjectCategory;
  description: string;
  tech: string[];
  image: string;
  github: string;
  live: string;
};

export const filters = ["All", ...PROJECT_CATEGORIES] as const;

export const projects: Project[] = [
  {
    title: "CourseSite",
    category: "Web Apps",
    description:
      "An educational platform with a course catalog, student progress tracking, instructor dashboards and secure payments.",
    tech: ["Next.js", "MongoDB", "Stripe"],
    image: "/images/projects/project-1.png",
    github: "https://github.com/shayan/coursesite",
    live: "https://coursesite-demo.vercel.app",
  },
  {
    title: "Empire Gym",
    category: "Full Stack",
    description:
      "A gym management app handling memberships, trainer schedules, attendance and monthly billing across multiple branches.",
    tech: ["React", "Node.js", "PostgreSQL"],
    image: "/images/projects/project-2.png",
    github: "https://github.com/shayan/empire-gym",
    live: "https://empiregym-demo.vercel.app",
  },
  {
    title: "Todo PWA",
    category: "Frontend",
    description:
      "A fast, offline-first progressive web app for task management with drag-and-drop lists, reminders and local data sync.",
    tech: ["React", "IndexedDB", "Workbox"],
    image: "/images/projects/project-3.png",
    github: "https://github.com/shayan/todo-pwa",
    live: "https://todopwa-demo.vercel.app",
  },
  {
    title: "Developer Dashboard",
    category: "Full Stack",
    description:
      "An admin dashboard with real-time analytics, interactive charts and role-based access control for internal teams.",
    tech: ["Next.js", "Express", "MongoDB"],
    image: "/images/projects/project-4.png",
    github: "https://github.com/shayan/dev-dashboard",
    live: "https://devdashboard-demo.vercel.app",
  },
  {
    title: "Shopline",
    category: "UI/UX",
    description:
      "A clean e-commerce storefront with product filters, cart state management and a smooth, accessible checkout flow.",
    tech: ["React", "Tailwind CSS", "Context API"],
    image: "/images/projects/project-5.png",
    github: "https://github.com/shayan/shopline",
    live: "https://shopline-demo.vercel.app",
  },
  {
    title: "Nova Finance",
    category: "Web Apps",
    description:
      "A personal finance tracker with budgets, transaction reports and monthly insights, built for clarity and speed.",
    tech: ["Next.js", "PostgreSQL"],
    image: "/images/projects/project-6.png",
    github: "https://github.com/shayan/nova-finance",
    live: "https://novafinance-demo.vercel.app",
  },
];