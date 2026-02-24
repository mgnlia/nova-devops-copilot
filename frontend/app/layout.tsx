import type { Metadata } from "next";
import "../src/app/globals.css";

export const metadata: Metadata = {
  title: "Nova DevOps Copilot — Amazon Nova AI Hackathon",
  description: "4-agent DevOps pipeline assistant powered by Amazon Nova Pro via AWS Bedrock.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950">{children}</body>
    </html>
  );
}
