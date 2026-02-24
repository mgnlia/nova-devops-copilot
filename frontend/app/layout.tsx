import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nova DevOps Copilot — Amazon Nova AI Hackathon",
  description:
    "AI-powered infrastructure operations — Monitor → Reason (Amazon Nova Pro) → Act → Escalate",
  keywords: ["DevOps", "Amazon Nova", "AWS Bedrock", "AI", "Infrastructure", "SRE"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
