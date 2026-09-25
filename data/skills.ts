export type Skill = {
  name: string;
  /** simple-icons slug used by TechIcon */
  icon: string;
  /** honest, professional proficiency 0–100 */
  level: number;
};

export type SkillCategory = {
  title: string;
  /** lucide icon name resolved in the Skills component */
  icon: "code" | "server" | "database" | "wrench";
  skills: Skill[];
};

export const skillCategories: SkillCategory[] = [
  {
    title: "Frontend",
    icon: "code",
    skills: [
      { name: "JavaScript", icon: "javascript", level: 90 },
      { name: "TypeScript", icon: "typescript", level: 85 },
      { name: "React", icon: "react", level: 90 },
      { name: "Next.js", icon: "nextdotjs", level: 85 },
      { name: "HTML5", icon: "html5", level: 95 },
      { name: "CSS3", icon: "css3", level: 88 },
      { name: "Tailwind CSS", icon: "tailwindcss", level: 85 },
      { name: "Bootstrap", icon: "bootstrap", level: 75 },
    ],
  },
  {
    title: "Backend",
    icon: "server",
    skills: [
      { name: "Node.js", icon: "nodedotjs", level: 85 },
      { name: "Express.js", icon: "express", level: 82 },
      { name: "REST APIs", icon: "restapi", level: 88 },
    ],
  },
  {
    title: "Databases",
    icon: "database",
    skills: [
      { name: "MongoDB", icon: "mongodb", level: 80 },
      { name: "PostgreSQL", icon: "postgresql", level: 78 },
      { name: "MySQL", icon: "mysql", level: 75 },
    ],
  },
  {
    title: "Tools",
    icon: "wrench",
    skills: [
      { name: "Git", icon: "git", level: 90 },
      { name: "GitHub", icon: "github", level: 88 },
      { name: "Docker", icon: "docker", level: 65 },
      { name: "VS Code", icon: "vscode", level: 92 },
    ],
  },
];