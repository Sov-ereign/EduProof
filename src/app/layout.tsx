import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduProof Zero - Skill Credentials That Can't Be Faked",
  description: "Web3-based system that issues tamper-proof, skill-level credentials backed by real evidence. Verified by AI and stored on Stellar blockchain.",
};

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PerformanceMonitor from "../components/PerformanceMonitor";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <PerformanceMonitor />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
