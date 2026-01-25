import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduProof - Blockchain Skill Verification",
  description: "Decentralized proof of skills on Stellar blockchain",
};

import ScrollReveal from "@/components/ScrollReveal";
import RoleChecker from "@/components/RoleChecker";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PerformanceMonitor from "@/components/PerformanceMonitor";

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <RoleChecker>
            <PerformanceMonitor />
            <Navbar />
            {children}
            <Footer />
          </RoleChecker>
        </Providers>
      </body>
    </html>
  );
}
