import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../src/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nova DevOps Copilot — Amazon Nova AI Hackathon",
  description:
    "4-agent DevOps pipeline assistant powered by Amazon Nova via AWS Bedrock. Monitor → Reason → Act → Escalate.",
  keywords: ["DevOps", "Amazon Nova", "AWS Bedrock", "AI", "Terraform", "CI/CD"],
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
