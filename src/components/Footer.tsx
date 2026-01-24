"use client";

import Link from "next/link";
import { ShieldCheck, Github, Twitter, Linkedin, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-black border-t border-white/10 text-gray-400 py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent" />
      
      <div className="container-custom max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <ScrollReveal direction="up" threshold={0.2}>
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-7 h-7 text-purple-500" />
                <span className="text-xl font-bold text-white">EduProof Zero</span>
              </div>
              <p className="text-sm leading-relaxed mb-6 text-gray-500">
                Verifiable skill credentials for an AI-generated world. Built on Stellar blockchain.
              </p>
              <div className="flex gap-4">
                <motion.a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <Github className="w-5 h-5" />
                </motion.a>
                <motion.a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </motion.a>
                <motion.a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </motion.a>
              </div>
            </div>
          </ScrollReveal>

          {/* Platform Links */}
          <ScrollReveal direction="up" delay={0.1} threshold={0.2}>
            <div>
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/" className="hover:text-purple-400 transition-colors flex items-center gap-2 group">
                    Home
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/student" className="hover:text-purple-400 transition-colors flex items-center gap-2 group">
                    Prove Skill
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/verifier" className="hover:text-purple-400 transition-colors flex items-center gap-2 group">
                    Verify Wallet
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Resources */}
          <ScrollReveal direction="up" delay={0.2} threshold={0.2}>
            <div>
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/#how-it-works" className="hover:text-purple-400 transition-colors flex items-center gap-2 group">
                    Documentation
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors flex items-center gap-2 group">
                    GitHub Repo
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors flex items-center gap-2 group">
                    Smart Contract
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Legal */}
          <ScrollReveal direction="up" delay={0.3} threshold={0.2}>
            <div>
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors flex items-center gap-2 group">
                    Privacy Policy
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors flex items-center gap-2 group">
                    Terms of Service
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} EduProof Zero. All rights reserved.
          </p>
          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 rotate-[-45deg]" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
