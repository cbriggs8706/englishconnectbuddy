import type { Metadata } from "next";
import { Nunito, Sora } from "next/font/google";
import "./globals.css";
import { RootProviders } from "@/components/providers/root-providers";

const headingFont = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EnglishConnect Buddy",
  description: "Language learning app for EnglishConnect curriculum",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable} antialiased`}>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
