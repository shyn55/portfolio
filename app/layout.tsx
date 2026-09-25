import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const SITE_URL = "https://shayan.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shayan — Full-Stack Web Developer",
    template: "%s | Shayan",
  },
  description:
    "I'm Shayan, a Full-Stack Web Developer building modern, scalable and high-performance web applications with JavaScript, React, Next.js and Node.js.",
  keywords: [
    "Full-Stack Developer",
    "Web Developer",
    "React Developer",
    "Next.js Developer",
    "JavaScript Developer",
    "Node.js",
    "Portfolio",
  ],
  authors: [{ name: "Shayan" }],
  creator: "Shayan",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Shayan — Full-Stack Web Developer",
    title: "Shayan — Full-Stack Web Developer",
    description:
      "I'm Shayan, a Full-Stack Web Developer building modern, scalable and high-performance web applications.",
    images: [
      {
        url: "/images/og.png",
        width: 1200,
        height: 630,
        alt: "Shayan — Full-Stack Web Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shayan — Full-Stack Web Developer",
    description:
      "I'm Shayan, a Full-Stack Web Developer building modern, scalable and high-performance web applications.",
    images: ["/images/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}