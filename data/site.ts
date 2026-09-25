export type Social = {
  label: string;
  href: string;
  /** simple-icons slug (github, linkedin, instagram) or "email" for mailto */
  icon: "github" | "linkedin" | "instagram" | "email";
};

export const site = {
  name: "Shayan",
  brand: "/images/logo2.png",
  role: "Full-Stack Web Developer",
  tagline:
    "I build modern, scalable and high-performance web applications with clean code and a sharp eye for detail.",
  email: "shayan.mir1380@gmail.com",
  location: "Karaj . Mehr Shahr",
  github: "https://github.com/shyn55",
  linkedin: "https://linkedin.com/in/shayan",
  telegram: "https://t.me/shayan_mir",
  cv: "/cv/shayan-cv2.pdf",
};

export const nav = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Certificate", href: "#certificate" },
  { label: "Skills", href: "#skills" },
  { label: "Works", href: "#works" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
] as const;

export const socials: Social[] = [
  { label: "GitHub", href: "https://github.com/shyn55", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/shayan-mirdavoudi/", icon: "linkedin" },
  { label: "Instagram", href: "", icon: "instagram" },
  { label: "Email", href: "", icon: "email" },
];