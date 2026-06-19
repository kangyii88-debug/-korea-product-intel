import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LocaleProvider } from "@/components/locale-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sourcing Intelligence Cloud",
  description: "Independent AI sourcing intelligence workspace for Korean e-commerce product discovery and development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
