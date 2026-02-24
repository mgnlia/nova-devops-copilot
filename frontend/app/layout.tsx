import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovaOps — AI DevOps Copilot powered by Amazon Nova",
  description: "Intelligent CI/CD automation, incident triage, and infrastructure insights powered by Amazon Nova AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
