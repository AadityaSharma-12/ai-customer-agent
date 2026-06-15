import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InnovateNow AI | Customer Cancellation & Retention Portal",
  description: "Next-generation AI operations command center for customer success, retention audits, and Zoho integration logs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen text-zinc-100 bg-zinc-950 font-sans selection:bg-purple-500/30">
        {children}
      </body>
    </html>
  );
}
