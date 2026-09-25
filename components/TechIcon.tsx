import {
  siBootstrap,
  siCss,
  siDocker,
  siExpress,
  siGit,
  siGithub,
  siHtml5,
  siJavascript,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siReact,
  siTailwindcss,
  siTypescript,
} from "simple-icons";
import { vscodePath } from "./BrandIcons";

const icons: Record<string, { path: string }> = {
  bootstrap: siBootstrap,
  css3: siCss,
  docker: siDocker,
  express: siExpress,
  git: siGit,
  github: siGithub,
  html5: siHtml5,
  javascript: siJavascript,
  mongodb: siMongodb,
  mysql: siMysql,
  nextdotjs: siNextdotjs,
  nodedotjs: siNodedotjs,
  postgresql: siPostgresql,
  react: siReact,
  tailwindcss: siTailwindcss,
  typescript: siTypescript,
  vscode: { path: vscodePath },
};

type TechIconProps = {
  /** simple-icons slug */
  name: string;
  className?: string;
};

/** Monochrome brand icon — inherits currentColor so it stays neutral. */
export default function TechIcon({ name, className }: TechIconProps) {
  const icon = icons[name.toLowerCase()];
  if (!icon) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}