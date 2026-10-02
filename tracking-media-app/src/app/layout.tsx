import type { Metadata } from "next";
import "./globals.css";
import "./modern-ui.css";

export const metadata: Metadata = {
  title: "Tracking Media",
  description: "Personal tracking and isolated organization workspaces.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

