import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shopping List Recipe Recommender",
  description: "Generate recipe suggestions from your checked shopping items.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
