// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Tailwind styles

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Expense Tracker - Next.js",
  description: "Track expenses using manual entry or AI-powered receipt scanning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100`}>{children}</body>
    </html>
  );
}