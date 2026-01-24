"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useScrollDirection } from "@/hooks/useScrollAnimation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollDirection = useScrollDirection();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-black/40 backdrop-blur-md border-b border-white/5"
      } ${
        scrollDirection === "down" && scrolled ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="container-custom max-w-7xl mx-auto">
        <div className="h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <ShieldCheck className="w-8 h-8 text-purple-500" />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors">
              EduProof Zero
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-6 text-sm font-medium text-gray-400">
              <Link
                href="/#features"
                className="hover:text-white transition-colors relative group"
              >
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/#how-it-works"
                className="hover:text-white transition-colors relative group"
              >
                How it Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300" />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/verifier">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Verifier Mode
                </motion.button>
              </Link>
              <Link href="/student">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Launch App
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl"
          >
            <div className="container-custom py-6 space-y-4">
              <Link
                href="/#features"
                onClick={() => setIsOpen(false)}
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setIsOpen(false)}
                className="block text-gray-400 hover:text-white transition-colors"
              >
                How it Works
              </Link>
              <div className="pt-4 space-y-3 border-t border-white/10">
                <Link href="/verifier" onClick={() => setIsOpen(false)}>
                  <button className="w-full text-left px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Verifier Mode
                  </button>
                </Link>
                <Link href="/student" onClick={() => setIsOpen(false)}>
                  <button className="w-full bg-white text-black px-4 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    Launch App
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
